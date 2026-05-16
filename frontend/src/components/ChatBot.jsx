import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const ChatBot = ({ portfolio, funds }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am your Stonks Assistant. How can I help you with your portfolio today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simple bot response logic
    setTimeout(() => {
      let botResponse = 'I am not sure how to answer that. Try asking about your total value or funds.';
      const text = input.toLowerCase();

      if (text.includes('value') || text.includes('portfolio')) {
        botResponse = `Your current total portfolio value is $${portfolio?.total_value?.toLocaleString() || 'N/A'}.`;
      } else if (text.includes('funds') || text.includes('list')) {
        botResponse = `You have ${funds?.length || 0} funds available in your overview.`;
      } else if (text.includes('hello') || text.includes('hi')) {
        botResponse = 'Hello! How can I help you today?';
      }

      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    }, 600);
  };

  return (
    <div className="chatbot-wrapper">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-trigger"
          aria-label="Open chat"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div className="chatbot-window">
          <div className="chat-header">
            <div className="chat-title">
              <div className="status-dot" />
              <span>Stonks AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="close-btn" aria-label="Close chat">
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className="message-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <div className="input-wrapper">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your portfolio..."
                className="chat-input"
              />
              <button
                onClick={handleSend}
                className="send-btn"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
