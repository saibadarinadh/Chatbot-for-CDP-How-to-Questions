import React from 'react';
import './ChatInterface.css';

const ChatInterface = ({ input, setInput, handleSendMessage, isLoading }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-interface">
      <textarea
        className="chat-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about CDPs..."
        disabled={isLoading}
      />
      <button 
        className="send-button" 
        onClick={handleSendMessage}
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default ChatInterface;