import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useListings } from '../context/ListingsContext';
import PropertyCard from './PropertyCard';

export default function BestChoices() {
    const { t, lp, locale } = useLocale();
    const { getFeaturedListings } = useListings();
    const featured = getFeaturedListings();
    const month = new Date(2026, 1).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });

    return (
        <section className="best-choices" id="best-choices">
            <div className="container">
                <div className="section-header">
                    <div className="section-tag">{t('bestChoices.tag')}</div>
                    <h2 className="section-title">
                        {t('bestChoices.title')} <span>{month}</span>
                    </h2>
                    <p className="section-sub">
                        {t('bestChoices.sub')}
                    </p>
                </div>

                <div className="best-grid">
                    {featured.map((listing) => (
                        <PropertyCard key={listing.id} listing={listing} featured />
                    ))}
                </div>

                <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}>
                    <Link to={lp('/listings')} className="btn-primary">
                        {t('bestChoices.viewAllListings')} →
                    </Link>
                </div>
            </div>
        </section>
    );
}
