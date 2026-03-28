import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useListings } from '../context/ListingsContext';
import { EGYPT_REGIONS } from '../data/newCapitalListings';

export default function CitiesSection() {
    const { t, lp, locationLabel } = useLocale();
    const { getListingsCountByEgyptRegion, getFeaturedByRegion, getRepresentativeListing } = useListings();

    return (
        <section className="cities-section" id="cities">
            <div className="container">
                <div className="section-header">
                    <div className="section-tag">{t('listings.curatedBy')}</div>
                    <h2 className="section-title">
                        {t('listings.cities')} — <span>{t('location.egypt')}</span>
                    </h2>
                    <p className="section-sub">{t('listings.browseByRegion')}</p>
                </div>

                <div className="listings-hub-grid cities-section-grid">
                    <Link to={lp('/east-cairo')} className="listings-hub-card listings-hub-card--featured">
                        <div className="listings-hub-card-inner">
                            {(getFeaturedByRegion('new-capital', 1)[0] || getRepresentativeListing('new-capital'))?.images?.[0] ? (
                                <div className="listings-hub-card-img">
                                    <img src={(getFeaturedByRegion('new-capital', 1)[0] || getRepresentativeListing('new-capital')).images[0]} alt={t('location.eastCairo')} loading="lazy" decoding="async" />
                                </div>
                            ) : (
                                <div className="listings-hub-card-placeholder">
                                    <span className="listings-hub-card-icon" aria-hidden="true">🏠</span>
                                </div>
                            )}
                            <div className="listings-hub-card-body">
                                <h3 className="listings-hub-card-title">{t('location.eastCairo')}</h3>
                                <p className="listings-hub-card-count">
                                    {getListingsCountByEgyptRegion('cairo')} {t('listings.listings')}
                                </p>
                                <span className="listings-hub-card-cta">{t('listings.viewAll')} →</span>
                            </div>
                        </div>
                    </Link>
                    {EGYPT_REGIONS.map((region) => {
                        const count = getListingsCountByEgyptRegion(region.slug);
                        const featured = (region.slug === 'cairo' ? getFeaturedByRegion('new-capital', 1)[0] : getFeaturedByRegion(region.slug, 1)[0]) || getRepresentativeListing(region.slug);
                        const label = locationLabel(region.slug);

                        return (
                            <Link
                                key={region.slug}
                                to={region.slug === 'cairo' ? lp('/east-cairo') : lp(`/listings/${region.slug}`)}
                                className="listings-hub-card"
                            >
                                <div className="listings-hub-card-inner">
                                    {featured?.images?.[0] ? (
                                        <div className="listings-hub-card-img">
                                            <img src={featured.images[0]} alt={label} loading="lazy" decoding="async" />
                                        </div>
                                    ) : (
                                        <div className="listings-hub-card-placeholder">
                                            <span className="listings-hub-card-icon" aria-hidden="true">🏠</span>
                                        </div>
                                    )}
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

                <div className="cities-section-cta">
                    <Link to={lp('/listings')} className="btn-primary">
                        {t('bestChoices.viewAllListings')} →
                    </Link>
                </div>
            </div>
        </section>
    );
}
