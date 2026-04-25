import { useState, useRef, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import '../styles/ai-chat.css';

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

const CTA_BUTTONS = {
  en: [
    { label: 'Discuss Options', action: 'discuss' },
    { label: 'View Similar Properties', action: 'similar' },
    { label: 'Contact Agent', action: 'contact' },
    { label: 'Schedule Consultation', action: 'schedule' },
  ],
  ar: [
    { label: 'ناقش الخيارات', action: 'discuss' },
    { label: 'عرض عقارات مشابهة', action: 'similar' },
    { label: 'اتصل بالوكيل', action: 'contact' },
    { label: 'حدد موعد استشارة', action: 'schedule' },
  ],
};

const WHATSAPP_NUMBER = '201000257941';

function formatPrice(price) {
  if (!price) return 'N/A';
  const num = parseInt(price.toString().replace(/,/g, ''), 10);
  if (isNaN(num)) return price;
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
  return num.toString();
}

function PropertyCard({ listing, locale }) {
  const isAr = locale === 'ar';
  const title = isAr ? listing.titleAr : listing.titleEn;
  const project = isAr ? listing.projectAr : listing.projectEn;
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;
  const FALLBACK_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/placeholder-listing-gwAks4ueAQVz8qfmqQpEYM.webp';
  const imageUrl = firstImage || FALLBACK_IMG;

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi, I'm interested in: ${title}\nProject: ${project}\nLocation: ${listing.location}\nPrice: EGP ${listing.price}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="chat-property-card">
      <div className="chat-card-image">
        <img src={imageUrl} alt={title} loading="lazy" />
        <div className="chat-card-badge">{formatPrice(listing.price)}</div>
      </div>
      <div className="chat-card-body">
        <div className="chat-card-title">{title}</div>
        <div className="chat-card-project">{project}</div>
        <div className="chat-card-location">{listing.location}</div>

        <div className="chat-card-specs">
          <span className="chat-card-spec">{listing.area}m²</span>
          <span className="chat-card-spec">{listing.rooms} {isAr ? 'غرف' : 'Beds'}</span>
          <span className="chat-card-spec">{listing.toilets} {isAr ? 'حمام' : 'Bath'}</span>
          <span className="chat-card-spec">{listing.finishing}</span>
        </div>

        <div className="chat-card-pricing">
          <div className="chat-price-row">
            <span className="chat-price-label">{isAr ? 'السعر' : 'Price'}</span>
            <span className="chat-price-value">EGP {listing.price}</span>
          </div>
          {listing.delivery && (
            <div className="chat-price-row">
              <span className="chat-price-label">{isAr ? 'التسليم' : 'Delivery'}</span>
              <span className="chat-price-value">{listing.delivery}</span>
            </div>
          )}
        </div>

        <div className="chat-card-cta">
          <button className="chat-card-btn chat-card-btn-primary" onClick={handleWhatsApp}>
            {isAr ? 'استفسر' : 'Inquire'}
          </button>
          <button className="chat-card-btn chat-card-btn-secondary" onClick={handleWhatsApp}>
            {isAr ? 'WhatsApp' : 'WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIChat({ onClose }) {
  const { t, lp, locale, isRTL } = useLocale();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', phone: '', budget: '', requirements: '' });
  const [showCTAButtons, setShowCTAButtons] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showLeadForm, showCTAButtons]);

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
        (locale === 'ar'
          ? 'أعتذر، لم أتمكن من معالجة طلبك. يرجى إخبارنا بمتطلباتك وسنساعدك في العثور على العقار المثالي.'
          : 'I apologize, I could not process your request. Please tell us your requirements and we will help you find the perfect property.');

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        cards: data.cards || [],
        cardType: data.cardType || 'properties',
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Check if AI suggests collecting lead info or showing CTAs
      const lowerResponse = aiResponse.toLowerCase();
      if (
        lowerResponse.includes('requirements') ||
        lowerResponse.includes('budget') ||
        lowerResponse.includes('متطلبات') ||
        lowerResponse.includes('ميزانية')
      ) {
        setTimeout(() => {
          setShowLeadForm(true);
        }, 1000);
      } else if (
        lowerResponse.includes('discuss') ||
        lowerResponse.includes('contact') ||
        lowerResponse.includes('whatsapp')
      ) {
        setTimeout(() => {
          setShowCTAButtons(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text:
          locale === 'ar'
            ? 'واجهت خطأ. يرجى إخبارنا بمتطلباتك حتى نتمكن من مساعدتك بشكل أفضل.'
            : 'I encountered an error. Please tell us your requirements so we can assist you better.',
        sender: 'ai',
      };
      setMessages((prev) => [...prev, errorMessage]);
      setTimeout(() => {
        setShowLeadForm(true);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (value) => {
    const syntheticEvent = { preventDefault: () => {} };
    handleSendMessage(syntheticEvent, value);
  };

  const handleCTAClick = (action) => {
    if (action === 'discuss' || action === 'contact' || action === 'schedule') {
      setShowCTAButtons(false);
      setShowLeadForm(true);
    } else if (action === 'similar') {
      // Redirect to listings page
      window.location.href = locale === 'ar' ? '/ar/listings' : '/listings';
    }
  };

  const handleSubmitLead = (e) => {
    e.preventDefault();
    if (!leadData.name || !leadData.phone) return;

    // Create WhatsApp message with lead info
    const leadMessage = `
${locale === 'ar' ? 'مرحبا، أنا مهتم بعقارات Arabian Estate.' : 'Hi, I\'m interested in Arabian Estate properties.'}
${locale === 'ar' ? 'الاسم' : 'Name'}: ${leadData.name}
${locale === 'ar' ? 'الهاتف' : 'Phone'}: ${leadData.phone}
${leadData.budget ? `${locale === 'ar' ? 'الميزانية' : 'Budget'}: ${leadData.budget}` : ''}
${locale === 'ar' ? 'المتطلبات' : 'Requirements'}: ${leadData.requirements || (locale === 'ar' ? 'غير محدد' : 'Not specified')}
    `.trim();

    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(leadMessage)}`;
    window.open(whatsappLink, '_blank');

    // Close modal after sending
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const quickReplies = QUICK_REPLIES[locale] || QUICK_REPLIES.en;
  const ctaButtons = CTA_BUTTONS[locale] || CTA_BUTTONS.en;

  return (
    <div className="ai-chat-modal-overlay" onClick={onClose}>
      <div className="ai-chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-chat-header">
          <h2>
            {locale === 'ar' ? 'مساعد العقارات الذكي' : 'AI Property Assistant'}
            <span className="beta-badge">BETA</span>
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.length === 0 && (
            <div className="ai-chat-welcome">
              <p className="welcome-text">
                {locale === 'ar' ? 'مرحبا! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?'}
              </p>
              <p className="welcome-hint">
                {locale === 'ar'
                  ? 'اسأل عن العقارات والمواقع والأسعار'
                  : 'Ask about properties, locations, and prices'}
              </p>
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
            <div key={msg.id}>
              <div className={`ai-chat-message ${msg.sender}`}>
                <div className="message-content">{msg.text}</div>
              </div>
              {/* Render property cards if available */}
              {msg.cards && msg.cards.length > 0 && msg.sender === 'ai' && (
                <div className="ai-chat-cards">
                  {msg.cards.map((card) => (
                    <PropertyCard key={card.id} listing={card} locale={locale} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="ai-chat-message ai">
              <div className="message-content loading">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          {showCTAButtons && !showLeadForm && (
            <div className="cta-buttons-container">
              {ctaButtons.map((btn, idx) => (
                <button
                  key={idx}
                  className="cta-action-btn"
                  onClick={() => handleCTAClick(btn.action)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Lead Form */}
          {showLeadForm && (
            <form className="lead-form" onSubmit={handleSubmitLead}>
              <h3>{locale === 'ar' ? 'معلوماتك' : 'Your Information'}</h3>
              <input
                type="text"
                placeholder={locale === 'ar' ? 'الاسم' : 'Name'}
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder={locale === 'ar' ? 'الهاتف' : 'Phone'}
                value={leadData.phone}
                onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder={locale === 'ar' ? 'الميزانية (اختياري)' : 'Budget (optional)'}
                value={leadData.budget}
                onChange={(e) => setLeadData({ ...leadData, budget: e.target.value })}
              />
              <textarea
                placeholder={locale === 'ar' ? 'المتطلبات (اختياري)' : 'Requirements (optional)'}
                value={leadData.requirements}
                onChange={(e) => setLeadData({ ...leadData, requirements: e.target.value })}
                rows="3"
              />
              <button type="submit" className="submit-lead-btn">
                {locale === 'ar' ? 'إرسال عبر WhatsApp' : 'Send via WhatsApp'}
              </button>
            </form>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form className="ai-chat-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={locale === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? '...' : '→'}
          </button>
        </form>
      </div>
    </div>
  );
}
