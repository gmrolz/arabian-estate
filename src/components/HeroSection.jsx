import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import '../styles/hero-section.css';

export default function HeroSection() {
    const { t, lp, isRTL } = useLocale();
    const [activeTab, setActiveTab] = useState('buy');

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

                {/* Search Form */}
                <div className="hero-search">
                    <div className="search-tabs">
                        <button 
                            className={`search-tab ${activeTab === 'buy' ? 'active' : ''}`}
                            onClick={() => setActiveTab('buy')}
                        >
                            {isRTL ? 'شراء' : 'Buy'}
                        </button>
                        <button 
                            className={`search-tab ${activeTab === 'sell' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sell')}
                        >
                            {isRTL ? 'بيع' : 'Sell'}
                        </button>
                        <button 
                            className={`search-tab ${activeTab === 'rent' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rent')}
                        >
                            {isRTL ? 'إيجار' : 'Rent'}
                        </button>
                    </div>

                    <div className="search-form">
                        <input 
                            type="text" 
                            placeholder={isRTL ? 'ابحث عن عقارك' : 'Search Your Property'} 
                            className="search-input"
                        />
                        <select className="search-select">
                            <option value="">{isRTL ? 'نوع العقار' : 'Property Type'}</option>
                            <option value="apartment">{isRTL ? 'شقة' : 'Apartment'}</option>
                            <option value="villa">{isRTL ? 'فيلا' : 'Villa'}</option>
                            <option value="penthouse">{isRTL ? 'بنتهاوس' : 'Penthouse'}</option>
                        </select>
                        <select className="search-select">
                            <option value="">{isRTL ? 'السعر الأدنى' : 'Min Price'}</option>
                            <option value="500000">500,000</option>
                            <option value="1000000">1,000,000</option>
                            <option value="2000000">2,000,000</option>
                        </select>
                        <select className="search-select">
                            <option value="">{isRTL ? 'السعر الأقصى' : 'Max Price'}</option>
                            <option value="5000000">5,000,000</option>
                            <option value="10000000">10,000,000</option>
                            <option value="20000000">20,000,000</option>
                        </select>
                        <Link to={lp('/listings')} className="search-button">
                            {isRTL ? 'ابحث الآن' : 'Search Now'}
                        </Link>
                    </div>
                </div>

                {/* CTA Button */}
                <Link to={lp('/listings')} className="hero-cta-button">
                    {isRTL ? 'استكشف العقارات' : 'Explore Properties'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* Scroll Indicator */}
            <div className="hero-scroll-indicator" aria-hidden="true">
                <span>{isRTL ? 'اسحب' : 'Scroll'}</span>
                <div className="scroll-line"></div>
            </div>
        </section>
    );
}
