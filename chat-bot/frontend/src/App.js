import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import Message from './components/Message';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "👋 Hi there! I'm your CDP Support Assistant. I can help you with how-to questions about Segment, mParticle, Lytics, and Zeotap. What would you like to know?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessageId = Date.now();
    setMessages(prev => [...prev, { id: userMessageId, type: 'user', text: input }]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the API
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();

      // Add bot response to chat
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          type: 'bot', 
          text: data.answer,
          context: data.context, // Store context for potential display
          queryType: data.query_type,
        }]);
        setIsLoading(false);
      }, 500); // Small delay for a more natural feeling
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'bot', 
        text: "Sorry, I encountered an error processing your question. Please try again.",
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>CDP Support Assistant</h1>
        <p>Ask how-to questions about Segment, mParticle, Lytics, and Zeotap</p>
      </header>
      <main className="App-main">
        <div className="chat-container">
          <div className="messages-container">
            {messages.map(message => (
              <Message 
                key={message.id} 
                type={message.type} 
                text={message.text} 
                context={message.context}
              />
            ))}
            {isLoading && 
              <div className="message bot-message loading">
                <div className="loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            }
            <div ref={messagesEndRef} />
          </div>
          <ChatInterface 
            input={input} 
            setInput={setInput} 
            handleSendMessage={handleSendMessage} 
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}

export default App;