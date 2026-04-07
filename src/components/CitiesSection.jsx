import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useListings } from '../context/ListingsContext';
import { EGYPT_REGIONS } from '../data/newCapitalListings';

export default function CitiesSection() {
    const { t, lp, locationLabel } = useLocale();
    const { getListingsCountByEgyptRegion } = useListings();

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
                    <Link to={lp('/listings/cairo/east-cairo')} className="listings-hub-card listings-hub-card--featured">
                        <div className="listings-hub-card-inner">
                            <div className="listings-hub-card-img">
                                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-capital-378KSLviMbPW84dsXFFurd.webp" alt={t('location.eastCairo')} loading="lazy" decoding="async" />
                            </div>
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
                        const label = locationLabel(region.slug);

                        return (
                            <Link
                                key={region.slug}
                                to={lp(`/listings/${region.slug}`)}
                                className="listings-hub-card"
                            >
                                <div className="listings-hub-card-inner">
                                    <div className="listings-hub-card-img">
                                        <img src={region.image} alt={label} loading="lazy" decoding="async" />
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

                <div className="cities-section-cta">
                    <Link to={lp('/listings')} className="btn-primary">
                        {t('bestChoices.viewAllListings')} →
                    </Link>
                </div>
            </div>
        </section>
    );
}
