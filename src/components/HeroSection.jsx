import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import '../styles/hero-section.css';

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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Add user message
        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Call Gemini API
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `You are an AI assistant for Arabian Estate, a luxury real estate company in Egypt. 
                                        
Context about Arabian Estate:
- Specializes in premium properties in Egypt
- Locations: New Cairo, New Administrative Capital, North Coast, Ain Sokhna, Red Sea, Hurghada, Gouna, Sharm El Sheikh
- Property types: Apartments, Villas, Penthouses, Duplexes
- Finishing options: Fully Finished, Fully Finished + AC's, Fully Finished + Kitchen + AC's, Semi Finished, Core and Shell
- Delivery times: Ready to Move, 6 Months to 5 Years
- Contact: WhatsApp for inquiries

User question: ${inputValue}

Please respond in a professional, luxury-focused manner. If you don't know the answer, suggest contacting Arabian Estate via WhatsApp. Keep responses concise and engaging.`,
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not process your request. Please contact us via WhatsApp for assistance.';

            const aiMessage = {
                id: Date.now() + 1,
                text: aiResponse,
                sender: 'ai',
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: 'I apologize, I encountered an error. Please contact us via WhatsApp for assistance.',
                sender: 'ai',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="hero-section">
            {/* Hero Background Image */}
            <div className="hero-background">
                <div className="hero-overlay"></div>
                <img 
                    src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop" 
                    alt="Luxury Real Estate"
                    className="hero-image"
                />
            </div>

            {/* Hero Content */}
            <div className="hero-content">
                <div className="hero-text">
                    <h1 className="hero-headline">
                        {isRTL ? (
                            <>
                                سنساعدك على إيجاد
                                <span className="hero-highlight"> عقارك الفاخر</span>
                            </>
                        ) : (
                            <>
                                We will help you find your
                                <span className="hero-highlight"> Premium Property</span>
                            </>
                        )}
                    </h1>
                    <p className="hero-description">
                        {isRTL 
                            ? 'منصة موثوقة لشراء وبيع وتأجير العقارات الفاخرة في مصر بدون وسطاء'
                            : 'A trusted platform to buy, sell and rent premium properties in Egypt without intermediaries'
                        }
                    </p>
                </div>

                {/* AI Chatbox */}
                <div className="hero-chatbox">
                    <div className="chatbox-header">
                        <h3>{isRTL ? 'اسأل مساعدنا الذكي' : 'Ask Our AI Assistant'}</h3>
                        <p>{isRTL ? 'ابحث عن عقارك المثالي' : 'Find your perfect property'}</p>
                    </div>

                    <div className="chatbox-messages">
                        {messages.length === 0 && (
                            <div className="chatbox-welcome">
                                <p>{isRTL ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?'}</p>
                                <p className="chatbox-hint">
                                    {isRTL 
                                        ? 'اسأل عن العقارات والمواقع والأسعار'
                                        : 'Ask about properties, locations, and prices'
                                    }
                                </p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`chatbox-message ${msg.sender}`}>
                                <div className="message-content">{msg.text}</div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chatbox-message ai loading">
                                <div className="message-content">
                                    <span className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="chatbox-form">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isRTL ? 'اكتب سؤالك هنا...' : 'Type your question...'}
                            className="chatbox-input"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            className="chatbox-send"
                            disabled={isLoading || !inputValue.trim()}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                                <path d="M22 21l-4-4m0 0l-4 4m4-4v-4" />
                            </svg>
                        </button>
                    </form>

                    <div className="chatbox-footer">
                        <Link to={`${lp('/listings')}`} className="chatbox-link">
                            {isRTL ? 'عرض جميع العقارات' : 'View All Properties'}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator - Fixed positioning to avoid overlap */}
            <div className="hero-scroll-indicator" aria-hidden="true">
                <span>{isRTL ? 'اسحب' : 'Scroll'}</span>
                <div className="scroll-line"></div>
            </div>

            {/* Explore Properties Button - Fixed positioning */}
            <Link to={lp('/listings')} className="hero-explore-button" aria-label="Explore Properties">
                {isRTL ? 'استكشف العقارات' : 'Explore Properties'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </Link>
        </section>
    );
}
