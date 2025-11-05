import React, { useState, useEffect } from 'react';
import HangmanCanvas from './HangmanCanvas';
import WordDisplay from './WordDisplay';
import PlayerList from './PlayerList';
import Chat from './Chat';
import GameOver from './GameOver';

function GameRoom({ socket, playerData, roomData, onLeave }) {
  const [gameState, setGameState] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [letterInput, setLetterInput] = useState('');
  const [notification, setNotification] = useState('');
  const [showGameOver, setShowGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Join the room
    socket.emit('join-room', {
      roomId: roomData.roomId,
      playerId: playerData.playerId || playerData.hostId,
      playerName: playerData.playerName || playerData.hostName
    });

    socket.on('joined-room', (data) => {
      setIsHost(data.isHost);
    });

    socket.on('game-state', (state) => {
      setGameState(state);
    });

    socket.on('player-joined', (data) => {
      showNotification(`${data.playerName} joined the room`);
    });

    socket.on('player-left', (data) => {
      showNotification(`${data.playerName} left the room`);
    });

    socket.on('game-started', (state) => {
      setGameState(state);
      showNotification('Game started! Waiting for word...');
    });

    socket.on('waiting-for-word', (state) => {
      setGameState(state);
      showNotification('Waiting for word setter...');
    });

    socket.on('round-started', (state) => {
      setGameState(state);
      showNotification('Round started! Start guessing!');
    });

    socket.on('correct-guess', (data) => {
      showNotification(`${data.playerName} guessed "${data.letter}" correctly!`);
    });

    socket.on('wrong-guess', (data) => {
      showNotification(`${data.playerName} guessed "${data.letter}" wrong! (${data.totalStrikes}/6 strikes)`);
    });

    socket.on('turn-timeout', (data) => {
      showNotification(`${data.playerName} ran out of time! (${data.totalStrikes}/6 strikes)`);
    });

    socket.on('round-won', (data) => {
      showNotification(`🎉 ${data.winnerName} won! Word was "${data.secretWord}". Points: ${data.points}`);
    });

    socket.on('round-lost', (data) => {
      showNotification(`💀 Round lost! Word was "${data.secretWord}"`);
    });

    socket.on('game-over', (data) => {
      setLeaderboard(data.leaderboard);
      setShowGameOver(true);
    });

    socket.on('error', (data) => {
      showNotification(`❌ ${data.message}`);
    });

    return () => {
      socket.off('joined-room');
      socket.off('game-state');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-started');
      socket.off('waiting-for-word');
      socket.off('round-started');
      socket.off('correct-guess');
      socket.off('wrong-guess');
      socket.off('turn-timeout');
      socket.off('round-won');
      socket.off('round-lost');
      socket.off('game-over');
      socket.off('error');
    };
  }, [socket, playerData, roomData]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleStartGame = () => {
    socket.emit('start-game', {
      roomId: roomData.roomId,
      playerId: playerData.playerId || playerData.hostId
    });
  };

  const handleSetWord = (e) => {
    e.preventDefault();
    if (wordInput.trim().length < 3) {
      showNotification('Word must be at least 3 letters');
      return;
    }

    socket.emit('set-word', {
      roomId: roomData.roomId,
      playerId: playerData.playerId || playerData.hostId,
      word: wordInput.trim()
    });

    setWordInput('');
  };

  const handleGuessLetter = (e) => {
    e.preventDefault();
    if (!/^[A-Z]$/i.test(letterInput)) {
      showNotification('Please enter a single letter');
      return;
    }

    socket.emit('guess-letter', {
      roomId: roomData.roomId,
      playerId: playerData.playerId || playerData.hostId,
      letter: letterInput.toUpperCase()
    });

    setLetterInput('');
  };

  const handleNextRound = () => {
    socket.emit('next-round', { roomId: roomData.roomId });
    setShowGameOver(false);
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}?join=${roomData.roomId}`;
    navigator.clipboard.writeText(inviteLink);
    showNotification('Invite link copied!');
  };

  if (showGameOver) {
    return (
      <GameOver 
        leaderboard={leaderboard}
        onNextRound={handleNextRound}
        onLeave={onLeave}
        currentRound={gameState?.currentRound}
        totalRounds={gameState?.totalRounds}
      />
    );
  }

  if (!gameState) {
    return <div className="loading">Loading...</div>;
  }

  const currentPlayer = gameState.players.find(
    p => p.id === (playerData.playerId || playerData.hostId)
  );
  const wordSetter = gameState.players[gameState.wordSetterIndex];
  const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];
  const isMyTurn = currentTurnPlayer?.id === currentPlayer?.id;
  const isWordSetter = wordSetter?.id === currentPlayer?.id;
  const totalStrikes = gameState.players.reduce((sum, p) => 
    p.id !== wordSetter?.id ? sum + p.strikes : sum, 0
  );

  return (
    <div className="game-room">
      <div className="game-header">
        <div className="room-info">
          <h2>Room: {roomData.roomId}</h2>
          <button className="btn btn-small" onClick={handleCopyInviteLink}>
            📋 Copy Invite
          </button>
        </div>
        <div className="round-info">
          Round {gameState.currentRound} / {gameState.totalRounds}
        </div>
        <button className="btn btn-danger btn-small" onClick={onLeave}>
          Leave
        </button>
      </div>

      {notification && (
        <div className="notification">{notification}</div>
      )}

      <div className="game-content">
        <div className="game-left">
          <PlayerList 
            players={gameState.players}
            currentPlayerId={currentPlayer?.id}
            wordSetterId={wordSetter?.id}
            currentTurnId={currentTurnPlayer?.id}
          />

          {!gameState.gameStarted && isHost && (
            <div className="start-section">
              <button 
                className="btn btn-primary btn-block"
                onClick={handleStartGame}
                disabled={gameState.players.length < 2}
              >
                Start Game
              </button>
              {gameState.players.length < 2 && (
                <p className="info-text">Need at least 2 players</p>
              )}
            </div>
          )}

          {gameState.gameStarted && !gameState.roundInProgress && isWordSetter && (
            <div className="word-input-section">
              <h3>Set Secret Word</h3>
              <form onSubmit={handleSetWord}>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Enter secret word"
                  className="word-input"
                  maxLength={20}
                />
                <button type="submit" className="btn btn-primary btn-block">
                  Set Word
                </button>
              </form>
            </div>
          )}

          {gameState.roundInProgress && !isWordSetter && (
            <div className="guess-section">
              <div className="keyboard">
                <div className="alphabet-grid">
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                    <button
                      key={letter}
                      className={`letter-btn ${
                        gameState.guessedLetters.includes(letter) ? 'used' : ''
                      }`}
                      onClick={() => {
                        if (isMyTurn && !gameState.guessedLetters.includes(letter)) {
                          socket.emit('guess-letter', {
                            roomId: roomData.roomId,
                            playerId: currentPlayer.id,
                            letter
                          });
                        }
                      }}
                      disabled={!isMyTurn || gameState.guessedLetters.includes(letter)}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              {isMyTurn && (
                <div className="turn-indicator">
                  🎯 Your Turn!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="game-center">
          <HangmanCanvas strikes={totalStrikes} maxStrikes={6} />
          
          {gameState.roundInProgress && (
            <WordDisplay 
              revealedWord={gameState.revealedWord}
              guessedLetters={gameState.guessedLetters}
            />
          )}

          {gameState.roundInProgress && (
            <div className="game-info">
              <div className="strikes-info">
                ❌ Strikes: {totalStrikes} / 6
              </div>
              {currentTurnPlayer && (
                <div className="current-turn">
                  🎮 Turn: {currentTurnPlayer.name}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="game-right">
          <Chat 
            socket={socket}
            roomId={roomData.roomId}
            playerId={currentPlayer?.id}
            messages={gameState.messages}
          />
        </div>
      </div>
    </div>
  );
}

export default GameRoom;