import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useHeaderVisibility } from '../context/HeaderVisibilityContext';
import { useListings } from '../context/ListingsContext';
import Breadcrumbs from '../components/Breadcrumbs';
import ListingLangBar from '../components/ListingLangBar';
import PropertyCard from '../components/PropertyCard';

function getUniqueValuesFromList(list, key) {
    return [...new Set(list.map((l) => l[key]))].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));
}

/** East Cairo = New Capital + New Cairo + Mostakbal City combined */
export default function EastCairoPage() {
    const { t, lp } = useLocale();
    const { listings, loading } = useListings();
    const eastCairoListings = useMemo(
        () => listings.filter(l => ['new-capital', 'new-cairo', 'mostakbal-city'].includes(l.area_slug)),
        [listings]
    );

    const [filterDev, setFilterDev] = useState('');
    const [filterFinishing, setFilterFinishing] = useState('');
    const [filterDelivery, setFilterDelivery] = useState('');
    const [filterRooms, setFilterRooms] = useState('');
    const [filtersBarOpen, setFiltersBarOpen] = useState(false);
    const sentinelRef = useRef(null);
    const { setHideHeader } = useHeaderVisibility();

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => setHideHeader(!e.isIntersecting),
            { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
        );
        obs.observe(el);
        return () => {
            obs.disconnect();
            setHideHeader(false);
        };
    }, [setHideHeader]);

    const developers = getUniqueValuesFromList(eastCairoListings, 'developer');
    const finishings = getUniqueValuesFromList(eastCairoListings, 'finishing');
    const rooms = getUniqueValuesFromList(eastCairoListings, 'rooms').map(String);

    const filtered = useMemo(() => {
        return eastCairoListings.filter((l) => {
            if (filterDev && l.developer !== filterDev) return false;
            if (filterFinishing && l.finishing !== filterFinishing) return false;
            if (filterRooms && String(l.rooms) !== filterRooms) return false;
            if (filterDelivery) {
                const ready = l.delivery?.toLowerCase().includes('ready');
                if (filterDelivery === 'ready' && !ready) return false;
                if (filterDelivery === 'offplan' && ready) return false;
            }
            return true;
        });
    }, [eastCairoListings, filterDev, filterFinishing, filterRooms, filterDelivery]);

    const resetFilters = () => {
        setFilterDev('');
        setFilterFinishing('');
        setFilterDelivery('');
        setFilterRooms('');
    };

    const breadcrumbItems = [
        { label: t('location.egypt'), path: lp('/listings') },
        { label: t('location.eastCairo'), path: null },
    ];

    const bedsLabel = (r) => r === '1' ? t('listings.bedroom') : t('listings.bedrooms');
    const filterPreviewText = [filterDev, filterFinishing, filterRooms ? `${filterRooms} ${t('card.beds')}` : '', filterDelivery].filter(Boolean).join(' · ') || t('listings.filterPreview');

    if (eastCairoListings.length === 0) {
        return (
            <div className="listing-page">
                <Breadcrumbs items={breadcrumbItems} />
                <div className="listing-hero">
                    <div className="listing-hero-inner">
                        <h1 className="listing-title">{t('location.eastCairo')} <span>{t('location.listings')}</span></h1>
                        <p className="listing-subtitle">{t('listings.noListingsYet')}</p>
                        <Link to={lp('/listings')} className="btn-primary" style={{ marginTop: 24 }}>{t('listings.backToEgypt')}</Link>
                    </div>
                </div>
                <footer className="footer">
                    <div className="footer-links">
                        <Link to={lp('/')}>{t('footer.home')}</Link>
                        <Link to={lp('/listings')}>{t('footer.listings')}</Link>
                        <Link to={lp('/east-cairo')}>{t('location.eastCairo')}</Link>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="listing-page">
            <div ref={sentinelRef} aria-hidden="true" style={{ position: 'absolute', top: 0, height: 1 }} />
            <div className="listing-hero-inner listing-title-wrap">
                <h1 className="listing-title">
                    {t('location.eastCairo')} <span>{t('location.listings')}</span>
                </h1>
                <p className="listing-subtitle">
                    {t('listings.eastCairoSub', { count: eastCairoListings.length })}
                </p>
                <ListingLangBar placement="inline" />
            </div>
            <Breadcrumbs items={breadcrumbItems} />

            <div className="listing-hero">
                <div className={`listing-bar filters-bar ${filtersBarOpen ? 'open' : ''}`}>
                    <button
                        type="button"
                        className="listing-bar-header"
                        onClick={() => setFiltersBarOpen((o) => !o)}
                        aria-expanded={filtersBarOpen}
                    >
                        <span className="listing-bar-label">{t('listings.filters')}</span>
                        <span className="listing-bar-preview">{filterPreviewText}</span>
                        <span className="listing-bar-chevron" aria-hidden="true">{filtersBarOpen ? '−' : '+'}</span>
                    </button>
                    <div className="listing-bar-body">
                        <select value={filterDev} onChange={(e) => setFilterDev(e.target.value)} aria-label={t('listings.allDevelopers')}>
                            <option value="">{t('listings.allDevelopers')}</option>
                            {developers.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <select value={filterFinishing} onChange={(e) => setFilterFinishing(e.target.value)} aria-label={t('listings.allFinishing')}>
                            <option value="">{t('listings.allFinishing')}</option>
                            {finishings.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                        <select value={filterRooms} onChange={(e) => setFilterRooms(e.target.value)} aria-label={t('listings.allBedrooms')}>
                            <option value="">{t('listings.allBedrooms')}</option>
                            {rooms.map((r) => (
                                <option key={r} value={r}>{r} {bedsLabel(r)}</option>
                            ))}
                        </select>
                        <select value={filterDelivery} onChange={(e) => setFilterDelivery(e.target.value)} aria-label={t('listings.allStatus')}>
                            <option value="">{t('listings.allStatus')}</option>
                            <option value="ready">{t('listings.readyToMove')}</option>
                            <option value="offplan">{t('listings.offPlan')}</option>
                        </select>
                        <button type="button" className="btn-secondary btn-sm" onClick={resetFilters}>{t('listings.reset')}</button>
                    </div>
                </div>
            </div>

            <div className="container" style={{ paddingTop: 24 }}>
                {filtered.length > 0 ? (
                    <div className="listing-grid">
                        {filtered.map((listing) => (
                            <PropertyCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <p className="listings-by-area-empty">{t('listings.noMatchFilters')}</p>
                )}
            </div>

            <footer className="footer">
                <div className="footer-links">
                    <Link to={lp('/')}>{t('footer.home')}</Link>
                    <Link to={lp('/listings')}>{t('footer.listings')}</Link>
                    <Link to={lp('/east-cairo')}>{t('location.eastCairo')}</Link>
                </div>
            </footer>
        </div>
    );
}
