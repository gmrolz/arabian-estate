import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import AIChat from './AIChat';
import '../styles/hero-section.css';

export default function HeroSection() {
  const { t, locale } = useLocale();
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <>
      <section className="hero-section">
        {/* Background Image */}
        <div className="hero-background">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop"
            alt="Luxury Property"
            className="hero-image"
          />
          <div className="hero-overlay"></div>
        </div>

        {/* Hero Content - Mobile First */}
        <div className="hero-content">
          {/* AI Icon Button - Large and Visible in Center */}
          <button 
            className="hero-ai-button"
            onClick={() => setShowAIChat(true)}
            aria-label={t('Chat with AI Assistant')}
            title={t('Chat with AI Assistant')}
          >
            {/* AI Robot Icon - SVG */}
            <svg 
              viewBox="0 0 100 100" 
              className="ai-icon-svg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Robot Head - Red */}
              <rect x="15" y="25" width="70" height="55" rx="10" fill="#dc143c" stroke="white" strokeWidth="2.5"/>
              
              {/* Left Eye */}
              <circle cx="32" cy="42" r="8" fill="white"/>
              <circle cx="32" cy="42" r="4" fill="#dc143c"/>
              
              {/* Right Eye */}
              <circle cx="68" cy="42" r="8" fill="white"/>
              <circle cx="68" cy="42" r="4" fill="#dc143c"/>
              
              {/* Smile */}
              <path d="M 32 58 Q 50 68 68 58" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              
              {/* Antenna Left */}
              <line x1="32" y1="25" x2="28" y2="5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="28" cy="3" r="2.5" fill="white"/>
              
              {/* Antenna Right */}
              <line x1="68" y1="25" x2="72" y2="5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="72" cy="3" r="2.5" fill="white"/>
            </svg>
            <span className="ai-button-pulse"></span>
          </button>

          {/* Main Text */}
          <div className="hero-text">
            <h1 className="hero-title">
              {t('We will help you find your')}
              <br />
              <span className="hero-highlight">{t('Premium Property')}</span>
            </h1>
            <p className="hero-subtitle">
              {t('A trusted platform to buy, sell and rent premium properties in Egypt without intermediaries')}
            </p>
          </div>

          {/* CTA Button */}
          <Link to="/listings" className="hero-cta-button">
            {t('Explore Properties')} →
          </Link>

          {/* Scroll Indicator */}
          <div className="hero-scroll-indicator">
            <span>{t('Scroll')}</span>
            <div className="scroll-dot"></div>
          </div>
        </div>

        {/* Value Propositions - Bottom Banner */}
        <div className="hero-promises">
          <div className="promise-card">
            <div className="promise-icon">✓</div>
            <div className="promise-text">
              <h3>No Commissions</h3>
              <p>Direct deals</p>
            </div>
          </div>
          <div className="promise-card">
            <div className="promise-icon">👥</div>
            <div className="promise-text">
              <h3>Expert Support</h3>
              <p>24/7 assistance</p>
            </div>
          </div>
          <div className="promise-card">
            <div className="promise-icon">💰</div>
            <div className="promise-text">
              <h3>Best Deals</h3>
              <p>Exclusive offers</p>
            </div>
          </div>
          <div className="promise-card">
            <div className="promise-icon">🏆</div>
            <div className="promise-text">
              <h3>Trusted</h3>
              <p>100+ properties</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Modal */}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
    </>
  );
}
