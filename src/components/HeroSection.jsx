import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import Lottie from 'lottie-react';
import aiRobotAnimation from '../animations/ai-robot.json';
import AIChat from './AIChat';
import '../styles/hero-section.css';

export default function HeroSection() {
  const { t, locale } = useLocale();
  const [showAIChat, setShowAIChat] = useState(false);

  const promises = [
    { icon: '✓', title: 'No Commissions', desc: 'Direct deals with developers' },
    { icon: '👥', title: 'Expert Support', desc: '24/7 dedicated assistance' },
    { icon: '💰', title: 'Best Deals', desc: 'Exclusive offers & discounts' },
    { icon: '🏆', title: 'Trusted Platform', desc: '100+ premium properties' },
  ];

  return (
    <>
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
          <div className="hero-text-container">
            <h1 className="hero-title">
              {t('We will help you find your')}
              <br />
              <span className="highlight">{t('Premium Property')}</span>
            </h1>
            <p className="hero-subtitle">
              {t('A trusted platform to buy, sell and rent premium properties in Egypt without intermediaries')}
            </p>

            <Link to="/listings" className="cta-button">
              {t('Explore Properties')} →
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="scroll-indicator">
            <span>{t('Scroll')}</span>
            <div className="scroll-line"></div>
          </div>
        </div>

        {/* Value Propositions */}
        <div className="hero-promises">
          {promises.map((promise, idx) => (
            <div key={idx} className="promise-card">
              <div className="promise-icon">{promise.icon}</div>
              <h3 className="promise-title">{promise.title}</h3>
              <p className="promise-desc">{promise.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Floating AI Button - Bottom Right */}
      <button
        className="floating-ai-button"
        onClick={() => setShowAIChat(true)}
        title={t('Chat with AI Assistant')}
        aria-label={t('Chat with AI Assistant')}
      >
        <Lottie
          animationData={aiRobotAnimation}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </button>

      {/* AI Chat Modal */}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
    </>
  );
}
