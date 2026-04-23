import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import AIChat from './AIChat';
import '../styles/hero-section.css';

export default function HeroSection() {
  const { t } = useLocale();
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <section className="hero-section">
      <div className="hero-background">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop"
          alt="Luxury Property"
          className="hero-image"
        />
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          {t('We will help you find your')}
          <br />
          <span className="highlight">{t('Premium Property')}</span>
        </h1>
        <p className="hero-subtitle">
          {t('A trusted platform to buy, sell and rent premium properties in Egypt without intermediaries')}
        </p>

        {/* AI Icon Button in Center */}
        <button
          className="ai-icon-button"
          onClick={() => setShowAIChat(true)}
          title={t('Chat with AI Assistant')}
          aria-label={t('Chat with AI Assistant')}
        >
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/ai-icon-white-red-n7vuJpARGSD9Ef6SYbk7Pc.webp"
            alt="AI Assistant"
            className="ai-icon-image"
          />
        </button>

        <Link to="/listings" className="cta-button">
          {t('Explore Properties')} →
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <span>{t('Scroll')}</span>
        <div className="scroll-arrow"></div>
      </div>

      {/* AI Chat Modal */}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
    </section>
  );
}
