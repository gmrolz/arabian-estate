import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { controlListings, getAnalyticsByListing, deleteListing, setListingsOrder } from '../../lib/listingsApi';
import { useSite } from '../../context/SiteContext';
import { formatNumberReadable } from '../../lib/format';
import { useAdminToast } from '../../context/AdminToastContext';
import AdminListingsSitemap from '../../components/AdminListingsSitemap';

export default function AdminListings() {
  const { showToast } = useAdminToast();
  const { siteId } = useSite();
  const [listings, setListings] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null); // locationId (number) | null

  // Full location tree for resolving names: id → node
  const [locationMap, setLocationMap] = useState({});

  const fetchData = () => {
    setLoading(true);
    Promise.all([controlListings(siteId), getAnalyticsByListing(siteId)]).then(([listRes, analyticsRes]) => {
      setListings(listRes.data || []);
      setAnalytics(analyticsRes.data || {});
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [siteId]);

  // Build a flat id→node map from the location tree
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch('/api/locations/all');
        if (!res.ok) return;
        const all = await res.json();
        const map = {};
        all.forEach(n => { map[n.id] = n; });
        setLocationMap(map);
      } catch (e) {
        console.error('Failed to load locations', e);
      }
    }
    loadLocations();
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this listing?')) return;
    const { error } = await deleteListing(id);
    if (error) {
      showToast(error?.message || 'Delete failed', 'error');
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== id));
    showToast('Listing deleted', 'success');
  };

  const handleMove = async (index, direction) => {
    if (listings.length < 2) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= listings.length) return;
    const next = [...listings];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    const orderedIds = next.map((l) => l.id);
    setMoving(index);
    const { error } = await setListingsOrder(orderedIds);
    setMoving(null);
    if (error) {
      showToast(error?.message || 'Failed to update order', 'error');
      return;
    }
    setListings(next);
    showToast('Order updated', 'success');
  };

  // Get all descendant IDs for a locationId (including itself)
  function getDescendantIds(locId, map) {
    const ids = new Set([locId]);
    // Find children
    Object.values(map).forEach(n => {
      if (n.parentId === locId) {
        getDescendantIds(n.id, map).forEach(id => ids.add(id));
      }
    });
    return ids;
  }

  // Filter listings by selectedFilter (locationId) — include all descendants
  const filteredListings = useMemo(() => {
    if (!selectedFilter) return listings;
    const ids = getDescendantIds(selectedFilter, locationMap);
    return listings.filter(l => ids.has(l.locationId));
  }, [listings, selectedFilter, locationMap]);

  // Group filtered listings by their neighborhood name for display
  const groupedListings = useMemo(() => {
    const groups = {};
    filteredListings.forEach(l => {
      let label = 'All Listings';
      if (l.locationId && locationMap[l.locationId]) {
        const node = locationMap[l.locationId];
        label = node.nameEn || node.nameAr || `Location ${l.locationId}`;
      } else if (l.locationId) {
        // locationMap not loaded yet — use area_slug as fallback
        label = l.area_slug || 'Other';
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(l);
    });
    return groups;
  }, [filteredListings, locationMap]);

  if (loading) {
    return (
      <div className="admin-page">
        <p className="admin-loading">Loading…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1 className="admin-page-title">Listings</h1>
        <Link to="/admin/listings/new" className="admin-btn admin-btn-primary">
          Add listing
        </Link>
      </div>
      <p className="admin-listings-hint">Click a location in the sitemap to filter. Use ↑ ↓ to reorder. Listings are grouped by area.</p>

      <AdminListingsSitemap
        listings={listings}
        selectedFilter={selectedFilter}
        onFilter={setSelectedFilter}
      />

      <div className="admin-listings-by-area">
        {Object.entries(groupedListings).map(([areaLabel, areaListings]) => (
          <section key={areaLabel} className="admin-listings-area-section">
            <h2 className="admin-listings-area-title">
              {areaLabel}
              <span className="admin-listings-area-count">
                {areaListings.length === 0 ? '0 units available' : `${areaListings.length} listing${areaListings.length !== 1 ? 's' : ''}`}
              </span>
            </h2>
            <div className="admin-listings-list">
              {areaListings.map((l) => {
                const globalIndex = listings.findIndex((item) => item.id === l.id);
                const a = analytics[l.id] || {};
                const imgUrl = Array.isArray(l.images) && l.images.length > 0
                  ? (l.images[0].url ?? l.images[0])
                  : null;
                const isMoving = moving === globalIndex;
                const title = l.title_ar || l.title_en || '—';
                const project = l.compoundName || l.project_ar || l.project_en || '—';
                const developer = l.developer_ar || l.developer_en || '—';
                return (
                  <div key={l.id} className="admin-listing-card">
                    <div className="admin-listing-order">
                      <span className="admin-listing-num">{globalIndex + 1}</span>
                      <div className="admin-listing-move">
                        <button
                          type="button"
                          className="admin-btn admin-btn-icon"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMove(globalIndex, -1); }}
                          disabled={globalIndex === 0 || isMoving}
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-icon"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMove(globalIndex, 1); }}
                          disabled={globalIndex === listings.length - 1 || isMoving}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    <Link to={`/admin/listings/${l.id}`} className="admin-listing-card-link">
                      <div className="admin-listing-card-img">
                        {imgUrl ? (
                          <img src={imgUrl} alt="" />
                        ) : (
                          <span className="admin-listing-card-noimg">No image</span>
                        )}
                      </div>
                      <div className="admin-listing-card-body">
                        <div className="admin-listing-card-title">{title}</div>
                        <div className="admin-listing-card-project">{project}</div>
                        <div className="admin-listing-card-developer">{developer}{l.location ? ` · ${l.location}` : ''}</div>
                        {l.delivery && <div className="admin-listing-card-delivery">Delivery: {l.delivery}</div>}
                        <div className="admin-listing-card-specs">
                          {l.area != null && <span>{l.area} m²</span>}
                          {l.rooms != null && <span>{l.rooms} beds</span>}
                          {l.toilets != null && <span>{l.toilets} bath</span>}
                          {l.finishing && <span>{l.finishing}</span>}
                        </div>
                        <hr className="admin-listing-card-divider" />
                        <div className="admin-listing-card-pricing">
                          {l.downpayment && <div className="admin-listing-price-row"><span>Pay now</span><span>EGP {formatNumberReadable(l.downpayment)}</span></div>}
                          {l.monthly_inst && <div className="admin-listing-price-row"><span>Monthly</span><span>{formatNumberReadable(l.monthly_inst)} /mo</span></div>}
                          {l.price && <div className="admin-listing-price-row"><span>Price</span><span>EGP {formatNumberReadable(l.price)}</span></div>}
                        </div>
                        <div className="admin-listing-card-stats">
                          <span>Views {a.view ?? 0}</span>
                          <span>CTA {(a.cta_whatsapp ?? 0) + (a.cta_call ?? 0)}</span>
                          <span>Photos {a.photo_view ?? 0}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="admin-listing-card-actions">
                      <div className="admin-listing-id-badge">ID: {l.id}</div>
                      <Link to={`/admin/listings/${l.id}`} className="admin-btn admin-btn-sm admin-btn-primary">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={(e) => handleDelete(e, l.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filteredListings.length === 0 && (
          <p className="admin-listings-empty">No listings found for this location.</p>
        )}
      </div>
    </div>
  );
}
