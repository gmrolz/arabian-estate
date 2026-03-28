import { Link, useLocation } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useHeaderVisibility } from '../context/HeaderVisibilityContext';

const FlagEn = () => <img src="/flags/en.svg" alt="" width="24" height="16" className="flag-img" />;
const FlagAr = () => <img src="/flags/ar.svg" alt="" width="24" height="16" className="flag-img" />;

const CAIRO_AREA_SLUGS = ['new-capital', 'new-cairo', 'mostakbal-city'];
function isListingGridPage(pathname) {
    const parts = pathname.replace(/^\/en/, '').split('/').filter(Boolean);
    if (parts[0] === 'east-cairo' && parts.length <= 1) return true;
    return parts[0] === 'listings' && parts[1] === 'cairo' && CAIRO_AREA_SLUGS.includes(parts[2]) && (parts.length === 3 || parts.length === 4);
}

export default function ListingLangBar({ placement = 'fixed' }) {
    const location = useLocation();
    const { t, lp, locale } = useLocale();
    const { hideHeader } = useHeaderVisibility();
    const pathname = location.pathname;

    if (!isListingGridPage(pathname)) return null;

    const isEn = locale === 'en';
    const enPath = pathname.startsWith('/en') ? pathname : `/en${pathname}`;
    const arPath = pathname.startsWith('/en') ? (pathname.replace(/^\/en/, '') || '/') : pathname;
    const isInline = placement === 'inline';

    return (
        <div
            className={`listing-lang-bar ${hideHeader && !isInline ? 'hidden' : ''} ${isInline ? 'listing-lang-bar--inline' : ''}`}
            role="group"
            aria-label={t('langBar.translate')}
        >
            <div className="listing-lang-bar-inner">
                {isInline && (
                    <span className="listing-lang-bar-label" aria-hidden="true">
                        {t('langBar.translate')}:{' '}
                    </span>
                )}
                <Link to={enPath} className={`listing-lang-option ${isEn ? 'active' : ''}`} aria-label={t('langBar.english')} title={t('langBar.english')}>
                    <FlagEn />
                    <span className="listing-lang-label">{t('langBar.english')}</span>
                </Link>
                <span className="listing-lang-sep" aria-hidden="true">·</span>
                <Link to={arPath} className={`listing-lang-option ${!isEn ? 'active' : ''}`} aria-label={t('langBar.arabic')} title={t('langBar.arabic')}>
                    <FlagAr />
                    <span className="listing-lang-label">{t('langBar.arabic')}</span>
                </Link>
            </div>
        </div>
    );
}
