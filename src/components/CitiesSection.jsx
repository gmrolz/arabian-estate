import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useListings } from '../context/ListingsContext';

const EAST_CAIRO_AREAS = [
  {
    slug: 'area-new-capital',
    nameAr: 'العاصمة الإدارية الجديدة',
    nameEn: 'New Administrative Capital',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-capital-378KSLviMbPW84dsXFFurd.webp',
  },
  {
    slug: 'area-new-cairo',
    nameAr: 'التجمع الخامس',
    nameEn: 'New Cairo',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-cairo-fYAFjbQS5E4ZtN3BPEngbW.webp',
  },
  {
    slug: 'area-mostakbal-city',
    nameAr: 'مدينة المستقبل',
    nameEn: 'Mostakbal City',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-mostakbal-mQLbJUaFNDE6hWmKKZotzH.webp',
  },
];

const OTHER_REGIONS = [
  {
    slug: 'north-coast',
    nameAr: 'الساحل الشمالي',
    nameEn: 'North Coast',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-north-coast-F4fqLbUxVzighKm8nh2ZFt.webp',
    funnelPath: '/listings/cairo/north-coast',
  },
  {
    slug: 'sokhna',
    nameAr: 'العين السخنة',
    nameEn: 'Ain Sokhna',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-sokhna-J3aMcmqTDxbDeCxX25zQJm.webp',
    funnelPath: '/listings/cairo/sokhna',
  },
  {
    slug: 'galala',
    nameAr: 'الجلالة',
    nameEn: 'Galala',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-galala-VR6RnhGf8SFFkrZFR8TENb.webp',
    funnelPath: '/listings/cairo/galala',
  },
  {
    slug: 'hurghada',
    nameAr: 'الغردقة',
    nameEn: 'Hurghada',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-hurghada-Gt2ntR2UHD7p5wLDpHVxGM.webp',
    funnelPath: '/listings/cairo/hurghada',
  },
];

export default function CitiesSection() {
  const { t, lp, locale } = useLocale();
  const { listings } = useListings();
  const isRTL = locale === 'ar';

  // Count listings per location slug (using area_slug fallback)
  const countBySlug = (slug) => {
    return listings.filter((l) => l.area_slug === slug || l.areaSlug === slug).length;
  };

  const totalCairo = listings.filter((l) =>
    ['new-capital', 'new-cairo', 'mostakbal-city'].includes(l.area_slug || l.areaSlug)
  ).length;

  return (
    <section className="cities-section" id="cities">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">{t('listings.curatedBy')}</div>
          <h2 className="section-title">
            {isRTL ? 'تصفح حسب المنطقة' : 'Browse by Location'} — <span>{isRTL ? 'مصر' : 'Egypt'}</span>
          </h2>
          <p className="section-sub">{t('listings.browseByRegion')}</p>
        </div>

        {/* ─── Cairo Featured Block ─────────────────────────────────────── */}
        <div className="cities-cairo-block">
          {/* Cairo header row */}
          <div className="cities-cairo-header">
            <div className="cities-cairo-title-row">
              <h3 className="cities-cairo-title">
                {isRTL ? 'القاهرة' : 'Cairo'}
              </h3>
              <span className="cities-cairo-count">
                {totalCairo} {isRTL ? 'وحدة' : 'units'}
              </span>
            </div>
            <Link to={lp('/listings/cairo')} className="cities-cairo-viewall">
              {isRTL ? 'عرض الكل' : 'View all'} →
            </Link>
          </div>

          {/* East Cairo sub-section */}
          <div className="cities-east-cairo">
            <div className="cities-subcollection-label">
              <Link to={lp('/listings/cairo/east-cairo')} className="cities-subcollection-link">
                {isRTL ? 'شرق القاهرة' : 'East Cairo'}
                <span className="cities-subcollection-arrow">›</span>
              </Link>
            </div>
            <div className="cities-areas-grid">
              {EAST_CAIRO_AREAS.map((area) => {
                const count = countBySlug(area.slug.replace('area-', '').replace(/-/g, '-'));
                return (
                  <Link
                    key={area.slug}
                    to={lp(`/listings/cairo/east-cairo/${area.slug}`)}
                    className="cities-area-card"
                  >
                    <div className="cities-area-img">
                      <img src={area.image} alt={isRTL ? area.nameAr : area.nameEn} loading="lazy" />
                    </div>
                    <div className="cities-area-body">
                      <h4 className="cities-area-name">{isRTL ? area.nameAr : area.nameEn}</h4>
                      <span className="cities-area-cta">{isRTL ? 'عرض العقارات ←' : 'View listings →'}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Other Regions ────────────────────────────────────────────── */}
        <div className="listings-hub-grid cities-section-grid" style={{ marginTop: '32px' }}>
          {OTHER_REGIONS.map((region) => (
            <Link
              key={region.slug}
              to={lp(region.funnelPath)}
              className="listings-hub-card"
            >
              <div className="listings-hub-card-inner">
                <div className="listings-hub-card-img">
                  <img src={region.image} alt={isRTL ? region.nameAr : region.nameEn} loading="lazy" />
                </div>
                <div className="listings-hub-card-body">
                  <h3 className="listings-hub-card-title">{isRTL ? region.nameAr : region.nameEn}</h3>
                  <p className="listings-hub-card-count">{isRTL ? 'قريباً' : 'Coming soon'}</p>
                  <span className="listings-hub-card-cta">{isRTL ? 'استكشف' : 'Explore'}</span>
                </div>
              </div>
            </Link>
          ))}
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
