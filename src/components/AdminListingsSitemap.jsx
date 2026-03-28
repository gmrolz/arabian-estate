import { useState, useEffect } from 'react';
import { EGYPT_REGIONS, CAIRO_AREAS } from '../data/newCapitalListings';

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Sitemap-style navigation for admin listings.
 * Hierarchy: Egypt → Cities → Neighborhoods. Click to filter displayed listings.
 */
export default function AdminListingsSitemap({ listingsByArea = {}, selectedFilter, onFilter }) {
  const [popupUrl, setPopupUrl] = useState(null);

  useEffect(() => {
    if (!popupUrl) return;
    const onKey = (e) => e.key === 'Escape' && setPopupUrl(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popupUrl]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const openPreview = (path) => setPopupUrl(baseUrl + path);
  const closePreview = () => setPopupUrl(null);

  return (
    <nav className="admin-sitemap" aria-label="Listings sitemap">
      <div className="admin-sitemap-inner">
        <div className="admin-sitemap-level admin-sitemap-level--top">
          <button
            type="button"
            className={`admin-sitemap-filter ${!selectedFilter ? 'active' : ''}`}
            onClick={() => onFilter?.(null)}
          >
            Egypt
          </button>
          <button
            type="button"
            className="admin-sitemap-preview"
            onClick={() => openPreview('/listings')}
            title="Preview on site"
            aria-label="Preview Egypt page on site"
          >
            <EyeIcon />
          </button>
        </div>

        {EGYPT_REGIONS.map((region) => {
          const isCairo = region.slug === 'cairo';
          const subAreas = isCairo ? CAIRO_AREAS : [];
          const regionCount = isCairo
            ? (listingsByArea['new-capital'] || []).length + (listingsByArea['new-cairo'] || []).length + (listingsByArea['mostakbal-city'] || []).length
            : (listingsByArea[region.slug] || []).length;
          const regionPath = isCairo ? '/listings/cairo' : `/listings/${region.slug}`;

          return (
            <div key={region.slug} className="admin-sitemap-branch">
              <div className="admin-sitemap-level admin-sitemap-level--city">
                <span className="admin-sitemap-sep">└</span>
                <button
                  type="button"
                  className={`admin-sitemap-filter ${selectedFilter === region.slug ? 'active' : ''}`}
                  onClick={() => onFilter?.(region.slug)}
                >
                  {region.label}
                </button>
                <span className="admin-sitemap-count">
                  {regionCount === 0 ? '0 units available' : `(${regionCount})`}
                </span>
                <button
                  type="button"
                  className="admin-sitemap-preview"
                  onClick={() => openPreview(regionPath)}
                  title={`Preview ${region.label} on site`}
                  aria-label={`Preview ${region.label} on site`}
                >
                  <EyeIcon />
                </button>
              </div>

              {subAreas.length > 0 && (
                <div className="admin-sitemap-level admin-sitemap-level--areas">
                  {subAreas.map((area) => {
                    const count = (listingsByArea[area.slug] || []).length;
                    return (
                      <div key={area.slug} className="admin-sitemap-row">
                        <span className="admin-sitemap-sep">├</span>
                        <button
                          type="button"
                          className={`admin-sitemap-area admin-sitemap-filter ${selectedFilter === area.slug ? 'active' : ''}`}
                          onClick={() => onFilter?.(area.slug)}
                        >
                          {area.label}
                          <span className="admin-sitemap-count">
                            {count === 0 ? '0 units available' : `(${count})`}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="admin-sitemap-preview admin-sitemap-preview--sm"
                          onClick={() => openPreview(`/listings/cairo/${area.slug}`)}
                          title={`Preview ${area.label} on site`}
                          aria-label={`Preview ${area.label} on site`}
                        >
                          <EyeIcon />
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

      {popupUrl && (
        <div className="admin-sitemap-popup-overlay" onClick={closePreview} role="dialog" aria-modal="true" aria-label="Site preview">
          <div className="admin-sitemap-popup" onClick={(e) => e.stopPropagation()}>
            <div className="admin-sitemap-popup-header">
              <span className="admin-sitemap-popup-title">Preview</span>
              <button type="button" className="admin-sitemap-popup-close" onClick={closePreview} aria-label="Close preview">
                ×
              </button>
            </div>
            <iframe src={popupUrl} title="Site preview" className="admin-sitemap-popup-iframe" />
          </div>
        </div>
      )}
    </nav>
  );
}
