import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { CAIRO_AREAS } from '../data/newCapitalListings';

/**
 * Navigation bar for listing pages — links to Listings, Cairo, and all areas.
 * Used on admin listings page only. Set admin={true} for links to open in new tab.
 */
export default function ListingsAreaNav({ admin = false }) {
    const { t, lp, locationLabel } = useLocale();

    const links = [
        { to: lp('/listings'), label: t('location.egypt'), key: 'egypt' },
        { to: lp('/listings/cairo'), label: t('location.cairo'), key: 'cairo' },
        ...CAIRO_AREAS.map((area) => ({ to: lp(`/listings/cairo/${area.slug}`), label: locationLabel(area.slug), key: area.slug })),
    ];

    return (
        <nav className="listings-area-nav" aria-label="Listings navigation">
            <div className="listings-area-nav-inner">
                {links.map(({ to, label, key }) =>
                    admin ? (
                        <a
                            key={key}
                            href={to}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="listings-area-nav-link"
                        >
                            {label}
                        </a>
                    ) : (
                        <Link key={key} to={to} className="listings-area-nav-link">
                            {label}
                        </Link>
                    )
                )}
            </div>
        </nav>
    );
}
