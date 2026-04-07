import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useListings } from '../context/ListingsContext';
import { EGYPT_REGIONS } from '../data/newCapitalListings';
import Breadcrumbs from '../components/Breadcrumbs';
import PropertyCard from '../components/PropertyCard';

export default function ListingsPage() {
    const { t, lp, locationLabel } = useLocale();
    const { getListingsCountByEgyptRegion, getFeaturedByRegion, getRepresentativeListing } = useListings();
    const egyptBreadcrumb = [{ label: t('location.egypt'), path: null }];

    return (
        <div className="listing-page">
            <Breadcrumbs items={egyptBreadcrumb} />
            <section className="best-choices listings-hub" id="listings">
                <div className="container">
                    <div className="section-header">
                        <div className="section-tag">{t('listings.curatedBy')}</div>
                        <h2 className="section-title">
                            {t('location.egypt')} — <span>{t('listings.cities')}</span>
                        </h2>
                        <p className="section-sub">{t('listings.browseByRegion')}</p>
                    </div>

                    <div className="listings-hub-grid">
                        {EGYPT_REGIONS.map((region) => {
                            const count = getListingsCountByEgyptRegion(region.slug);
                            const label = locationLabel(region.slug);
                            // Cairo goes to /listings/cairo/east-cairo (the main collection)
                            const funnelUrl = region.slug === 'cairo'
                              ? lp('/listings/cairo/east-cairo')
                              : lp(`/listings/${region.slug}`);

                            return (
                                <Link
                                    key={region.slug}
                                    to={funnelUrl}
                                    className="listings-hub-card"
                                >
                                    <div className="listings-hub-card-inner">
                                        <div className="listings-hub-card-img">
                                            <img src={region.image} alt={label} loading="lazy" />
                                        </div>
                                        <div className="listings-hub-card-body">
                                            <h3 className="listings-hub-card-title">{label}</h3>
                                            <p className="listings-hub-card-count">
                                                {count > 0 ? `${count} ${t('listings.listings')}` : t('listings.comingSoon')}
                                            </p>
                                            <span className="listings-hub-card-cta">
                                                {count > 0 ? t('listings.viewAll') + ' →' : t('listings.explore')}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="section-header" style={{ marginTop: '64px' }}>
                        <div className="section-tag">{t('listings.cairoNewCapital')}</div>
                        <h2 className="section-title">{t('listings.featuredThisMonth')}</h2>
                        <p className="section-sub">{t('listings.topPicks')}</p>
                    </div>
                    <div className="best-grid">
                        {getFeaturedByRegion('new-capital', 3).map((listing) => (
                            <PropertyCard key={listing.id} listing={listing} featured />
                        ))}
                    </div>
                    <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}>
                        <Link to={lp('/listings/cairo/east-cairo')} className="btn-primary">
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
                    <Link to={lp('/listings/cairo/east-cairo')}>{t('location.eastCairo')}</Link>
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
