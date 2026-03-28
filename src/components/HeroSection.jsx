import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import HeroVideoBackground from './HeroVideoBackground';

export default function HeroSection() {
    const { t, lp } = useLocale();

    return (
        <section className="hero hero--trendy">
            <HeroVideoBackground />
            <div className="hero-trendy-overlay" aria-hidden="true" />
            <div className="hero-trendy-content">
                <span className="hero-trendy-badge">{t('hero.badge')}</span>
                <h1 className="hero-trendy-headline">{t('hero.headlineNew')}</h1>
                <p className="hero-trendy-sub">
                    <span className="hero-trendy-sub-highlight">{t('hero.subTextHighlight')}</span>
                    {' '}{t('hero.subTextRest')}
                </p>
                <Link to={lp('/east-cairo')} className="hero-trendy-cta">
                    {t('hero.checkRecommendation')}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
            <div className="hero-trendy-scroll" aria-hidden="true">
                <span>Scroll</span>
                <div className="hero-trendy-scroll-line" />
            </div>
        </section>
    );
}
