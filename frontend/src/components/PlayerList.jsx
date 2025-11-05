import React from 'react';

function PlayerList({ players, currentPlayerId, wordSetterId, currentTurnId }) {
  return (
    <div className="player-list">
      <h3>Players</h3>
      <div className="players">
        {players.map(player => (
          <div 
            key={player.id} 
            className={`player-card ${
              player.id === currentPlayerId ? 'current-player' : ''
            } ${
              player.id === currentTurnId ? 'active-turn' : ''
            }`}
          >
            <div className="player-info">
              <div className="player-name">
                {player.name}
                {player.isHost && <span className="badge host">👑 Host</span>}
                {player.id === wordSetterId && (
                  <span className="badge word-setter">📝 Word Setter</span>
                )}
                {player.id === currentPlayerId && (
                  <span className="badge you">You</span>
                )}
              </div>
              <div className="player-stats">
                <span className="score">🏆 {player.score}</span>
                {player.id !== wordSetterId && player.strikes > 0 && (
                  <span className="strikes">❌ {player.strikes}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerList;