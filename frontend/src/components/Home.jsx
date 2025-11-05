import React from 'react';

function Home({ onCreateRoom, onJoinRoom }) {
  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="game-title">🎮 HANGMAN</h1>
        <p className="game-subtitle">Multiplayer Edition</p>
        
        <div className="home-buttons">
          <button className="btn btn-primary" onClick={onCreateRoom}>
            Create Room
          </button>
          <button className="btn btn-secondary" onClick={onJoinRoom}>
            Join Room
          </button>
        </div>

        <div className="game-rules">
          <h3>How to Play:</h3>
          <ul>
            <li>Create or join a room with friends</li>
            <li>Take turns guessing letters</li>
            <li>Guess the word before running out of tries</li>
            <li>Earn points for solving words!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;