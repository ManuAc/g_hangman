const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const Room = require('./models/Room');
const { getTotalStrikes, isGameOver, calculatePoints, getLeaderboard } = require('./utils/gameLogic');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store rooms in memory
const rooms = new Map();
const timers = new Map();

// Create room
app.post('/api/create-room', (req, res) => {
  const { hostName } = req.body;
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const hostId = uuidv4();
  
  const room = new Room(roomId, hostId, hostName, null);
  rooms.set(roomId, room);
  
  res.json({ roomId, hostId, hostName });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, playerId, playerName }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    socket.join(roomId);
    
    // Update or add player
    let player = room.getPlayer(playerId);
    if (player) {
      player.socketId = socket.id;
    } else {
      player = room.addPlayer(playerId, playerName, socket.id);
    }

    socket.emit('joined-room', { 
      playerId, 
      roomId,
      isHost: player.isHost 
    });
    
    io.to(roomId).emit('game-state', room.getGameState());
    io.to(roomId).emit('player-joined', { playerName });
  });

  // Start game
  socket.on('start-game', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.getPlayer(playerId);
    if (!player || !player.isHost) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }

    if (room.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    room.gameStarted = true;
    room.currentRound = 1;
    room.wordSetterIndex = 0;
    room.players[0].isWordSetter = true;
    
    io.to(roomId).emit('game-started', room.getGameState());
  });

  // Set secret word
  socket.on('set-word', ({ roomId, playerId, word }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.getPlayer(playerId);
    const wordSetter = room.getWordSetter();
    
    if (!player || player.id !== wordSetter.id) {
      socket.emit('error', { message: 'You are not the word setter' });
      return;
    }

    if (!word || word.length < 3) {
      socket.emit('error', { message: 'Word must be at least 3 letters' });
      return;
    }

    room.setSecretWord(word);
    room.roundInProgress = true;
    
    // Set first turn to next player after word setter
    room.currentTurnIndex = (room.wordSetterIndex + 1) % room.players.length;
    
    io.to(roomId).emit('round-started', room.getGameState());
    
    // Start turn timer
    startTurnTimer(roomId);
  });

  // Guess letter
  socket.on('guess-letter', ({ roomId, playerId, letter }) => {
    const room = rooms.get(roomId);
    if (!room || !room.roundInProgress) return;

    const player = room.getPlayer(playerId);
    const currentPlayer = room.getCurrentPlayer();
    
    if (!player || player.id !== currentPlayer.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    if (!/^[A-Z]$/i.test(letter)) {
      socket.emit('error', { message: 'Invalid letter' });
      return;
    }

    clearTurnTimer(roomId);

    const result = room.guessLetter(letter);
    
    if (result.alreadyGuessed) {
      socket.emit('error', { message: 'Letter already guessed' });
      startTurnTimer(roomId);
      return;
    }

    if (!result.correct) {
      player.addStrike();
      io.to(roomId).emit('wrong-guess', {
        playerId: player.id,
        playerName: player.name,
        letter: result.letter,
        strikes: player.strikes,
        totalStrikes: getTotalStrikes(room)
      });
    } else {
      io.to(roomId).emit('correct-guess', {
        playerId: player.id,
        playerName: player.name,
        letter: result.letter,
        revealedWord: result.revealedWord
      });
    }

    // Check if word is complete
    if (room.isWordComplete()) {
      const points = calculatePoints(room.currentRound, player.strikes);
      player.addScore(points);
      
      io.to(roomId).emit('round-won', {
        winnerId: player.id,
        winnerName: player.name,
        secretWord: room.secretWord,
        points
      });

      endRound(roomId);
      return;
    }

    // Check if max strikes reached
    if (isGameOver(room)) {
      io.to(roomId).emit('round-lost', {
        secretWord: room.secretWord,
        totalStrikes: getTotalStrikes(room)
      });

      endRound(roomId);
      return;
    }

    // Next turn
    room.nextTurn();
    io.to(roomId).emit('game-state', room.getGameState());
    startTurnTimer(roomId);
  });

  // Chat message
  socket.on('send-message', ({ roomId, playerId, message }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.addMessage(playerId, message);
    io.to(roomId).emit('new-message', room.messages[room.messages.length - 1]);
  });

  // Next round
  socket.on('next-round', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.currentRound >= room.totalRounds) {
      // Game over
      const leaderboard = getLeaderboard(room);
      io.to(roomId).emit('game-over', { leaderboard });
      return;
    }

    room.nextRound();
    room.players[room.wordSetterIndex].isWordSetter = true;
    
    io.to(roomId).emit('waiting-for-word', room.getGameState());
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and remove player from rooms
    for (const [roomId, room] of rooms.entries()) {
      const player = room.getPlayerBySocketId(socket.id);
      if (player) {
        room.removePlayer(player.id);
        io.to(roomId).emit('player-left', { 
          playerId: player.id,
          playerName: player.name 
        });
        io.to(roomId).emit('game-state', room.getGameState());
        
        // Delete empty rooms
        if (room.players.length === 0) {
          clearTurnTimer(roomId);
          rooms.delete(roomId);
        }
      }
    }
  });
});

// Turn timer functions
function startTurnTimer(roomId) {
  clearTurnTimer(roomId);

  const room = rooms.get(roomId);   // ✅ Move this up
  if (!room) return;

  const timer = setTimeout(() => {
    if (!room.roundInProgress) return;

    const currentPlayer = room.getCurrentPlayer();
    currentPlayer.addStrike();
    
    io.to(roomId).emit('turn-timeout', {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      strikes: currentPlayer.strikes,
      totalStrikes: getTotalStrikes(room)
    });

    // Check if max strikes reached
    if (isGameOver(room)) {
      io.to(roomId).emit('round-lost', {
        secretWord: room.secretWord,
        totalStrikes: getTotalStrikes(room)
      });
      endRound(roomId);
      return;
    }

    // Next turn
    room.nextTurn();
    io.to(roomId).emit('game-state', room.getGameState());
    startTurnTimer(roomId);
  }, room.turnDuration);   // ✅ now room is defined here

  timers.set(roomId, timer);
}


function clearTurnTimer(roomId) {
  const timer = timers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(roomId);
  }
}

function endRound(roomId) {
  clearTurnTimer(roomId);
  const room = rooms.get(roomId);
  if (!room) return;

  room.roundInProgress = false;
  
  setTimeout(() => {
    io.to(roomId).emit('game-state', room.getGameState());
  }, 3000);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});