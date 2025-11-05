import React from 'react';

function GameOver({ leaderboard, onNextRound, onLeave, currentRound, totalRounds }) {
  const isGameComplete = currentRound >= totalRounds;

  return (
    <div className="game-over-container">
      <div className="game-over-card">
        <h1>{isGameComplete ? '🎉 Game Complete!' : '🏆 Round Results'}</h1>
        
        <div className="leaderboard">
          <h2>Leaderboard</h2>
          {leaderboard.map((player, index) => (
            <div key={player.id} className={`leaderboard-item rank-${index + 1}`}>
              <div className="rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <div className="player-name">{player.name}</div>
              <div className="player-score">{player.score} pts</div>
            </div>
          ))}
        </div>

        <div className="game-over-actions">
          {!isGameComplete && (
            <button className="btn btn-primary" onClick={onNextRound}>
              Next Round
            </button>
          )}
          <button className="btn btn-secondary" onClick={onLeave}>
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOver;