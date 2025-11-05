function calculateMaxStrikes(players) {
  // Total strikes allowed = 6 (classic hangman)
  return 6;
}

function calculatePoints(roundNumber, strikes) {
  // More points for later rounds and fewer strikes
  const basePoints = 100;
  const roundMultiplier = roundNumber;
  const strikesPenalty = strikes * 5;
  
  return Math.max(basePoints * roundMultiplier - strikesPenalty, 50);
}

function getTotalStrikes(room) {
  return room.players.reduce((sum, player) => {
    if (player.id !== room.getWordSetter().id) {
      return sum + player.strikes;
    }
    return sum;
  }, 0);
}

function isGameOver(room) {
  return getTotalStrikes(room) >= room.maxStrikes;
}

function getWinner(room) {
  if (room.players.length === 0) return null;
  
  return room.players.reduce((winner, player) => {
    return player.score > winner.score ? player : winner;
  }, room.players[0]);
}

function getLeaderboard(room) {
  return [...room.players]
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      rank: index + 1,
      ...player.toJSON()
    }));
}

module.exports = {
  calculateMaxStrikes,
  calculatePoints,
  getTotalStrikes,
  isGameOver,
  getWinner,
  getLeaderboard
};