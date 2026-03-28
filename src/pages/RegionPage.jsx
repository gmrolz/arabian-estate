import { Link, useParams, Navigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useListings } from '../context/ListingsContext';
import { EGYPT_REGIONS, CAIRO_AREAS } from '../data/newCapitalListings';
import Breadcrumbs from '../components/Breadcrumbs';
import PropertyCard from '../components/PropertyCard';

export default function RegionPage() {
    const { region: regionSlug } = useParams();
    const { t, lp, locationLabel } = useLocale();
    const { getListingsByRegion, getFeaturedByRegion, getRepresentativeListing } = useListings();
    const regionConfig = EGYPT_REGIONS.find((r) => r.slug === regionSlug);

    if (!regionConfig) {
        return <Navigate to={lp('/listings')} replace />;
    }

    const regionLabel = locationLabel(regionSlug);
    const breadcrumbItems = [
        { label: t('location.egypt'), path: lp('/listings') },
        { label: regionLabel, path: null },
    ];
    const countOtherRegion = regionConfig.slug !== 'cairo' ? getListingsByRegion(regionSlug).length : 0;

    if (regionConfig.slug === 'cairo') {
        return (
            <div className="listing-page">
                <Breadcrumbs items={breadcrumbItems} />
                <section className="best-choices listings-hub" id="listings-cairo">
                    <div className="container">
                        <div className="section-header">
                            <div className="section-tag">{t('listings.eliteCairo')}</div>
                            <h1 className="section-title">
                                {t('location.cairo')} — <span>{t('location.areas')}</span>
                            </h1>
                            <p className="section-sub">{t('listings.newCapitalAndMore')}</p>
                        </div>

                        <div className="listings-hub-grid">
                            {CAIRO_AREAS.map((area) => {
                                const listings = getListingsByRegion(area.slug);
                                const count = listings.length;
                                const featured = getFeaturedByRegion(area.slug, 1)[0] || getRepresentativeListing(area.slug);
                                const areaLabel = locationLabel(area.slug);
                                return (
                                    <Link
                                        key={area.slug}
                                        to={lp(`/listings/cairo/${area.slug}`)}
                                        className="listings-hub-card"
                                    >
                                        <div className="listings-hub-card-inner">
                                            {featured?.images?.[0] ? (
                                                <div className="listings-hub-card-img">
                                                    <img src={featured.images[0]} alt={areaLabel} loading="lazy" decoding="async" />
                                                </div>
                                            ) : (
                                                <div className="listings-hub-card-placeholder">
                                                    <span className="listings-hub-card-icon" aria-hidden="true" />
                                                </div>
                                            )}
                                            <div className="listings-hub-card-body">
                                                <h3 className="listings-hub-card-title">{areaLabel}</h3>
                                                <p className="listings-hub-card-count">
                                                    {count} {t('listings.listings')}
                                                </p>
                                                <span className="listings-hub-card-cta">{t('listings.viewAll')} →</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {CAIRO_AREAS.map((area) => {
                            const areaListings = getListingsByRegion(area.slug);
                            const areaLabel = locationLabel(area.slug);
                            return (
                                <div key={area.slug} className="listings-by-area-section" id={`area-${area.slug}`} style={{ marginTop: '64px' }}>
                                    <div className="listings-by-area-header">
                                        <h3 className="listings-by-area-title">
                                            <Link to={lp(`/listings/cairo/${area.slug}`)}>
                                                {areaLabel}
                                            </Link>
                                            <span className="listings-by-area-count">
                                                {areaListings.length} {t('listings.listings')}
                                            </span>
                                        </h3>
                                        <Link to={lp(`/listings/cairo/${area.slug}`)} className="listings-by-area-view-all">
                                            {t('listings.viewAll')} →
                                        </Link>
                                    </div>
                                    {areaListings.length > 0 ? (
                                        <div className="listing-grid">
                                            {areaListings.map((listing) => (
                                                <PropertyCard key={listing.id} listing={listing} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="listings-by-area-empty">{t('listings.noListingsYet')}</p>
                                    )}
                                </div>
                            );
                        })}

                        <div className="section-header" style={{ marginTop: '64px' }}>
                            <div className="section-tag">{t('location.newCapital')}</div>
                            <h2 className="section-title">{t('listings.featuredThisMonth')}</h2>
                            <p className="section-sub">{t('listings.topPicks')}</p>
                        </div>
                        <div className="best-grid">
                            {getFeaturedByRegion('new-capital', 3).map((listing) => (
                                <PropertyCard key={listing.id} listing={listing} featured />
                            ))}
                        </div>
                        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}>
                            <Link to={lp('/listings/cairo/new-capital')} className="btn-primary">
                                {t('listings.viewAllNewCapital')} →
                            </Link>
                        </div>
                    </div>
                </section>

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

    if (countOtherRegion > 0) {
        const featured = getFeaturedByRegion(regionSlug, 1)[0] || getRepresentativeListing(regionSlug);
        return (
            <div className="listing-page">
                <Breadcrumbs items={breadcrumbItems} />
                <section className="best-choices listings-hub" id={`listings-${regionSlug}`}>
                    <div className="container">
                        <div className="section-header">
                            <div className="section-tag">{t('brandName')} — {regionLabel}</div>
                            <h1 className="section-title">{regionLabel}</h1>
                            <p className="section-sub">{countOtherRegion} {t('listings.listings')}</p>
                        </div>
                        <div className="listings-hub-grid">
                            <Link
                                to={lp(`/listings/${regionSlug}/${regionSlug}`)}
                                className="listings-hub-card"
                            >
                                <div className="listings-hub-card-inner">
                                    {featured?.images?.[0] ? (
                                        <div className="listings-hub-card-img">
                                            <img src={featured.images[0]} alt={regionLabel} loading="lazy" decoding="async" />
                                        </div>
                                    ) : (
                                        <div className="listings-hub-card-placeholder">
                                            <span className="listings-hub-card-icon" aria-hidden="true" />
                                        </div>
                                    )}
                                    <div className="listings-hub-card-body">
                                        <h3 className="listings-hub-card-title">{regionLabel} {t('location.listings')}</h3>
                                        <p className="listings-hub-card-count">
                                            {countOtherRegion} {t('listings.listings')}
                                        </p>
                                        <span className="listings-hub-card-cta">{t('listings.viewAll')} →</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>
                <footer className="footer">
                    <div className="footer-logo">{t('brandName').split(' ')[0]} <span>{t('brandName').split(' ').slice(1).join(' ')}</span></div>
                    <p className="footer-tagline">{t('footer.tagline')}</p>
                    <div className="footer-links">
                        <Link to={lp('/')}>{t('footer.home')}</Link>
                        <Link to={lp('/listings')}>{t('footer.listings')}</Link>
                        <Link to={lp(`/listings/${regionSlug}`)}>{regionLabel}</Link>
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

    return (
        <div className="listing-page">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="listing-hero">
                <div className="listing-hero-inner">
                    <div className="section-tag">{t('brandName')} — {regionLabel}</div>
                    <h1 className="listing-title">
                        <span>{regionLabel}</span>
                    </h1>
                    <p className="listing-subtitle">
                        {t('listings.comingSoonRegion', { region: regionLabel })}
                    </p>
                    <Link to={lp('/listings')} className="btn-primary" style={{ marginTop: 24 }}>
                        {t('listings.backToEgypt')}
                    </Link>
                    <Link to={lp('/listings/cairo')} className="btn-secondary" style={{ marginTop: 12, marginLeft: 12 }}>
                        {t('listings.browseCairo')}
                    </Link>
                </div>
            </div>
            <footer className="footer">
                <div className="footer-logo">{t('brandName').split(' ')[0]} <span>{t('brandName').split(' ').slice(1).join(' ')}</span></div>
                <div className="footer-links">
                    <Link to={lp('/')}>{t('footer.home')}</Link>
                    <Link to={lp('/listings')}>{t('footer.listings')}</Link>
                    <Link to={lp('/listings/cairo')}>{t('footer.cairo')}</Link>
                    <Link to="/admin">{t('footer.admin')}</Link>
                </div>
                <p className="footer-copy">{t('footer.copy')}</p>
                <p className="footer-credit">{t('footer.madeBy')}<a href="https://wemake.deals" target="_blank" rel="noopener noreferrer">{t('footer.dealMaker')}</a></p>
                <p className="footer-version">{t('footer.version')}</p>
            </footer>
        </div>
    );
}
