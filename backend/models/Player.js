class Player {
  constructor(id, name, socketId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.strikes = 0;
    this.isHost = false;
    this.isWordSetter = false;
  }

  addScore(points) {
    this.score += points;
  }

  addStrike() {
    this.strikes += 1;
  }

  resetStrikes() {
    this.strikes = 0;
  }

  resetForNewRound() {
    this.strikes = 0;
    this.isWordSetter = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      strikes: this.strikes,
      isHost: this.isHost,
      isWordSetter: this.isWordSetter
    };
  }
}

module.exports = Player;