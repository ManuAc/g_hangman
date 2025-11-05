const Player = require('./Player');

class Room {
  constructor(roomId, hostId, hostName, hostSocketId) {
    this.roomId = roomId;
    this.players = [];
    this.currentRound = 0;
    this.totalRounds = 5;
    this.secretWord = '';
    this.revealedWord = [];
    this.guessedLetters = [];
    this.currentTurnIndex = 0;
    this.wordSetterIndex = 0;
    this.maxStrikes = 6;
    this.gameStarted = false;
    this.roundInProgress = false;
    this.turnTimer = null;
    this.turnDuration = 30000; // 30 seconds
    this.messages = [];
    
    // Add host as first player
    const host = new Player(hostId, hostName, hostSocketId);
    host.isHost = true;
    this.players.push(host);
  }

  addPlayer(playerId, playerName, socketId) {
    const player = new Player(playerId, playerName, socketId);
    this.players.push(player);
    return player;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      const removedPlayer = this.players.splice(index, 1)[0];
      
      // If host leaves, assign new host
      if (removedPlayer.isHost && this.players.length > 0) {
        this.players[0].isHost = true;
      }
      
      return removedPlayer;
    }
    return null;
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  getPlayerBySocketId(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  setSecretWord(word) {
    this.secretWord = word.toUpperCase();
    this.revealedWord = Array(word.length).fill('_');
    this.guessedLetters = [];
  }

  guessLetter(letter) {
    const upperLetter = letter.toUpperCase();
    
    if (this.guessedLetters.includes(upperLetter)) {
      return { alreadyGuessed: true };
    }

    this.guessedLetters.push(upperLetter);
    
    let revealed = false;
    for (let i = 0; i < this.secretWord.length; i++) {
      if (this.secretWord[i] === upperLetter) {
        this.revealedWord[i] = upperLetter;
        revealed = true;
      }
    }

    return { 
      correct: revealed, 
      revealedWord: this.revealedWord,
      letter: upperLetter
    };
  }

  isWordComplete() {
    return !this.revealedWord.includes('_');
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  getWordSetter() {
    return this.players[this.wordSetterIndex];
  }

  nextTurn() {
    // Skip word setter
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    } while (this.currentTurnIndex === this.wordSetterIndex);
  }

  nextRound() {
    this.currentRound += 1;
    this.wordSetterIndex = (this.wordSetterIndex + 1) % this.players.length;
    this.currentTurnIndex = (this.wordSetterIndex + 1) % this.players.length;
    this.secretWord = '';
    this.revealedWord = [];
    this.guessedLetters = [];
    this.roundInProgress = false;
    
    // Reset all player strikes
    this.players.forEach(p => p.resetForNewRound());
  }

  getGameState() {
    return {
      roomId: this.roomId,
      players: this.players.map(p => p.toJSON()),
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      revealedWord: this.revealedWord,
      guessedLetters: this.guessedLetters,
      currentTurnIndex: this.currentTurnIndex,
      wordSetterIndex: this.wordSetterIndex,
      gameStarted: this.gameStarted,
      roundInProgress: this.roundInProgress,
      messages: this.messages
    };
  }

  addMessage(playerId, message) {
    const player = this.getPlayer(playerId);
    this.messages.push({
      id: Date.now(),
      playerId,
      playerName: player ? player.name : 'Unknown',
      message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = Room;