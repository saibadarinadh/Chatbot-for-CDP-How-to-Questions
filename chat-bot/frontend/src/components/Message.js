import React, { useState } from 'react';
import './Message.css';
import ReactMarkdown from 'react-markdown';

const Message = ({ type, text, context }) => {
  const [showContext, setShowContext] = useState(false);
  
  // Format URLs
  const formatUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => `[${url}](${url})`);
  };
  
  return (
    <div className={`message ${type}-message`}>
      <div className="message-avatar">
        {type === 'bot' ? '🤖' : '👤'}
      </div>
      <div className="message-content">
        <ReactMarkdown>{formatUrls(text)}</ReactMarkdown>
        
        {context && context.length > 0 && (
          <div className="message-context">
            <button 
              className="context-toggle" 
              onClick={() => setShowContext(!showContext)}
            >
              {showContext ? 'Hide sources' : 'Show sources'}
            </button>
            
            {showContext && (
              <div className="context-details">
                <h4>Sources:</h4>
                <ul>
                  {context.map((source, index) => (
                    <li key={index}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title} ({source.cdp})
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;