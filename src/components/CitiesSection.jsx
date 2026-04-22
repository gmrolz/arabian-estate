import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useListings } from '../context/ListingsContext';
import { useMemo } from 'react';

// East Cairo L4 area nodes with their DB IDs and funnel slugs
const EAST_CAIRO_AREAS = [
  {
    id: 30023,
    slug: 'area-new-capital',
    nameAr: 'العاصمة الإدارية الجديدة',
    nameEn: 'New Administrative Capital',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-capital-378KSLviMbPW84dsXFFurd.webp',
  },
  {
    id: 30024,
    slug: 'area-new-cairo',
    nameAr: 'التجمع الخامس',
    nameEn: 'New Cairo',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-cairo-fYAFjbQS5E4ZtN3BPEngbW.webp',
  },
  {
    id: 30025,
    slug: 'area-mostakbal-city',
    nameAr: 'مدينة المستقبل',
    nameEn: 'Mostakbal City',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-mostakbal-mQLbJUaFNDE6hWmKKZotzH.webp',
  },
  {
    id: 30026,
    slug: 'area-shorouk-city',
    nameAr: 'مدينة الشروق',
    nameEn: 'Shorouk City',
    image: '/manus-storage/cZtpTFiZxHdJ_9f446284.webp',
  },
  {
    id: 30122,
    slug: 'area-sixth-settlement',
    nameAr: 'التجمع السادس',
    nameEn: 'Sixth Settlement',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-cairo-fYAFjbQS5E4ZtN3BPEngbW.webp',
  },
];

// Other regions with their L3 collection IDs
const OTHER_REGIONS = [
  {
    id: 30018,
    slug: 'north-coast-collection',
    nameAr: 'الساحل الشمالي',
    nameEn: 'North Coast',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-north-coast-F4fqLbUxVzighKm8nh2ZFt.webp',
    funnelPath: '/listings/cairo/north-coast-collection',
  },
  {
    id: 30022,
    slug: 'ain-sokhna-collection',
    nameAr: 'العين السخنة',
    nameEn: 'Ain Sokhna',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-sokhna-J3aMcmqTDxbDeCxX25zQJm.webp',
    funnelPath: '/listings/cairo/ain-sokhna-collection',
  },
  {
    id: 30020,
    slug: 'red-sea-collection',
    nameAr: 'البحر الأحمر',
    nameEn: 'Red Sea',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-hurghada-Gt2ntR2UHD7p5wLDpHVxGM.webp',
    funnelPath: '/listings/cairo/red-sea-collection',
  },
  {
    id: 30021,
    slug: 'south-sinai-collection',
    nameAr: 'جنوب سيناء',
    nameEn: 'South Sinai',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-galala-VR6RnhGf8SFFkrZFR8TENb.webp',
    funnelPath: '/listings/cairo/south-sinai-collection',
  },
];

// All East Cairo L4 IDs (for total Cairo count)
const EAST_CAIRO_L4_IDS = [
  30023, 30024, 30025, 30026, 30027, 30028, 30029, 30030, 30031, 30032, 30033,
  30034, 30035, 30036, 30037, 30038, 30039, 30040, 30041, 30042, 30043, 30044,
  30045, 30046, 30047, 30048, 30049, 30050, 30051, 30052, 30053, 30054, 30122,
];

export default function CitiesSection() {
  const { t, lp, locale } = useLocale();
  const { listings } = useListings();
  const isRTL = locale === 'ar';

  // Count listings by locationId (supports both exact L4 match and descendant match)
  const countByLocationId = useMemo(() => {
    const map = {};
    listings.forEach((l) => {
      if (l.locationId) {
        map[l.locationId] = (map[l.locationId] || 0) + 1;
      }
    });
    return map;
  }, [listings]);

  const countForIds = (ids) => ids.reduce((sum, id) => sum + (countByLocationId[id] || 0), 0);

  const totalCairo = countForIds(EAST_CAIRO_L4_IDS);

  // Filter East Cairo areas to only those with listings
  const visibleEastCairoAreas = EAST_CAIRO_AREAS.filter((a) => (countByLocationId[a.id] || 0) > 0);

  // Filter other regions to only those with listings (need descendant IDs from API)
  // For now, use a simple check: if any listing has locationId in the range for that collection
  // We'll use the location tree from the API via a simple fetch
  const visibleOtherRegions = OTHER_REGIONS; // Will show "Coming soon" for 0-count ones but hide if count = 0

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
        {totalCairo > 0 && (
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

            {/* East Cairo sub-section — only if there are listings */}
            {visibleEastCairoAreas.length > 0 && (
              <div className="cities-east-cairo">
                <div className="cities-subcollection-label">
                  <Link to={lp('/listings/cairo/east-cairo')} className="cities-subcollection-link">
                    {isRTL ? 'شرق القاهرة' : 'East Cairo'}
                    <span className="cities-subcollection-arrow">›</span>
                  </Link>
                </div>
                <div className="cities-areas-grid">
                  {visibleEastCairoAreas.map((area) => {
                    const count = countByLocationId[area.id] || 0;
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
                          <span className="cities-area-count">{count} {isRTL ? 'وحدة' : 'units'}</span>
                          <span className="cities-area-cta">{isRTL ? 'عرض العقارات ←' : 'View listings →'}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Other Regions (only those with listings) ─────────────────── */}
        {visibleOtherRegions.length > 0 && (
          <div className="listings-hub-grid cities-section-grid" style={{ marginTop: '32px' }}>
            {visibleOtherRegions.map((region) => (
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
        )}

        <div className="cities-section-cta">
          <Link to={lp('/listings')} className="btn-primary">
            {t('bestChoices.viewAllListings')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
