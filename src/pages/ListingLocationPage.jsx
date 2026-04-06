import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useHeaderVisibility } from '../context/HeaderVisibilityContext';
import { useListings } from '../context/ListingsContext';
import { CAIRO_AREAS, EGYPT_REGIONS } from '../data/newCapitalListings';
import Breadcrumbs from '../components/Breadcrumbs';
import ListingLangBar from '../components/ListingLangBar';
import PropertyCard from '../components/PropertyCard';
import LocationTree from '../components/LocationTree';

function getUniqueValuesFromList(list, key) {
    return [...new Set(list.map((l) => l[key]))].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));
}

export default function ListingLocationPage() {
    const { region: regionSlug, area: areaSlug } = useParams();
    const { t, lp, locationLabel } = useLocale();
    const { getListingsByRegion, getCompoundsByRegion } = useListings();
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [showLocationTree, setShowLocationTree] = useState(false);
    const [filterDev, setFilterDev] = useState('');
    const [filterFinishing, setFilterFinishing] = useState('');
    const [filterDelivery, setFilterDelivery] = useState('');
    const [filterRooms, setFilterRooms] = useState('');
    const [compoundsExpanded, setCompoundsExpanded] = useState(false);
    const [filtersBarOpen, setFiltersBarOpen] = useState(false);
    const [compoundsBarOpen, setCompoundsBarOpen] = useState(false);

    const isCairo = regionSlug === 'cairo';
    const areaConfigCairo = CAIRO_AREAS.find((a) => a.slug === areaSlug);
    const areaConfigOther = !isCairo && areaSlug === regionSlug ? EGYPT_REGIONS.find((r) => r.slug === regionSlug) : null;
    const areaConfig = isCairo ? areaConfigCairo : (areaConfigOther ? { slug: areaConfigOther.slug, label: areaConfigOther.label } : null);

    if (!areaConfig) {
        if (regionSlug !== 'cairo') return <Navigate to={lp('/listings')} replace />;
        return <Navigate to={lp('/listings/cairo')} replace />;
    }

    const regionListings = getListingsByRegion(areaSlug);
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

    const developers = getUniqueValuesFromList(regionListings, 'developer');
    const finishings = getUniqueValuesFromList(regionListings, 'finishing');
    const rooms = getUniqueValuesFromList(regionListings, 'rooms').map(String);

    const filtered = useMemo(() => {
        return regionListings.filter((l) => {
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
    }, [regionListings, filterDev, filterFinishing, filterRooms, filterDelivery]);

    const resetFilters = () => {
        setFilterDev('');
        setFilterFinishing('');
        setFilterDelivery('');
        setFilterRooms('');
    };

    const areaLabel = locationLabel(areaSlug);

    const regionLabel = locationLabel(regionSlug);
    if (regionListings.length === 0) {
        const emptyBreadcrumb = [
            { label: t('location.egypt'), path: lp('/listings') },
            { label: regionLabel, path: lp(`/listings/${regionSlug}`) },
            { label: areaLabel, path: null },
        ];
        return (
            <div className="listing-page">
                <Breadcrumbs items={emptyBreadcrumb} />
                <div className="listing-hero">
                    <div className="listing-hero-inner">
                        <h1 className="listing-title">{areaLabel} <span>{t('location.listings')}</span></h1>
                        <p className="listing-subtitle">{t('listings.noListingsYet')}</p>
                        <Link to={lp(`/listings/${regionSlug}`)} className="btn-primary" style={{ marginTop: 24 }}>{t('listings.backToEgypt')}</Link>
                    </div>
                </div>
                <footer className="footer">
                    <div className="footer-logo">{t('brandName').split(' ')[0]} <span>{t('brandName').split(' ').slice(1).join(' ')}</span></div>
                    <div className="footer-links">
                        <Link to={lp('/')}>{t('footer.home')}</Link>
                        <Link to={lp('/listings')}>{t('footer.listings')}</Link>
                        <Link to={lp(`/listings/${regionSlug}`)}>{regionLabel}</Link>
                        <Link to="/admin">{t('footer.admin')}</Link>
                    </div>
                    <p className="footer-credit">{t('footer.madeBy')}<a href="https://wemake.deals" target="_blank" rel="noopener noreferrer">{t('footer.dealMaker')}</a></p>
                    <p className="footer-version">{t('footer.version')}</p>
                </footer>
            </div>
        );
    }

    const titleWord = areaLabel.split(' ')[0];
    const titleRest = areaLabel.split(' ').slice(1).join(' ') || areaLabel;
    const compounds = getCompoundsByRegion(areaSlug);
    const INITIAL_COMPOUNDS = 6;
    const compoundsToShow = compoundsExpanded ? compounds : compounds.slice(0, INITIAL_COMPOUNDS);
    const hasMoreCompounds = compounds.length > INITIAL_COMPOUNDS;

    const breadcrumbItems = [
        { label: t('location.egypt'), path: lp('/listings') },
        { label: regionLabel, path: lp(`/listings/${regionSlug}`) },
        { label: areaLabel, path: null },
    ];

    const bedsLabel = (r) => r === '1' ? t('listings.bedroom') : t('listings.bedrooms');
    const filterPreviewText = [filterDev, filterFinishing, filterRooms ? `${filterRooms} ${t('card.beds')}` : '', filterDelivery].filter(Boolean).join(' · ') || t('listings.filterPreview');

    return (
        <div className="listing-page">
            <div className="listing-hero-inner listing-title-wrap">
                <h1 className="listing-title">
                    {titleWord} <span>{titleRest || t('location.listings')}</span>
                </h1>
                <p className="listing-subtitle">
                    {t('listings.browseCount', { count: regionListings.length, area: areaLabel })}
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
                        <span className="listing-bar-meta">
                            <strong>{filtered.length}</strong>/{regionListings.length}
                        </span>
                        <span className="listing-bar-chevron" aria-hidden="true">{filtersBarOpen ? '−' : '+'}</span>
                    </button>
                    <div className="listing-bar-content">
                        <div className="filters">
                            <select
                                className="filter-select"
                                value={filterDev}
                                onChange={(e) => setFilterDev(e.target.value)}
                                aria-label={t('aria.filterDeveloper')}
                            >
                                <option value="">{t('listings.allDevelopers')}</option>
                                {developers.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <select
                                className="filter-select"
                                value={filterFinishing}
                                onChange={(e) => setFilterFinishing(e.target.value)}
                                aria-label={t('aria.filterFinishing')}
                            >
                                <option value="">{t('listings.allFinishing')}</option>
                                {finishings.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <select
                                className="filter-select"
                                value={filterRooms}
                                onChange={(e) => setFilterRooms(e.target.value)}
                                aria-label={t('aria.filterBedrooms')}
                            >
                                <option value="">{t('listings.allBedrooms')}</option>
                                {rooms.map((r) => (
                                    <option key={r} value={r}>{r} {bedsLabel(r)}</option>
                                ))}
                            </select>
                            <select
                                className="filter-select"
                                value={filterDelivery}
                                onChange={(e) => setFilterDelivery(e.target.value)}
                                aria-label={t('aria.filterDelivery')}
                            >
                                <option value="">{t('listings.allStatus')}</option>
                                <option value="ready">{t('listings.readyToMove')}</option>
                                <option value="offplan">{t('listings.offPlan')}</option>
                            </select>
                            <button className="filter-reset" onClick={resetFilters}>{t('listings.reset')}</button>
                        </div>
                    </div>
                </div>

                {compounds.length > 0 && (
                    <div className={`listing-bar compounds-bar ${compoundsBarOpen ? 'open' : ''}`}>
                        <button
                            type="button"
                            className="listing-bar-header"
                            onClick={() => setCompoundsBarOpen((o) => !o)}
                            aria-expanded={compoundsBarOpen}
                        >
                            <span className="listing-bar-label">{t('listings.compounds')}</span>
                            <span className="listing-bar-preview">
                                {compounds.slice(0, 3).map((c) => c.project).join(', ')}
                                {compounds.length > 3 && '…'}
                            </span>
                            <span className="listing-bar-meta">{compounds.length}</span>
                            <span className="listing-bar-chevron" aria-hidden="true">{compoundsBarOpen ? '−' : '+'}</span>
                        </button>
                        <div className="listing-bar-content">
                            <div className="compounds-grid">
                                {compoundsToShow.map((c) => (
                                    <Link
                                        key={c.slug}
                                        to={lp(`/listings/cairo/${areaSlug}/${c.slug}`)}
                                        className="compound-card"
                                    >
                                        <span className="compound-card-name">{c.project}</span>
                                        <span className="compound-card-count">{c.count} {c.count !== 1 ? t('listings.units') : t('listings.unit')}</span>
                                    </Link>
                                ))}
                            </div>
                            {hasMoreCompounds && (
                                <button
                                    type="button"
                                    className="compounds-see-more"
                                    onClick={(e) => { e.stopPropagation(); setCompoundsExpanded((prev) => !prev); }}
                                >
                                    {compoundsExpanded ? t('listings.seeLess') : `${t('listings.seeMore')} (+${compounds.length - INITIAL_COMPOUNDS})`}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="listing-grid-section">
                <h2 className="listings-heading">{t('listings.allListings')}</h2>
                <div className="listing-grid">
                    {filtered.length > 0 ? (
                        <>
                            {filtered.slice(0, 3).map((listing) => (
                                <PropertyCard key={listing.id} listing={listing} />
                            ))}
                            <div ref={sentinelRef} className="header-visibility-sentinel" aria-hidden="true" />
                            {filtered.slice(3).map((listing) => (
                                <PropertyCard key={listing.id} listing={listing} />
                            ))}
                        </>
                    ) : (
                        <div className="no-results">
                            <div className="no-results-icon" aria-hidden="true" />
                            <p>{t('listings.noMatchFilters')}</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="footer">
                <div className="footer-logo">{t('brandName').split(' ')[0]} <span>{t('brandName').split(' ').slice(1).join(' ')}</span></div>
                <p className="footer-tagline">{t('footer.tagline')}</p>
                <div className="footer-links">
                    <Link to={lp('/')}>{t('footer.home')}</Link>
                    <Link to={lp('/listings')}>{t('footer.listings')}</Link>
                    <Link to={lp('/listings/cairo')}>{t('footer.cairo')}</Link>
                    <Link to={lp('/listings/cairo/new-capital')}>{t('footer.newCapital')}</Link>
                    <Link to={lp('/listings/cairo/new-cairo')}>{t('footer.newCairo')}</Link>
                    <Link to={lp('/listings/cairo/mostakbal-city')}>{t('footer.mostakbalCity')}</Link>
                    <a href="#about">{t('footer.about')}</a>
                    <a href="#contact">{t('footer.contact')}</a>
                    <Link to="/admin">{t('footer.admin')}</Link>
                </div>
                <p className="footer-copy">{t('footer.copy')}</p>
                <p className="footer-credit">{t('footer.madeBy')}<a href="https://wemake.deals" target="_blank" rel="noopener noreferrer">{t('footer.dealMaker')}</a></p>
                <p className="footer-version">{t('footer.version')}</p>
            </footer>
        </div>
    );
}
