import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

function JoinRoom({ socket, onJoined, onBack }) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomId.trim()) {
      setError('Please enter room ID');
      return;
    }

    setLoading(true);
    setError('');

    const playerId = uuidv4();
    
    socket.emit('join-room', {
      roomId: roomId.trim().toUpperCase(),
      playerId,
      playerName: playerName.trim()
    });

    socket.once('joined-room', (data) => {
      setLoading(false);
      onJoined({
        ...data,
        playerName: playerName.trim()
      });
    });

    socket.once('error', (data) => {
      setLoading(false);
      setError(data.message || 'Failed to join room');
    });
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <button className="back-btn" onClick={onBack}>← Back</button>
        
        <h2>Join Room</h2>
        
        <form onSubmit={handleJoinRoom}>
          <div className="form-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter room ID"
              maxLength={8}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinRoom;