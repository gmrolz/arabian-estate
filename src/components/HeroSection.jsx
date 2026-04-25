import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import AIChat from './AIChat';
import '../styles/hero-section.css';

export default function HeroSection() {
  const { t, locale } = useLocale();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

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

        {/* Hero Content - Normal Professional Design */}
        <div className="hero-content">
          <div className="hero-text-container">
            <h1 className="hero-title">
              {locale === 'en' ? 'Find Your Dream Property' : 'ابحث عن منزل أحلامك'}
            </h1>
            <p className="hero-subtitle">
              {locale === 'en' 
                ? 'Discover premium properties in Egypt with expert guidance and transparent deals'
                : 'اكتشف العقارات الفاخرة في مصر مع إرشادات الخبراء والصفقات الشفافة'
              }
            </p>
            
            <div className="hero-cta-buttons">
              <Link to="/listings" className="cta-button primary">
                {locale === 'en' ? 'Explore Properties' : 'استكشف العقارات'}
              </Link>
              <button 
                className="cta-button secondary"
                onClick={() => setShowTutorial(true)}
              >
                {locale === 'en' ? 'Learn More' : 'تعرف على المزيد'}
              </button>
            </div>
          </div>
        </div>

        {/* Chat Button - Matches Language Toggle Style */}
        <div className="chat-button-wrapper">
          <button 
            className="chat-button"
            onClick={() => setShowAIChat(true)}
            title={locale === 'en' ? 'Chat with AI Assistant' : 'دردش مع مساعد AI'}
            aria-label={locale === 'en' ? 'Chat with AI Assistant' : 'دردش مع مساعد AI'}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="chat-icon"
            >
              <path 
                d="M21 15a2 2 0 0 1-2 2H7l-4 4v-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {/* Animated Tooltip */}
          <div className="chat-tooltip">
            {locale === 'en' ? 'Chat Now' : 'تحدث معنا'}
          </div>
        </div>

        {/* Tutorial Tooltip */}
        {showTutorial && (
          <div className="tutorial-overlay" onClick={() => setShowTutorial(false)}>
            <div className="tutorial-card">
              <button 
                className="tutorial-close"
                onClick={() => setShowTutorial(false)}
              >
                ✕
              </button>
              <h3 className="tutorial-title">
                {locale === 'en' ? 'How to Use Our AI Chat' : 'كيفية استخدام دردشة AI'}
              </h3>
              <div className="tutorial-content">
                <div className="tutorial-step">
                  <span className="step-number">1</span>
                  <p>
                    {locale === 'en' 
                      ? 'Click the chat button in the bottom right corner'
                      : 'انقر على زر الدردشة في الزاوية السفلية اليمنى'
                    }
                  </p>
                </div>
                <div className="tutorial-step">
                  <span className="step-number">2</span>
                  <p>
                    {locale === 'en' 
                      ? 'Ask about properties, locations, or prices'
                      : 'اسأل عن العقارات أو المواقع أو الأسعار'
                    }
                  </p>
                </div>
                <div className="tutorial-step">
                  <span className="step-number">3</span>
                  <p>
                    {locale === 'en' 
                      ? 'Get personalized recommendations and connect with our team'
                      : 'احصل على توصيات شخصية والتواصل مع فريقنا'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat onClose={() => setShowAIChat(false)} />
      )}
    </>
  );
}
