import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from '../context/LocaleContext';
import '../styles/ai-chat.css';

const QUICK_REPLIES = {
  en: [
    { label: '🏠 New Cairo properties', value: 'What properties do you have in New Cairo?' },
    { label: '🔑 Ready to move', value: 'Show me ready to move properties' },
    { label: '💰 Under 5M EGP', value: 'I have a budget under 5 million EGP' },
    { label: '🏖️ North Coast', value: 'Do you have chalets in North Coast?' },
  ],
  ar: [
    { label: '🏠 القاهرة الجديدة', value: 'ما هي العقارات المتاحة في القاهرة الجديدة؟' },
    { label: '🔑 جاهزة للسكن', value: 'أريد وحدات جاهزة للسكن' },
    { label: '💰 أقل من 5 مليون', value: 'ميزانيتي أقل من 5 مليون جنيه' },
    { label: '🏖️ الساحل الشمالي', value: 'هل لديكم شاليهات بالساحل الشمالي؟' },
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

function ChatPropertyCard({ listing, locale }) {
  const isAr = locale === 'ar';
  const title = isAr ? listing.titleAr : listing.titleEn;
  const project = isAr ? listing.projectAr : listing.projectEn;
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;
  const FALLBACK_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/placeholder-listing-gwAks4ueAQVz8qfmqQpEYM.webp';
  const imageUrl = firstImage || FALLBACK_IMG;

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const message = encodeURIComponent(
      `Hi, I'm interested in: ${title}\nProject: ${project}\nLocation: ${listing.location}\nPrice: EGP ${listing.price}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="chat-prop-card">
      <div className="chat-prop-img">
        <img src={imageUrl} alt={title} loading="lazy" />
        <span className="chat-prop-price">EGP {formatPrice(listing.price)}</span>
      </div>
      <div className="chat-prop-info">
        <div className="chat-prop-title">{title}</div>
        <div className="chat-prop-meta">
          {listing.area && <span>{listing.area}m²</span>}
          {listing.rooms && <span>{listing.rooms} {isAr ? 'غرف' : 'BR'}</span>}
          {listing.finishing && <span>{listing.finishing}</span>}
        </div>
        <button className="chat-prop-wa" onClick={handleWhatsApp}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.592-.838-6.313-2.236l-.44-.362-2.893.97.97-2.893-.362-.44A9.955 9.955 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
          {isAr ? 'واتساب' : 'WhatsApp'}
        </button>
      </div>
    </div>
  );
}

export default function AIChat({ onClose }) {
  const { locale } = useLocale();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const isAr = locale === 'ar';

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Prevent body scroll when chat is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleSendMessage = async (e, messageText = null) => {
    e?.preventDefault?.();
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Blur input on mobile to hide keyboard after send
    if (window.innerWidth <= 768) {
      inputRef.current?.blur();
    }

    try {
      const conversationHistory = messages.map((msg) => ({
        text: msg.text,
        sender: msg.sender,
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, conversationHistory }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const aiResponse = data.response || (isAr
        ? 'أعتذر، لم أتمكن من معالجة طلبك. كيف يمكنني مساعدتك؟'
        : 'I apologize, I could not process your request. How can I help you?');

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        cards: data.cards || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: isAr
          ? 'واجهت خطأ. يرجى المحاولة مرة أخرى.'
          : 'I encountered an error. Please try again.',
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (value) => {
    handleSendMessage({ preventDefault: () => {} }, value);
  };

  const quickReplies = QUICK_REPLIES[locale] || QUICK_REPLIES.en;

  return (
    <div className="aichat-overlay" onClick={onClose}>
      <div className="aichat" dir={isAr ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="aichat-header">
          <div className="aichat-header-left">
            <div className="aichat-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"/><rect x="2" y="8" width="20" height="12" rx="2"/><path d="M6 12h.01M18 12h.01"/><path d="M9 16c.85.63 1.885 1 3 1s2.15-.37 3-1"/>
              </svg>
            </div>
            <div className="aichat-header-info">
              <span className="aichat-header-name">
                {isAr ? 'مساعد العقارات' : 'Property Assistant'}
                <span className="aichat-beta">BETA</span>
              </span>
              <span className="aichat-header-status">
                {isLoading
                  ? (isAr ? 'يكتب...' : 'typing...')
                  : (isAr ? 'متصل الآن' : 'online')}
              </span>
            </div>
          </div>
          <button className="aichat-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="aichat-body" ref={messagesContainerRef}>

          {/* Welcome */}
          {messages.length === 0 && (
            <div className="aichat-welcome">
              <div className="aichat-welcome-icon">🏠</div>
              <h3>{isAr ? 'مرحباً!' : 'Hello!'}</h3>
              <p>{isAr
                ? 'أنا مساعدك العقاري الذكي. كيف يمكنني مساعدتك اليوم؟'
                : "I'm your smart property assistant. How can I help you today?"}</p>
              <div className="aichat-chips">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    className="aichat-chip"
                    onClick={() => handleQuickReply(reply.value)}
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => (
            <div key={msg.id} className={`aichat-msg ${msg.sender}`}>
              <div className="aichat-bubble">
                <div className="aichat-bubble-text">{msg.text}</div>
                <span className="aichat-bubble-time">{msg.time}</span>
              </div>

              {/* Property cards */}
              {msg.cards && msg.cards.length > 0 && msg.sender === 'ai' && (
                <div className="aichat-cards-scroll">
                  {msg.cards.map((card) => (
                    <ChatPropertyCard key={card.id} listing={card} locale={locale} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="aichat-msg ai">
              <div className="aichat-bubble">
                <div className="aichat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="aichat-input-bar">
          <form className="aichat-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isAr ? 'اكتب رسالتك...' : 'Type a message...'}
              disabled={isLoading}
              autoComplete="off"
              enterKeyHint="send"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="aichat-send"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
