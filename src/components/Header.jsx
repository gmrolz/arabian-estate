import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useHeaderVisibility } from '../context/HeaderVisibilityContext';
import { useSite } from '../context/SiteContext';

import iconImg from '../assets/arabian-estate-icon.svg';


const FlagEn = () => <img src="/flags/en.svg" alt="" width="24" height="16" className="flag-img" />;
const FlagUSA = () => <img src="/flags/en.svg" alt="" width="24" height="16" className="flag-img" />;
const FlagAr = () => <img src="/flags/ar.svg" alt="" width="24" height="16" className="flag-img" />;

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const CAIRO_AREA_SLUGS = ['new-capital', 'new-cairo', 'mostakbal-city'];

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [cairoOpen, setCairoOpen] = useState(false);
    const [langExpanded, setLangExpanded] = useState(false);
    const [langVisible, setLangVisible] = useState(false);
    const swipeStartRef = useRef(null);
    const location = useLocation();
    const { t, lp, locale } = useLocale();
    const { hideHeader } = useHeaderVisibility();
    const { currentSite } = useSite();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setLangVisible(true), 2500);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!langExpanded) return;
        const onClick = (e) => {
            if (e.target.closest('.floating-lang')) return;
            setLangExpanded(false);
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [langExpanded]);

    const pathname = location.pathname;
    const isCairoArea = CAIRO_AREA_SLUGS.some((slug) => pathname.includes(`/listings/cairo/${slug}`));
    useEffect(() => {
        if (isCairoArea) setCairoOpen(true);
    }, [isCairoArea]);
    const isEn = locale === 'en';
    const isActive = (path) => pathname === path || pathname === lp(path);
    const isListingsActive = pathname === lp('/listings') || pathname.startsWith(lp('/listings/'));

    const enPath = pathname.startsWith('/en') ? pathname : `/en${pathname}`;
    const arPath = pathname.startsWith('/en') ? (pathname.replace(/^\/en/, '') || '/') : pathname;

    const handleTouchStart = (e) => {
        const x = e.touches?.[0]?.clientX ?? 0;
        if (x < 40 || x > window.innerWidth - 40) swipeStartRef.current = { x };
    };
    const handleTouchEnd = (e) => {
        if (!swipeStartRef.current) return;
        const x = e.changedTouches?.[0]?.clientX ?? 0;
        const dx = x - swipeStartRef.current.x;
        if (Math.abs(dx) > 50) setMenuOpen(dx > 0);
        swipeStartRef.current = null;
    };

    return (
        <>
            <div
                className="header-swipe-zone header-swipe-zone--left"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={() => { swipeStartRef.current = null; }}
                aria-hidden="true"
            />
            <div
                className="header-swipe-zone header-swipe-zone--right"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={() => { swipeStartRef.current = null; }}
                aria-hidden="true"
            />
            <header className={`header ${scrolled ? 'scrolled' : ''} ${hideHeader ? 'header--hidden' : ''} ${menuOpen ? 'header--open' : ''}`}>
                <div className="header-inner">
                    <Link to={lp('/')} className="logo" dir="ltr">
                        <div
                            className="logo-icon-img"
                            role="img"
                            aria-hidden="true"
                            style={{
                                WebkitMaskImage: `url(${iconImg})`,
                                maskImage: `url(${iconImg})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center',
                                backgroundColor: '#c90411',
                            }}
                        />
                        <div className="logo-text">
                            <strong className="logo-title">rabian</strong>
                            <span className="logo-sub">Estate</span>
                        </div>
                    </Link>

                    <nav className="nav">
                        <Link to={lp('/')} className={isActive(lp('/')) ? 'active' : ''}>{t('nav.home')}</Link>
                        <Link to={lp('/listings')} className={isListingsActive ? 'active' : ''}>
                            {t('nav.listings')}
                        </Link>
                        <a href="#about">{t('nav.aboutUs')}</a>
                        <a href="#contact">{t('nav.contact')}</a>
                        <Link to={lp('/listings')} className="nav-cta">{t('nav.viewListings')}</Link>
                        <div className="lang-switcher" role="group" aria-label="Language">
                            <Link to={enPath} className={`lang-flag ${isEn ? 'active' : ''}`} aria-label="English" title="English"><FlagEn /><span className="lang-flag-text">English</span></Link>
                            <Link to={arPath} className={`lang-flag ${!isEn ? 'active' : ''}`} aria-label="العربية" title="العربية"><FlagAr /><span className="lang-flag-text">العربية</span></Link>
                        </div>
                    </nav>

                    <button
                        className="hamburger"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label={t('aria.toggleMenu')}
                        aria-expanded={menuOpen}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </header>

            <div
                className={`mobile-menu-backdrop ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(false)}
                onTouchStart={() => setMenuOpen(false)}
                aria-hidden="true"
            />
            <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
                <Link to={lp('/')} onClick={() => setMenuOpen(false)} className="mobile-menu-link">{t('nav.home')}</Link>
                <div className="mobile-menu-group">
                    <Link to={lp('/listings')} onClick={() => setMenuOpen(false)} className={`mobile-menu-link ${pathname === lp('/listings') ? 'active' : ''}`}>
                        {t('nav.listings')}
                    </Link>
                    <button
                        type="button"
                        className={`mobile-menu-toggle ${cairoOpen ? 'open' : ''}`}
                        onClick={() => setCairoOpen((o) => !o)}
                        aria-expanded={cairoOpen}
                        aria-label={cairoOpen ? 'Collapse Cairo' : 'Expand Cairo'}
                    >
                        {t('location.cairo')}
                        <span className="mobile-menu-chevron" aria-hidden="true">{cairoOpen ? '−' : '+'}</span>
                    </button>
                    <div className={`mobile-menu-sublinks ${cairoOpen ? 'open' : ''}`}>
                        <Link to={lp('/east-cairo')} onClick={() => setMenuOpen(false)} className={`mobile-menu-sublink ${pathname === lp('/east-cairo') ? 'active' : ''}`}>
                            {t('location.eastCairo')}
                        </Link>
                        <Link to={lp('/listings/cairo/new-capital')} onClick={() => setMenuOpen(false)} className={`mobile-menu-sublink ${pathname === lp('/listings/cairo/new-capital') ? 'active' : ''}`}>
                            {t('location.newCapital')}
                        </Link>
                        <Link to={lp('/listings/cairo/new-cairo')} onClick={() => setMenuOpen(false)} className={`mobile-menu-sublink ${pathname === lp('/listings/cairo/new-cairo') ? 'active' : ''}`}>
                            {t('location.newCairo')}
                        </Link>
                        <Link to={lp('/listings/cairo/mostakbal-city')} onClick={() => setMenuOpen(false)} className={`mobile-menu-sublink ${pathname === lp('/listings/cairo/mostakbal-city') ? 'active' : ''}`}>
                            {t('location.mostakbalCity')}
                        </Link>
                    </div>
                    <Link to={lp('/listings/north-coast')} onClick={() => setMenuOpen(false)} className={`mobile-menu-sublink ${pathname === lp('/listings/north-coast') ? 'active' : ''}`}>{t('location.northCoast')}</Link>
                    <Link to={lp('/listings/sokhna')} onClick={() => setMenuOpen(false)} className={`mobile-menu-sublink ${pathname === lp('/listings/sokhna') ? 'active' : ''}`}>{t('location.sokhna')}</Link>
                    <Link to={lp('/listings/galala')} onClick={() => setMenuOpen(false)} className={`mobile-menu-sublink ${pathname === lp('/listings/galala') ? 'active' : ''}`}>{t('location.galala')}</Link>
                    <Link to={lp('/listings/hurghada')} onClick={() => setMenuOpen(false)} className={`mobile-menu-sublink ${pathname === lp('/listings/hurghada') ? 'active' : ''}`}>{t('location.hurghada')}</Link>
                </div>
                <a href="#about" onClick={() => setMenuOpen(false)} className="mobile-menu-link">{t('nav.aboutUs')}</a>
                <a href="#contact" onClick={() => setMenuOpen(false)} className="mobile-menu-link">{t('nav.contact')}</a>
                <div className="mobile-menu-lang" role="group" aria-label="Language">
                    <Link to={enPath} onClick={() => setMenuOpen(false)} className={`mobile-menu-lang-btn ${isEn ? 'active' : ''}`} aria-label="English" title="English"><FlagEn /><span>English</span></Link>
                    <Link to={arPath} onClick={() => setMenuOpen(false)} className={`mobile-menu-lang-btn ${!isEn ? 'active' : ''}`} aria-label="العربية" title="العربية"><FlagAr /><span>العربية</span></Link>
                </div>
            </div>

            <div className={`floating-lang ${langVisible ? 'visible' : ''} ${langExpanded ? 'expanded' : ''}`} role="group" aria-label="Language">
                <button
                    type="button"
                    className="floating-lang-trigger"
                    onClick={() => setLangExpanded((e) => !e)}
                    aria-expanded={langExpanded}
                    aria-label={langExpanded ? 'Close language menu' : 'Change language'}
                    title={t('langBar.translate')}
                >
                    <GlobeIcon />
                </button>
                <div className="floating-lang-options">
                    <Link to={enPath} className={`floating-lang-btn ${isEn ? 'active' : ''}`} aria-label="English" title="English" onClick={() => setLangExpanded(false)}><FlagUSA /></Link>
                    <Link to={arPath} className={`floating-lang-btn ${!isEn ? 'active' : ''}`} aria-label="العربية" title="العربية" onClick={() => setLangExpanded(false)}><FlagAr /></Link>
                </div>
            </div>
        </>
    );
}
