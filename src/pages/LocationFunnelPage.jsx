/**
 * LocationFunnelPage — PropertyFinder-style layout
 * Routes:
 *   /listings/:citySlug
 *   /listings/:citySlug/:collectionSlug
 *   /listings/:citySlug/:collectionSlug/:neighborhoodSlug
 *   /listings/:citySlug/:collectionSlug/:neighborhoodSlug/:compoundSlug
 *
 * Layout (PropertyFinder-inspired):
 *   1. Breadcrumbs
 *   2. Page title + unit count
 *   3. Sub-location chips (clickable pills with counts)
 *   4. Quick filters bar (type, price, rooms)
 *   5. Listings grid
 *   6. CTA section
 */
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useLocale } from '../context/LocaleContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchLocationBySlug(slug) {
  if (!slug) return null;
  const r = await fetch(`/api/locations/by-slug/${slug}`);
  if (!r.ok) return null;
  const d = await r.json();
  return d?.error ? null : d;
}

async function fetchChildren(nodeId) {
  if (!nodeId) return [];
  const r = await fetch(`/api/locations/${nodeId}/children`);
  if (!r.ok) return [];
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}

async function fetchAllDescendantIds(nodeId) {
  const ids = [];
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    ids.push(current);
    const children = await fetchChildren(current);
    children.forEach((c) => queue.push(c.id));
  }
  return ids;
}

async function fetchListingsByLocationIds(locationIds) {
  if (!locationIds || locationIds.length === 0) return [];
  const url = `/api/trpc/listings.list?input=${encodeURIComponent(JSON.stringify({ locationIds }))}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const d = await r.json();
  return d?.result?.data?.json ?? [];
}

async function fetchListingsByCompound(compoundName) {
  if (!compoundName) return [];
  const url = `/api/trpc/listings.list?input=${encodeURIComponent(JSON.stringify({ compoundName }))}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const d = await r.json();
  return d?.result?.data?.json ?? [];
}

// ─── Region images ───────────────────────────────────────────────────────────
const REGION_IMAGES = {
  'east-cairo': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-capital-378KSLviMbPW84dsXFFurd.webp',
  'west-cairo': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-cairo-6EJu2WXYNx8bbVMTZuSKvH.webp',
  'cairo': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-cairo-6EJu2WXYNx8bbVMTZuSKvH.webp',
  'area-new-capital': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-capital-378KSLviMbPW84dsXFFurd.webp',
  'area-new-cairo': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-new-cairo-fYAFjbQS5E4ZtN3BPEngbW.webp',
  'area-mostakbal-city': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-mostakbal-mQLbJUaFNDE6hWmKKZotzH.webp',
  'north-coast': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-north-coast-F4fqLbUxVzighKm8nh2ZFt.webp',
  'red-sea': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-hurghada-Gt2ntR2UHD7p5wLDpHVxGM.webp',
  'hurghada': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-hurghada-Gt2ntR2UHD7p5wLDpHVxGM.webp',
  'sokhna': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-sokhna-J3aMcmqTDxbDeCxX25zQJm.webp',
  'galala': 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/region-galala-VR6RnhGf8SFFkrZFR8TENb.webp',
};

