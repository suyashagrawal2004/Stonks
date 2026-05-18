import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const ChatBot = ({ portfolio, funds }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am your Stonks AI Assistant. How can I help you analyze your portfolio and find the best mutual funds to invest in?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (customMessage) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || isTyping) return;

    if (!customMessage) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsTyping(true);

    try {
      const response = await fetch('https://stonks-backend-qfl6.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          portfolio_context: portfolio || {},
          funds_context: funds || []
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I am having trouble connecting to the server. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "Which mutual fund should I invest in?",
    "Analyze my current portfolio",
    "What is the best fund for low risk?"
  ];

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
                  {msg.content.split('\n').map((paragraph, pIdx) => {
                    if (!paragraph.trim()) return null;
                    const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={pIdx} style={{ marginBottom: '0.5rem' }}>
                        {parts.map((part, index) => 
                          part.startsWith('**') && part.endsWith('**') 
                            ? <strong key={index}>{part.slice(2, -2)}</strong> 
                            : part
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-row bot">
                <div className="message-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <div className="quick-prompts">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="prompt-btn"
                  disabled={isTyping}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="input-wrapper">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your portfolio..."
                className="chat-input"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend()}
                className="send-btn"
                aria-label="Send message"
                disabled={!input.trim() || isTyping}
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
