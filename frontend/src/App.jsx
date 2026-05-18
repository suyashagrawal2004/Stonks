import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Code,
  ExternalLink,
  Mail,
  Globe,
  Briefcase
} from 'lucide-react';
import ChatBot from './components/ChatBot';

const FundList = ({ funds }) => (
  <div className="funds-grid">
    {funds.map(fund => (
      <div key={fund.id} className="fund-card">
        <div className="fund-header">
          <h3 className="fund-name">{fund.name}</h3>
          <span className={`risk-badge risk-${fund.risk_level.toLowerCase().replace(' ', '-')}`}>
            {fund.risk_level}
          </span>
        </div>
        <div className="fund-details">
          <div className="detail-group">
            <span className="detail-label">NAV</span>
            <span className="detail-value">₹{fund.nav}</span>
          </div>
          <div className="detail-group" style={{ alignItems: 'flex-end' }}>
            <span className="detail-label">1Y Return</span>
            <span className="detail-value highlight">{fund['1Y_return']}%</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const PortfolioView = ({ portfolio }) => {
  if (!portfolio) return null;
  const isPositive = portfolio.returns_pct >= 0;

  return (
    <div className="portfolio-section">
      <div className="portfolio-summary-card glass-card">
        <div className="portfolio-header">
          <div>
            <p className="portfolio-label">Total Portfolio Value</p>
            <h2 className="portfolio-value">₹{portfolio.total_value.toLocaleString('en-IN')}</h2>
          </div>
          <div className="portfolio-icon">
            <Wallet size={24} />
          </div>
        </div>
        <div className="portfolio-stats">
          <span className={`return-badge ${isPositive ? '' : 'negative'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(portfolio.returns_pct)}%
          </span>
          <span className="return-text">Total Return</span>
        </div>
      </div>

      <div className="holdings-section">
        <h3 className="holdings-title">
          <Briefcase size={18} className="holdings-icon" />
          Current Holdings
        </h3>
        <div className="holdings-list">
          {portfolio.holdings.map((holding, i) => (
            <div key={i} className="holding-item">
              <div className="holding-info">
                <h4 className="holding-name">{holding.name}</h4>
                <p className="holding-units">{holding.units} Units</p>
              </div>
              <div className="holding-values">
                <p className="holding-invested">₹{holding.invested_amount.toLocaleString('en-IN')}</p>
                <p className="holding-avg">Avg: ₹{holding.avg_price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Official Brand Icons as SVGs
const LinkedInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const GmailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.573l8.073-6.08c1.618-1.214 3.927-.059 3.927 1.964z"/>
  </svg>
);

export default function App() {
  const [funds, setFunds] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const fundsRes = await fetch('http://localhost:8000/api/funds');
      const fundsData = await fundsRes.json();

      const portRes = await fetch('http://localhost:8000/api/portfolio');
      const portData = await portRes.json();

      setFunds(fundsData);
      setPortfolio(portData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p>Syncing stonks...</p>
    </div>
  );

  return (
    <div className="app-container">
      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="logo-container" style={{ marginBottom: 0 }}>
            <div className="logo-icon">
              <TrendingUp size={24} />
            </div>
            <span className="logo-text">Stonks AI</span>
          </div>
        </header>

        <div className="dashboard-grid two-col">
          {/* Left Column: Portfolio */}
          <div className="left-column">
            <PortfolioView portfolio={portfolio} />
          </div>

          {/* Right Column: Live Feed */}
          <div className="right-column">
            <div className="glass-card">
              <div className="funds-section-header">
                <div className="funds-title-row">
                  <h3 className="funds-section-title">Live Mutual Funds</h3>
                  <span className="live-badge">
                    <span className="live-dot" />
                    LIVE FEED
                  </span>
                </div>
                <p className="text-muted">Dynamic updating rates. Talk to our AI to invest.</p>
              </div>
              <FundList funds={funds} />
            </div>
          </div>
        </div>

        {/* Footer for Credibility */}
        <footer className="footer">
          <div className="footer-left">
            <h2 className="footer-name">SUYASH AGRAWAL</h2>
            <p className="footer-title">AI PRODUCT MANAGER & DEVELOPER</p>
          </div>
          <div className="footer-right">
            <a href="https://suyash-agrawal-mntta.github.io/" target="_blank" rel="noreferrer" className="footer-link">
              <span className="footer-icon-wrapper portfolio-s">S</span>
              PORTFOLIO
            </a>
            <a href="https://github.com/suyash-agrawal-mntta" target="_blank" rel="noreferrer" className="footer-link">
              <span className="footer-icon-wrapper"><GitHubIcon /></span>
              GITHUB
            </a>
            <a href="https://www.linkedin.com/in/suyash-agrawal-mntta/" target="_blank" rel="noreferrer" className="footer-link">
              <span className="footer-icon-wrapper"><LinkedInIcon /></span>
              LINKEDIN
            </a>
            <a href="mailto:suyash.mntta@gmail.com" className="footer-link">
              <span className="footer-icon-wrapper"><GmailIcon /></span>
              EMAIL
            </a>
          </div>
        </footer>
      </main>

      <ChatBot portfolio={portfolio} funds={funds} />
    </div>
  );
}
