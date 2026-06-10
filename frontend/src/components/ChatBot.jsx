import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const InvestActionCard = ({ fundId, fundName, API_BASE_URL, onHoldingsUpdated, onSuccess }) => {
  const [amount, setAmount] = useState('5000');
  const [isInvesting, setIsInvesting] = useState(false);
  const [invested, setInvested] = useState(false);

  const handleInvest = async () => {
    if (isInvesting || invested) return;
    setIsInvesting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fund_id: fundId, amount: parseFloat(amount) })
      });
      const data = await res.json();
      if (res.ok) {
        setInvested(true);
        if (onHoldingsUpdated) onHoldingsUpdated();
        if (onSuccess) {
          onSuccess(`🎉 **Transaction Confirmed!** Successfully invested **₹${parseFloat(amount).toLocaleString('en-IN')}** in **${fundName}**.`);
        }
      } else {
        alert(data.detail || "Investment failed. Please try again.");
      }
    } catch (err) {
      console.error("Investment error:", err);
      alert("Unable to complete investment. Server error.");
    } finally {
      setIsInvesting(false);
    }
  };

  return (
    <div className="invest-card">
      <div className="invest-card-header">
        <span className="invest-card-title">💡 One-Click Investment</span>
        <span className="invest-fund-name">{fundName}</span>
      </div>
      {invested ? (
        <div className="invest-success-badge">
          ✓ Invested Successfully
        </div>
      ) : (
        <div className="invest-action-row">
          <div className="invest-input-container">
            <span className="currency-prefix">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="invest-amount-input"
              disabled={isInvesting}
              min="500"
              step="500"
            />
          </div>
          <button
            onClick={handleInvest}
            className="invest-confirm-btn"
            disabled={isInvesting || !amount || parseFloat(amount) <= 0}
          >
            {isInvesting ? 'Processing...' : 'Invest Now'}
          </button>
        </div>
      )}
    </div>
  );
};

const ChatBot = ({ portfolio, funds, API_BASE_URL, onHoldingsUpdated }) => {
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

  const parseInvestOptions = (text) => {
    const regex = /\[INVEST_OPTION:\s*(\d+),\s*([^\]]+)\]/g;
    const options = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      options.push({
        id: parseInt(match[1], 10),
        name: match[2].trim()
      });
    }
    
    const cleanText = text.replace(/\[INVEST_OPTION:\s*\d+,\s*[^\]]+\]/g, '').trim();
    return { cleanText, options };
  };

  const handleSend = async (customMessage) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || isTyping) return;

    if (!customMessage) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
      const { cleanText, options } = parseInvestOptions(data.response);
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: cleanText,
        investOptions: options
      }]);
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
                  
                  {msg.investOptions && msg.investOptions.length > 0 && (
                    <div className="invest-options-container">
                      {msg.investOptions.map((opt) => (
                        <InvestActionCard 
                          key={opt.id} 
                          fundId={opt.id} 
                          fundName={opt.name} 
                          API_BASE_URL={API_BASE_URL}
                          onHoldingsUpdated={onHoldingsUpdated}
                          onSuccess={(successMsg) => {
                            setMessages(prev => [...prev, { role: 'bot', content: successMsg }]);
                          }}
                        />
                      ))}
                    </div>
                  )}
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
