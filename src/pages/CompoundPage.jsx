import { useParams, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useHeaderVisibility } from '../context/HeaderVisibilityContext';
import { useListings } from '../context/ListingsContext';
import { CAIRO_AREAS, EGYPT_REGIONS } from '../data/newCapitalListings';
import Breadcrumbs from '../components/Breadcrumbs';
import ListingLangBar from '../components/ListingLangBar';
import PropertyCard from '../components/PropertyCard';

export default function CompoundPage() {
    const { region: regionSlug, area: areaSlug, compoundSlug } = useParams();
    const { t, lp, locationLabel } = useLocale();
    const { getListingsByCompound, getProjectBySlug } = useListings();

    const isCairo = regionSlug === 'cairo';
    const areaConfigCairo = CAIRO_AREAS.find((a) => a.slug === areaSlug);
    const areaConfigOther = !isCairo && areaSlug === regionSlug ? EGYPT_REGIONS.find((r) => r.slug === regionSlug) : null;
    const areaConfig = isCairo ? areaConfigCairo : (areaConfigOther ? { slug: areaConfigOther.slug, label: areaConfigOther.label } : null);

    const location = useLocation();
    const projectName = getProjectBySlug(areaSlug, compoundSlug);
    const listings = getListingsByCompound(areaSlug, compoundSlug);

    useEffect(() => {
        const hash = location.hash?.slice(1);
        if (!hash || !hash.startsWith('unit-')) return;
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [location.hash, listings.length]);

    if (!areaConfig || !projectName || listings.length === 0) {
        const redirectTo = isCairo ? lp(`/listings/cairo/${areaSlug || ''}`) : lp('/listings');
        return <Navigate to={redirectTo} replace />;
    }

    const areaLabel = locationLabel(areaSlug);
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

    const breadcrumbItems = [
        { label: t('location.egypt'), path: lp('/listings') },
        { label: t('location.cairo'), path: lp('/listings/cairo') },
        { label: areaLabel, path: lp(`/listings/cairo/${areaSlug}`) },
        { label: projectName, path: null },
    ];

    return (
        <div className="listing-page">
            <Breadcrumbs items={breadcrumbItems} />

            <div className="listing-hero">
                <div className="listing-hero-inner">
                    <div className="section-tag">{t('listings.eliteCairo')}</div>
                    <h1 className="listing-title">
                        <span>{projectName}</span>
                    </h1>
                    <p className="listing-subtitle">
                        {t('listings.unitsIn', { count: listings.length, project: projectName, area: areaLabel })}
                    </p>
                    <ListingLangBar placement="inline" />
                </div>
            </div>

            <div className="listing-grid-section">
                <div className="listing-grid">
                    {listings.slice(0, 3).map((listing) => (
                        <div key={listing.id} id={`unit-${listing.unitCode ?? listing.id}`} className="listing-card-wrap">
                            <PropertyCard listing={listing} />
                        </div>
                    ))}
                    <div ref={sentinelRef} className="header-visibility-sentinel" aria-hidden="true" />
                    {listings.slice(3).map((listing) => (
                        <div key={listing.id} id={`unit-${listing.unitCode ?? listing.id}`} className="listing-card-wrap">
                            <PropertyCard listing={listing} />
                        </div>
                    ))}
                </div>
            </div>

            <footer className="footer">
                <div className="footer-logo">{t('brandName').split(' ')[0]} <span>{t('brandName').split(' ').slice(1).join(' ')}</span></div>
                <p className="footer-tagline">{t('footer.tagline')}</p>
                <div className="footer-links">
                    <Link to={lp('/')}>{t('footer.home')}</Link>
                    <Link to={lp('/listings')}>{t('footer.listings')}</Link>
                    <Link to={lp('/listings/cairo')}>{t('footer.cairo')}</Link>
                    <Link to={lp(`/listings/cairo/${areaSlug}`)}>{areaLabel}</Link>
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
