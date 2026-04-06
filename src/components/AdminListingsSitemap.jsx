import { useState, useEffect } from 'react';

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * Collapsible sitemap-style navigation for admin listings.
 * Hierarchy: City (L2) → Collection (L3) → Neighborhood (L4)
 */
export default function AdminListingsSitemap({ listings = [], selectedFilter, onFilter }) {
  const [tree, setTree] = useState([]);
  const [popupUrl, setPopupUrl] = useState(null);
  // Track which cities and collections are expanded
  const [expandedCities, setExpandedCities] = useState({});
  const [expandedColls, setExpandedColls] = useState({});

  // Build the location tree from the DB
  useEffect(() => {
    async function loadTree() {
      try {
        const citiesRes = await fetch('/api/locations/level/2');
        const cities = citiesRes.ok ? await citiesRes.json() : [];

        const built = await Promise.all(cities.map(async (city) => {
          const collRes = await fetch(`/api/locations/${city.id}/children`);
          const collections = collRes.ok ? await collRes.json() : [];

          const withAreas = await Promise.all(collections.map(async (coll) => {
            const areaRes = await fetch(`/api/locations/${coll.id}/children`);
            const areas = areaRes.ok ? await areaRes.json() : [];
            return { ...coll, areas };
          }));

          return { ...city, collections: withAreas };
        }));

        const filtered = built.filter(c => c.collections.length > 0);
        setTree(filtered);

        // Auto-expand cities that have listings
        const autoExpand = {};
        filtered.forEach(city => {
          const hasListings = city.collections.some(coll =>
            coll.areas.some(area => listings.some(l => l.locationId === area.id)) ||
            listings.some(l => l.locationId === coll.id)
          ) || listings.some(l => l.locationId === city.id);
          if (hasListings) autoExpand[city.id] = true;
        });
        setExpandedCities(autoExpand);
      } catch (e) {
        console.error('Failed to load location tree', e);
      }
    }
    loadTree();
  }, []);

  function countForLocation(locId, allListings) {
    return allListings.filter(l => l.locationId === locId).length;
  }

  function countForCity(city, allListings) {
    let count = 0;
    for (const coll of city.collections) {
      for (const area of coll.areas) count += countForLocation(area.id, allListings);
      count += countForLocation(coll.id, allListings);
    }
    count += countForLocation(city.id, allListings);
    return count;
  }

  function countForCollection(coll, allListings) {
    let count = countForLocation(coll.id, allListings);
    for (const area of coll.areas) count += countForLocation(area.id, allListings);
    return count;
  }

  const toggleCity = (id) => setExpandedCities(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleColl = (id) => setExpandedColls(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (!popupUrl) return;
    const onKey = (e) => e.key === 'Escape' && setPopupUrl(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popupUrl]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const closePreview = () => setPopupUrl(null);
  const totalCount = listings.length;

  return (
    <nav className="admin-sitemap" aria-label="Listings sitemap">
      <div className="admin-sitemap-inner">
        {/* All listings */}
        <div className="admin-sitemap-level admin-sitemap-level--top">
          <button
            type="button"
            className={`admin-sitemap-filter ${!selectedFilter ? 'active' : ''}`}
            onClick={() => onFilter?.(null)}
          >
            All Listings
          </button>
          <span className="admin-sitemap-count">({totalCount})</span>
          <button
            type="button"
            className="admin-sitemap-preview"
            onClick={() => setPopupUrl(baseUrl + '/listings')}
            title="Preview listings on site"
            aria-label="Preview listings on site"
          >
            <EyeIcon />
          </button>
        </div>

        {tree.map((city) => {
          const cityCount = countForCity(city, listings);
          const isCityOpen = !!expandedCities[city.id];

          return (
            <div key={city.id} className="admin-sitemap-branch">
              {/* City level — clickable to expand/collapse */}
              <div className="admin-sitemap-level admin-sitemap-level--city">
                <span className="admin-sitemap-sep">└</span>
                <button
                  type="button"
                  className="admin-sitemap-toggle"
                  onClick={() => toggleCity(city.id)}
                  aria-expanded={isCityOpen}
                  aria-label={`${isCityOpen ? 'Collapse' : 'Expand'} ${city.nameEn}`}
                >
                  <ChevronIcon open={isCityOpen} />
                </button>
                <button
                  type="button"
                  className={`admin-sitemap-filter ${selectedFilter === city.id ? 'active' : ''}`}
                  onClick={() => onFilter?.(city.id)}
                >
                  {city.nameEn}
                </button>
                <span className="admin-sitemap-count">
                  {cityCount === 0 ? '0 units' : `(${cityCount})`}
                </span>
              </div>

              {/* Collections — only shown when city is expanded */}
              {isCityOpen && city.collections.map((coll, ci) => {
                const collCount = countForCollection(coll, listings);
                const isLastColl = ci === city.collections.length - 1;
                const isCollOpen = !!expandedColls[coll.id];

                return (
                  <div key={coll.id} className="admin-sitemap-branch admin-sitemap-branch--sub">
                    <div className="admin-sitemap-level admin-sitemap-level--collection">
                      <span className="admin-sitemap-sep">{isLastColl ? '└' : '├'}</span>
                      <button
                        type="button"
                        className="admin-sitemap-toggle"
                        onClick={() => toggleColl(coll.id)}
                        aria-expanded={isCollOpen}
                        aria-label={`${isCollOpen ? 'Collapse' : 'Expand'} ${coll.nameEn}`}
                      >
                        <ChevronIcon open={isCollOpen} />
                      </button>
                      <button
                        type="button"
                        className={`admin-sitemap-filter ${selectedFilter === coll.id ? 'active' : ''}`}
                        onClick={() => onFilter?.(coll.id)}
                      >
                        {coll.nameEn}
                      </button>
                      <span className="admin-sitemap-count">
                        {collCount === 0 ? '0 units' : `(${collCount})`}
                      </span>
                    </div>

                    {/* Neighborhoods — only shown when collection is expanded */}
                    {isCollOpen && coll.areas.length > 0 && (
                      <div className="admin-sitemap-level admin-sitemap-level--areas">
                        {coll.areas.map((area, ai) => {
                          const areaCount = countForLocation(area.id, listings);
                          const isLast = ai === coll.areas.length - 1;
                          return (
                            <div key={area.id} className="admin-sitemap-row">
                              <span className="admin-sitemap-sep admin-sitemap-sep--deep">{isLast ? '└' : '├'}</span>
                              <button
                                type="button"
                                className={`admin-sitemap-area admin-sitemap-filter ${selectedFilter === area.id ? 'active' : ''}`}
                                onClick={() => onFilter?.(area.id)}
                              >
                                {area.nameEn}
                                {areaCount > 0 && (
                                  <span className="admin-sitemap-count"> ({areaCount})</span>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {popupUrl && (
        <div className="admin-sitemap-popup-overlay" onClick={closePreview} role="dialog" aria-modal="true" aria-label="Site preview">
          <div className="admin-sitemap-popup" onClick={(e) => e.stopPropagation()}>
            <div className="admin-sitemap-popup-header">
              <span className="admin-sitemap-popup-title">Preview</span>
              <button type="button" className="admin-sitemap-popup-close" onClick={closePreview} aria-label="Close preview">×</button>
            </div>
            <iframe src={popupUrl} title="Site preview" className="admin-sitemap-popup-iframe" />
          </div>
        </div>
      )}
    </nav>
  );
}
