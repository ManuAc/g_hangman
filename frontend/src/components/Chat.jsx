import React, { useState, useEffect, useRef } from 'react';

function Chat({ socket, roomId, playerId, messages }) {
  const [messageInput, setMessageInput] = useState('');
  const [localMessages, setLocalMessages] = useState(messages || []);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setLocalMessages(messages || []);
  }, [messages]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      setLocalMessages(prev => [...prev, message]);
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    socket.emit('send-message', {
      roomId,
      playerId,
      message: messageInput.trim()
    });

    setMessageInput('');
  };

  return (
    <div className="chat-container">
      <h3>Chat</h3>
      
      <div className="chat-messages">
        {localMessages.length === 0 ? (
          <div className="no-messages">No messages yet</div>
        ) : (
          localMessages.map(msg => (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.playerId === playerId ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-author">{msg.playerName}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
          maxLength={200}
        />
        <button type="submit" className="btn btn-primary btn-small">
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;