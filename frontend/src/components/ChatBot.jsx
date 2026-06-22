import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const RISK_QUESTIONS = [
  {
    id: 1,
    question: "🎯 **Question 1:** What is your primary investment goal?",
    options: [
      { text: "Preserve Capital (Stable, low-volatility returns)", value: 1 },
      { text: "Balanced Growth (Moderate index fluctuations)", value: 2 },
      { text: "Maximize Returns (High long-term growth, high risk)", value: 3 }
    ]
  },
  {
    id: 2,
    question: "📉 **Question 2:** If the stock market drops 20% tomorrow, how do you react?",
    options: [
      { text: "Panic and sell my mutual funds immediately", value: 1 },
      { text: "Do nothing and wait for the market to recover", value: 2 },
      { text: "View it as a discount and buy more units!", value: 3 }
    ]
  },
  {
    id: 3,
    question: "⏳ **Question 3:** What is your investment time horizon?",
    options: [
      { text: "Short Term (Less than 1 year)", value: 1 },
      { text: "Medium Term (1 to 3 years)", value: 2 },
      { text: "Long Term (3 years or more)", value: 3 }
    ]
  }
];

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

const ChatBot = ({ portfolio, funds, API_BASE_URL, onHoldingsUpdated, triggerProfiler, setTriggerProfiler }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am your Stonks AI Assistant. How can I help you analyze your portfolio and find the best mutual funds to invest in?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Risk Profiler survey states
  const [surveyIndex, setSurveyIndex] = useState(-1);
  const [surveyAnswers, setSurveyAnswers] = useState([]);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle external triggers from sidebar App.jsx
  useEffect(() => {
    if (triggerProfiler) {
      setIsOpen(true);
      startSurvey();
      if (setTriggerProfiler) setTriggerProfiler(false);
    }
  }, [triggerProfiler]);

  const startSurvey = () => {
    setSurveyIndex(0);
    setSurveyAnswers([]);
    setMessages(prev => [
      ...prev,
      { role: 'bot', content: "🎯 **AI Risk Profiler Questionnaire**\nTo recommend SEBI-compliant funds, let's assess your risk tolerance. Please select an option for each of the following 3 questions:" },
      { role: 'bot', content: RISK_QUESTIONS[0].question, isQuestion: true, questionId: 0 }
    ]);
  };

  const handleSurveyAnswer = async (value, optionText) => {
    const nextAnswers = [...surveyAnswers, value];
    setSurveyAnswers(nextAnswers);
    
    // Add user selection to message array
    setMessages(prev => [...prev, { role: 'user', content: optionText }]);
    
    const nextIndex = surveyIndex + 1;
    if (nextIndex < RISK_QUESTIONS.length) {
      setSurveyIndex(nextIndex);
      // Wait a brief moment to make it feel conversational
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { role: 'bot', content: RISK_QUESTIONS[nextIndex].question, isQuestion: true, questionId: nextIndex }
        ]);
      }, 400);
    } else {
      setSurveyIndex(-1);
      setIsTyping(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/risk-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: nextAnswers })
        });
        const data = await res.json();
        if (res.ok) {
          const profile = data.risk_profile;
          setMessages(prev => [
            ...prev,
            { 
              role: 'bot', 
              content: `🎯 **Risk Profiler Completed!**\n\nYour calculated compliance tier is **${profile.profile}**.\n\n*Description:* ${profile.description}\n\nYour AI recommendations and portfolio checks will now align with this risk tier.` 
            }
          ]);
          if (onHoldingsUpdated) onHoldingsUpdated(); // Refresh sidebar in App.jsx
        } else {
          setMessages(prev => [...prev, { role: 'bot', content: "⚠️ Evaluation failed. Please try again." }]);
        }
      } catch (err) {
        console.error("Survey error:", err);
        setMessages(prev => [...prev, { role: 'bot', content: "⚠️ Connection error. Unable to save risk profile." }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

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
    
    // Intercept risk profiler requests
    if (messageToSend.toLowerCase().includes("risk profile") || messageToSend.toLowerCase().includes("profiler")) {
      if (surveyIndex === -1) {
        setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
        setTimeout(startSurvey, 400);
        return;
      }
    }

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
    "Find my Risk Profile 🎯",
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
                  
                  {/* Interactive survey choice buttons */}
                  {msg.isQuestion && surveyIndex === msg.questionId && (
                    <div className="survey-options-container">
                      {RISK_QUESTIONS[msg.questionId].options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSurveyAnswer(opt.value, opt.text)}
                          className="survey-option-btn"
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}
                  
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
                  disabled={isTyping || (surveyIndex !== -1 && prompt !== "Find my Risk Profile 🎯")}
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
                placeholder={surveyIndex !== -1 ? "Select an option in the survey above..." : "Ask about your portfolio..."}
                className="chat-input"
                disabled={isTyping || surveyIndex !== -1}
              />
              <button
                onClick={() => handleSend()}
                className="send-btn"
                aria-label="Send message"
                disabled={!input.trim() || isTyping || surveyIndex !== -1}
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