// ─── PropertyCard (inline lightweight version) ───────────────────────────────
import PropertyCard from '../components/PropertyCard';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LocationFunnelPage() {
  const { citySlug, collectionSlug, neighborhoodSlug, compoundSlug } = useParams();
  const { lp, locale } = useLocale();
  const navigate = useNavigate();
  const isRTL = locale === 'ar';

  const [state, setState] = useState({
    nodes: [],
    children: [],
    childDescendantIds: {}, // { childId: Set<locationId> }
    listings: [],
    loading: true,
    notFound: false,
  });

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterRooms, setFilterRooms] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [chipsExpanded, setChipsExpanded] = useState(false);

  const slugChain = useMemo(() => {
    const chain = [];
    if (citySlug) chain.push(citySlug);
    if (collectionSlug) chain.push(collectionSlug);
    if (neighborhoodSlug) chain.push(neighborhoodSlug);
    return chain;
  }, [citySlug, collectionSlug, neighborhoodSlug]);

  const isCompoundLevel = Boolean(compoundSlug);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState((s) => ({ ...s, loading: true }));
      const nodePromises = slugChain.map((s) => fetchLocationBySlug(s));
      const nodes = await Promise.all(nodePromises);
      if (cancelled) return;
      if (nodes.some((n) => n === null)) {
        setState((s) => ({ ...s, loading: false, notFound: true }));
        return;
      }
      const currentNode = nodes[nodes.length - 1];
      if (isCompoundLevel) {
        const listings = await fetchListingsByCompound(compoundSlug.replace(/-/g, ' '));
        if (!cancelled) setState({ nodes, children: [], listings, loading: false, notFound: false });
      } else {
        const [descendantIds, children] = await Promise.all([
          fetchAllDescendantIds(currentNode.id),
          fetchChildren(currentNode.id),
        ]);
        // Build descendant ID sets per child for accurate chip counts
        const childDescendantIds = {};
        await Promise.all(children.map(async (child) => {
          const ids = await fetchAllDescendantIds(child.id);
          childDescendantIds[child.id] = new Set(ids);
        }));
        const listings = await fetchListingsByLocationIds(descendantIds);
        if (!cancelled) setState({ nodes, children, childDescendantIds, listings, loading: false, notFound: false });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slugChain.join(','), isCompoundLevel, compoundSlug]);

  if (state.notFound) return <Navigate to={lp('/listings')} replace />;

  const { nodes, children, childDescendantIds, listings, loading } = state;
  const currentNode = nodes[nodes.length - 1];

  // ─── Breadcrumbs ──────────────────────────────────────────────────────────
  const breadcrumbs = [
    { label: isRTL ? 'الرئيسية' : 'Home', path: lp('/') },
    { label: isRTL ? 'العقارات' : 'Listings', path: lp('/listings') },
  ];
  nodes.forEach((node, i) => {
    const slugs = slugChain.slice(0, i + 1);
    const path = lp(`/listings/${slugs.join('/')}`);
    breadcrumbs.push({
      label: isRTL ? node.nameAr : node.nameEn,
      path: i < nodes.length - 1 ? path : null,
    });
  });
  if (isCompoundLevel) {
    breadcrumbs.push({ label: compoundSlug.replace(/-/g, ' '), path: null });
  }

  const pageTitle = isCompoundLevel
    ? compoundSlug.replace(/-/g, ' ')
    : currentNode ? (isRTL ? currentNode.nameAr : currentNode.nameEn) : '...';

  // ─── Child URL builder ────────────────────────────────────────────────────
  const childUrl = (child) => {
    const base = lp('/listings');
    if (!collectionSlug) return `${base}/${citySlug}/${child.slug}`;
    if (!neighborhoodSlug) return `${base}/${citySlug}/${collectionSlug}/${child.slug}`;
    return `${base}/${citySlug}/${collectionSlug}/${neighborhoodSlug}/${child.slug}`;
  };

  const slugifyCompound = (name) =>
    name.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, '-').replace(/^-|-$/g, '');

  const compoundUrl = (compoundName) => {
    const base = lp('/listings');
    const cs = slugifyCompound(compoundName);
    if (neighborhoodSlug) return `${base}/${citySlug}/${collectionSlug}/${neighborhoodSlug}/${cs}`;
    if (collectionSlug) return `${base}/${citySlug}/${collectionSlug}/${cs}`;
    return `${base}/${citySlug}/${cs}`;
  };

  // ─── Compound cards (when at leaf level with no children) ─────────────────
  const compoundCards = useMemo(() => {
    if (isCompoundLevel || children.length > 0) return [];
    const map = {};
    listings.forEach((l) => {
      const key = l.compoundName || l.project || '';
      if (!key) return;
      if (!map[key]) map[key] = { name: key, count: 0, image: null };
      map[key].count += 1;
      if (!map[key].image && l.images?.[0]) map[key].image = l.images[0];
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [listings, isCompoundLevel, children.length]);

  // ─── Child listing counts per child node (includes all descendants) ─────────
  const childCounts = useMemo(() => {
    const map = {};
    children.forEach((child) => {
      const descendantSet = childDescendantIds[child.id];
      if (descendantSet) {
        map[child.id] = listings.filter((l) => l.locationId && descendantSet.has(l.locationId)).length;
      } else {
        // Fallback: direct match
        map[child.id] = listings.filter((l) => l.locationId === child.id).length;
      }
    });
    return map;
  }, [listings, children, childDescendantIds]);

  // ─── Filtered listings ────────────────────────────────────────────────────
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (filterType && l.type !== filterType) return false;
      if (filterRooms && String(l.rooms) !== String(filterRooms)) return false;
      if (filterMinPrice && l.price < Number(filterMinPrice)) return false;
      if (filterMaxPrice && l.price > Number(filterMaxPrice)) return false;
      return true;
    });
  }, [listings, filterType, filterRooms, filterMinPrice, filterMaxPrice]);

  const hasActiveFilter = filterType || filterRooms || filterMinPrice || filterMaxPrice;

  // ─── Property types from current listings ─────────────────────────────────
  const availableTypes = useMemo(() => {
    const types = new Set();
    listings.forEach((l) => { if (l.type) types.add(l.type); });
    return Array.from(types);
  }, [listings]);

  const heroImage = currentNode ? (REGION_IMAGES[currentNode.slug] || null) : null;

  // SEO
  if (typeof document !== 'undefined') {
    document.title = `${pageTitle} — Arabian Estate`;
  }

  return (
    <div className="pf-page" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── Breadcrumbs ─────────────────────────────────────────────────── */}
      <div className="pf-breadcrumbs">
        <div className="container">
          <nav aria-label="breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="pf-crumb">
                {i > 0 && <span className="pf-crumb-sep">{isRTL ? '›' : '›'}</span>}
                {crumb.path ? (
                  <Link to={crumb.path}>{crumb.label}</Link>
                ) : (
                  <span className="pf-crumb-current">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="container pf-main">

        {/* ─── Page Header ───────────────────────────────────────────────── */}
        <div className="pf-header">
          <h1 className="pf-title">
            {isRTL ? 'عقارات للبيع في' : 'Properties for sale in'} {pageTitle}
          </h1>
          {!loading && (
            <p className="pf-count">
              {filteredListings.length.toLocaleString()} {isRTL ? 'وحدة متاحة' : 'properties'}
            </p>
          )}
        </div>

        {/* ─── Sub-location Chips ────────────────────────────────────────── */}
        {!loading && children.length > 0 && (
          <div className="pf-chips-wrapper">
            <div className={`pf-chips-row${chipsExpanded ? ' expanded' : ''}`}>
              {children.map((child) => {
                const count = childCounts[child.id] || 0;
                return (
                  <Link key={child.id} to={childUrl(child)} className="pf-chip">
                    {isRTL ? child.nameAr : child.nameEn}
                    {count > 0 && <span className="pf-chip-count">({count})</span>}
                  </Link>
                );
              })}
            </div>
            {children.length > 4 && (
              <button
                className="pf-chips-show-more"
                onClick={() => setChipsExpanded((v) => !v)}
              >
                {chipsExpanded
                  ? (isRTL ? '▲ عرض أقل' : '▲ Show Less')
                  : (isRTL ? `▼ عرض المزيد (${children.length - 4}+)` : `▼ Show More (${children.length - 4}+)`)}
              </button>
            )}
          </div>
        )}

        {/* ─── Compound Chips (leaf level) ───────────────────────────────── */}
        {!loading && !isCompoundLevel && compoundCards.length > 0 && children.length === 0 && (
          <div className="pf-chips-wrapper">
            <div className={`pf-chips-row${chipsExpanded ? ' expanded' : ''}`}>
              {compoundCards.map((c) => (
                <Link key={c.name} to={compoundUrl(c.name)} className="pf-chip">
                  {c.name}
                  <span className="pf-chip-count">({c.count})</span>
                </Link>
              ))}
            </div>
            {compoundCards.length > 4 && (
              <button
                className="pf-chips-show-more"
                onClick={() => setChipsExpanded((v) => !v)}
              >
                {chipsExpanded
                  ? (isRTL ? '▲ عرض أقل' : '▲ Show Less')
                  : (isRTL ? `▼ عرض المزيد (${compoundCards.length - 4}+)` : `▼ Show More (${compoundCards.length - 4}+)`)}
              </button>
            )}
          </div>
        )}

        {/* ─── Filters Bar ───────────────────────────────────────────────── */}
        {!loading && listings.length > 0 && (
          <div className="pf-filters-bar">
            <div className="pf-filters-row">
              {/* Type filter */}
              <select
                className="pf-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">{isRTL ? 'نوع العقار' : 'Property Type'}</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Rooms filter */}
              <select
                className="pf-filter-select"
                value={filterRooms}
                onChange={(e) => setFilterRooms(e.target.value)}
              >
                <option value="">{isRTL ? 'الغرف' : 'Beds'}</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} {isRTL ? 'غرف' : 'Beds'}</option>
                ))}
              </select>

              {/* Price toggle */}
              <button
                className={`pf-filter-select pf-filter-btn${showFilters ? ' active' : ''}`}
                onClick={() => setShowFilters((v) => !v)}
              >
                {isRTL ? 'السعر' : 'Price'}
                <span style={{ marginInlineStart: '6px' }}>{showFilters ? '▲' : '▼'}</span>
              </button>

              {/* Clear filters */}
              {hasActiveFilter && (
                <button
                  className="pf-filter-clear"
                  onClick={() => { setFilterType(''); setFilterRooms(''); setFilterMinPrice(''); setFilterMaxPrice(''); }}
                >
                  {isRTL ? 'مسح الفلاتر' : 'Clear filters'}
                </button>
              )}
            </div>

            {/* Price range (expanded) */}
            {showFilters && (
              <div className="pf-price-range">
                <input
                  type="number"
                  className="pf-price-input"
                  placeholder={isRTL ? 'الحد الأدنى' : 'Min price'}
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                />
                <span className="pf-price-sep">—</span>
                <input
                  type="number"
                  className="pf-price-input"
                  placeholder={isRTL ? 'الحد الأقصى' : 'Max price'}
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <div className="funnel-loading">
            <div className="loading-spinner" />
            <p>{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        )}

        {/* ─── Listings Grid ─────────────────────────────────────────────── */}
        {!loading && filteredListings.length > 0 && (
          <div className="best-grid pf-listings-grid">
            {filteredListings.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* ─── No results after filter ───────────────────────────────────── */}
        {!loading && filteredListings.length === 0 && listings.length > 0 && (
          <div className="funnel-empty">
            <p>{isRTL ? 'لا توجد نتائج تطابق الفلاتر المحددة' : 'No results match your filters'}</p>
            <button
              className="btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => { setFilterType(''); setFilterRooms(''); setFilterMinPrice(''); setFilterMaxPrice(''); }}
            >
              {isRTL ? 'مسح الفلاتر' : 'Clear filters'}
            </button>
          </div>
        )}

        {/* ─── Empty state (no listings at all) ─────────────────────────── */}
        {!loading && listings.length === 0 && children.length === 0 && (
          <div className="funnel-empty">
            <p>{isRTL ? 'لا توجد وحدات متاحة حالياً في هذه المنطقة' : 'No units available in this area yet'}</p>
            <Link to={lp('/listings')} className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
              {isRTL ? 'عرض جميع المناطق' : 'View all areas'}
            </Link>
          </div>
        )}

      </div>

      {/* ─── CTA Section ─────────────────────────────────────────────────── */}
      {!loading && listings.length > 0 && (
        <section className="funnel-cta-section" style={{ marginTop: '64px' }}>
          <div className="container funnel-cta-inner">
            <h2>{isRTL ? 'هل تبحث عن وحدة مناسبة؟' : 'Looking for the right unit?'}</h2>
            <p>{isRTL ? 'تواصل معنا الآن للحصول على أفضل الأسعار والعروض الحصرية' : 'Contact us now for the best prices and exclusive offers'}</p>
            <div className="funnel-cta-buttons">
              <a href="https://wa.me/201000257941" className="btn-whatsapp" target="_blank" rel="noopener noreferrer">
                {isRTL ? 'واتساب' : 'WhatsApp'}
              </a>
              <a href="tel:+201000257941" className="btn-call">
                {isRTL ? 'اتصل بنا' : 'Call Us'}
              </a>
            </div>
          </div>
        </section>
      )}

      <footer className="footer">
        <div className="footer-logo">Arabian <span>Estate</span></div>
        <p className="footer-tagline">{isRTL ? 'شريكك العقاري الموثوق' : 'Your trusted real estate partner'}</p>
        <div className="footer-links">
          <Link to={lp('/')}>{isRTL ? 'الرئيسية' : 'Home'}</Link>
          <Link to={lp('/listings')}>{isRTL ? 'العقارات' : 'Listings'}</Link>
          <Link to="/admin">Admin</Link>
        </div>
        <p className="footer-copy">© 2025 Arabian Estate. All rights reserved.</p>
      </footer>
    </div>
  );
}
