import React from 'react';

function WordDisplay({ revealedWord, guessedLetters }) {
  return (
    <div className="word-display-container">
      <div className="word-display">
        {revealedWord.map((letter, index) => (
          <span key={index} className="letter-box">
            {letter}
          </span>
        ))}
      </div>
      
      <div className="guessed-letters">
        <h4>Guessed Letters:</h4>
        <div className="letters-list">
          {guessedLetters.length > 0 ? (
            guessedLetters.map((letter, index) => (
              <span key={index} className="guessed-letter">
                {letter}
              </span>
            ))
          ) : (
            <span className="no-letters">None yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default WordDisplay;