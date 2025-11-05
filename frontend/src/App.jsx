import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import GameRoom from './components/GameRoom';

const SERVER_URL = 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [playerData, setPlayerData] = useState(null);
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleCreateRoom = (data) => {
    setPlayerData(data);
    setRoomData({ roomId: data.roomId });
    setCurrentPage('game');
  };

  const handleJoinRoom = (data) => {
    setPlayerData(data);
    setRoomData({ roomId: data.roomId });
    setCurrentPage('game');
  };

  const handleLeaveRoom = () => {
    setCurrentPage('home');
    setPlayerData(null);
    setRoomData(null);
  };

  return (
    <div className="App">
      {currentPage === 'home' && (
        <Home 
          onCreateRoom={() => setCurrentPage('create')}
          onJoinRoom={() => setCurrentPage('join')}
        />
      )}
      
      {currentPage === 'create' && (
        <CreateRoom 
          onRoomCreated={handleCreateRoom}
          onBack={() => setCurrentPage('home')}
        />
      )}
      
      {currentPage === 'join' && (
        <JoinRoom 
          socket={socket}
          onJoined={handleJoinRoom}
          onBack={() => setCurrentPage('home')}
        />
      )}
      
      {currentPage === 'game' && socket && playerData && roomData && (
        <GameRoom 
          socket={socket}
          playerData={playerData}
          roomData={roomData}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;