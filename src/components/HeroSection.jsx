import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import '../styles/hero-section.css';

const QUICK_REPLIES = {
  en: [
    { label: 'Properties in New Cairo', value: 'What properties do you have in New Cairo?' },
    { label: 'Ready to move units', value: 'Show me ready to move properties' },
    { label: 'Budget under 5M EGP', value: 'I have a budget under 5 million EGP' },
    { label: 'North Coast chalets', value: 'Do you have chalets in North Coast?' },
  ],
  ar: [
    { label: 'عقارات في القاهرة الجديدة', value: 'ما هي العقارات المتاحة في القاهرة الجديدة؟' },
    { label: 'وحدات جاهزة للسكن', value: 'أريد وحدات جاهزة للسكن' },
    { label: 'ميزانية أقل من 5 مليون', value: 'ميزانيتي أقل من 5 مليون جنيه' },
    { label: 'شاليهات الساحل الشمالي', value: 'هل لديكم شاليهات بالساحل الشمالي؟' },
  ],
};

const WHATSAPP_NUMBER = '201000257941';

export default function HeroSection() {
  const { t, lp, isRTL } = useLocale();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e, messageText = null) => {
    e?.preventDefault?.();
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        text: msg.text,
        sender: msg.sender,
      }));

      // Call backend Gemini API with conversation history
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse =
        data.response ||
        'I apologize, I could not process your request. Please contact us via WhatsApp for assistance.';

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        showCTA: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'I apologize, I encountered an error. Please contact us via WhatsApp for assistance.',
        sender: 'ai',
        showCTA: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (value) => {
    const syntheticEvent = { preventDefault: () => {} };
    handleSendMessage(syntheticEvent, value);
  };

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in learning more about Arabian Estate properties. Can you help me find the perfect property?`
  );
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  const quickReplies = QUICK_REPLIES[lp] || QUICK_REPLIES.en;

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

        {/* AI Chatbox */}
        <div className="chatbox-container">
          <div className="chatbox-header">
            <h2>{t('Ask Our AI Assistant')}</h2>
            <p>{t('Find your perfect property')}</p>
          </div>

          <div className="chatbox-messages">
            {messages.length === 0 && (
              <div className="chatbox-welcome">
                <p className="welcome-text">{t('Hello! How can I help you?')}</p>
                <p className="welcome-hint">{t('Ask about properties, locations, and prices')}</p>
                <div className="quick-replies">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      className="quick-reply-btn"
                      onClick={() => handleQuickReply(reply.value)}
                      disabled={isLoading}
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">{msg.text}</div>
                {msg.showCTA && msg.sender === 'ai' && (
                  <div className="message-cta">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
                      📱 {t('Chat on WhatsApp')}
                    </a>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="message-content loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chatbox-form">
            <input
              type="text"
              placeholder={t('Type your question...')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputValue.trim()}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="currentColor" />
              </svg>
            </button>
          </form>

          <Link to="/listings" className="chatbox-link">
            {t('View All Properties')}
          </Link>
        </div>

        <Link to="/listings" className="cta-button">
          {t('Explore Properties')} →
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <span>{t('Scroll')}</span>
        <div className="scroll-arrow"></div>
      </div>
    </section>
  );
}
