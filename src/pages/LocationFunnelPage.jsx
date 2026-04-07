/**
 * LocationFunnelPage
 * Handles all 4 levels of the location funnel:
 *   /listings/:citySlug                                     → City level
 *   /listings/:citySlug/:collectionSlug                     → Collection level
 *   /listings/:citySlug/:collectionSlug/:neighborhoodSlug   → Neighborhood level
 *   /listings/:citySlug/:collectionSlug/:neighborhoodSlug/:compoundSlug → Compound level
 *
 * Each page shows:
 *   - Breadcrumbs (Home > Listings > City > Collection > ...)
 *   - Hero with location name + count
 *   - Child location cards (if any)
 *   - Listing cards for this level
 */
import { useParams, Link, Navigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useLocale } from '../context/LocaleContext';
import Breadcrumbs from '../components/Breadcrumbs';
import PropertyCard from '../components/PropertyCard';

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
  // BFS to get all descendant location IDs
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

// ─── Region images map ───────────────────────────────────────────────────────
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

function getNodeImage(slug, listings) {
  if (REGION_IMAGES[slug]) return REGION_IMAGES[slug];
  // Fall back to first listing image
  const withImg = listings.find((l) => l.images?.[0]);
  return withImg?.images?.[0] || null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LocationFunnelPage() {
  const { citySlug, collectionSlug, neighborhoodSlug, compoundSlug } = useParams();
  const { t, lp, locale } = useLocale();

  const [state, setState] = useState({
    nodes: [],        // [cityNode, collectionNode, neighborhoodNode]
    children: [],     // child nodes of current level
    listings: [],
    loading: true,
    notFound: false,
  });

  // Determine the current level and slugs
  const slugChain = useMemo(() => {
    const chain = [];
    if (citySlug) chain.push(citySlug);
    if (collectionSlug) chain.push(collectionSlug);
    if (neighborhoodSlug) chain.push(neighborhoodSlug);
    return chain;
  }, [citySlug, collectionSlug, neighborhoodSlug]);

  const isCompoundLevel = Boolean(compoundSlug);
  const currentSlug = compoundSlug ? neighborhoodSlug : (neighborhoodSlug || collectionSlug || citySlug);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true }));

      // Resolve all nodes in the slug chain
      const nodePromises = slugChain.map((s) => fetchLocationBySlug(s));
      const nodes = await Promise.all(nodePromises);

      if (cancelled) return;

      // If any node is null, it's a 404
      if (nodes.some((n) => n === null)) {
        setState((s) => ({ ...s, loading: false, notFound: true }));
        return;
      }

      const currentNode = nodes[nodes.length - 1];

      if (isCompoundLevel) {
        // Compound level: filter listings by compoundName
        const listings = await fetchListingsByCompound(compoundSlug.replace(/-/g, ' '));
        if (!cancelled) {
          setState({ nodes, children: [], listings, loading: false, notFound: false });
        }
      } else {
        // Get all descendant IDs for this node
        const descendantIds = await fetchAllDescendantIds(currentNode.id);
        // Get direct children for navigation cards
        const children = await fetchChildren(currentNode.id);
        // Get listings for all descendants
        const listings = await fetchListingsByLocationIds(descendantIds);

        if (!cancelled) {
          setState({ nodes, children, listings, loading: false, notFound: false });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slugChain.join(','), isCompoundLevel, compoundSlug]);

  if (state.notFound) return <Navigate to={lp('/listings')} replace />;

  const { nodes, children, listings, loading } = state;
  const currentNode = nodes[nodes.length - 1];
  const isRTL = locale === 'ar';

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

  // ─── SEO title ────────────────────────────────────────────────────────────
  const pageTitle = isCompoundLevel
    ? compoundSlug.replace(/-/g, ' ')
    : currentNode
      ? (isRTL ? currentNode.nameAr : currentNode.nameEn)
      : '...';

  const heroTitle = isCompoundLevel
    ? compoundSlug.replace(/-/g, ' ')
    : currentNode
      ? (isRTL ? currentNode.nameAr : currentNode.nameEn)
      : '';

  const heroImage = currentNode ? getNodeImage(currentNode.slug, listings) : null;

  // ─── Compound cards from listings (for neighborhood level) ────────────────
  const compoundCards = useMemo(() => {
    if (isCompoundLevel || children.length > 0) return [];
    // Group listings by compoundName to show compound cards
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

  const slugifyCompound = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // ─── Build child card URL ─────────────────────────────────────────────────
  const childUrl = (child) => {
    const base = lp('/listings');
    if (!collectionSlug) return `${base}/${citySlug}/${child.slug}`;
    if (!neighborhoodSlug) return `${base}/${citySlug}/${collectionSlug}/${child.slug}`;
    return `${base}/${citySlug}/${collectionSlug}/${neighborhoodSlug}/${child.slug}`;
  };

  const compoundUrl = (compoundName) => {
    const base = lp('/listings');
    const cs = slugifyCompound(compoundName);
    if (neighborhoodSlug) return `${base}/${citySlug}/${collectionSlug}/${neighborhoodSlug}/${cs}`;
    if (collectionSlug) return `${base}/${citySlug}/${collectionSlug}/${cs}`;
    return `${base}/${citySlug}/${cs}`;
  };

  return (
    <div className="listing-page location-funnel-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Update document title for SEO */}
      {typeof document !== 'undefined' && (document.title = `${pageTitle} — Arabian Estate`)}

      <Breadcrumbs items={breadcrumbs} />

      {/* ─── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="funnel-hero" style={heroImage ? { backgroundImage: `url(${heroImage})` } : {}}>
        <div className="funnel-hero-overlay" />
        <div className="container funnel-hero-content">
          <div className="section-tag">{isRTL ? 'عقارات فاخرة' : 'Premium Properties'}</div>
          <h1 className="funnel-hero-title">{heroTitle}</h1>
          <p className="funnel-hero-count">
            {loading ? '...' : `${listings.length} ${isRTL ? 'وحدة متاحة' : 'units available'}`}
          </p>
        </div>
      </section>

      <section className="best-choices" style={{ paddingTop: '48px' }}>
        <div className="container">

          {/* ─── Child Location Cards ─────────────────────────────────────── */}
          {!loading && children.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <div className="section-header">
                <h2 className="section-title">
                  {isRTL ? 'المناطق' : 'Areas'} — <span>{heroTitle}</span>
                </h2>
              </div>
              <div className="listings-hub-grid">
                {children.map((child) => {
                  const img = REGION_IMAGES[child.slug] || null;
                  return (
                    <Link key={child.id} to={childUrl(child)} className="listings-hub-card">
                      <div className="listings-hub-card-inner">
                        {img ? (
                          <div className="listings-hub-card-img">
                            <img src={img} alt={isRTL ? child.nameAr : child.nameEn} loading="lazy" />
                          </div>
                        ) : (
                          <div className="listings-hub-card-placeholder" />
                        )}
                        <div className="listings-hub-card-body">
                          <h3 className="listings-hub-card-title">{isRTL ? child.nameAr : child.nameEn}</h3>
                          <span className="listings-hub-card-cta">{isRTL ? 'عرض العقارات ←' : 'View listings →'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Compound Cards (when at neighborhood level with no children) ── */}
          {!loading && !isCompoundLevel && compoundCards.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <div className="section-header">
                <h2 className="section-title">
                  {isRTL ? 'الكمباوندات' : 'Compounds'} — <span>{heroTitle}</span>
                </h2>
              </div>
              <div className="listings-hub-grid">
                {compoundCards.map((c) => (
                  <Link key={c.name} to={compoundUrl(c.name)} className="listings-hub-card">
                    <div className="listings-hub-card-inner">
                      {c.image ? (
                        <div className="listings-hub-card-img">
                          <img src={c.image} alt={c.name} loading="lazy" />
                        </div>
                      ) : (
                        <div className="listings-hub-card-placeholder" />
                      )}
                      <div className="listings-hub-card-body">
                        <h3 className="listings-hub-card-title">{c.name}</h3>
                        <p className="listings-hub-card-count">{c.count} {isRTL ? 'وحدة' : 'units'}</p>
                        <span className="listings-hub-card-cta">{isRTL ? 'عرض الوحدات ←' : 'View units →'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ─── Listings Grid ────────────────────────────────────────────── */}
          {!loading && listings.length > 0 && (
            <div>
              <div className="section-header">
                <h2 className="section-title">
                  {isRTL ? 'الوحدات المتاحة' : 'Available Units'} — <span>{heroTitle}</span>
                </h2>
              </div>
              <div className="best-grid">
                {listings.map((listing) => (
                  <PropertyCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}

          {/* ─── Empty State ──────────────────────────────────────────────── */}
          {!loading && listings.length === 0 && children.length === 0 && (
            <div className="funnel-empty">
              <p>{isRTL ? 'لا توجد وحدات متاحة حالياً في هذه المنطقة' : 'No units available in this area yet'}</p>
              <Link to={lp('/listings')} className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
                {isRTL ? 'عرض جميع المناطق' : 'View all areas'}
              </Link>
            </div>
          )}

          {/* ─── Loading State ────────────────────────────────────────────── */}
          {loading && (
            <div className="funnel-loading">
              <div className="loading-spinner" />
              <p>{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          )}

        </div>
      </section>

      {/* ─── CTA Section ─────────────────────────────────────────────────── */}
      {!loading && listings.length > 0 && (
        <section className="funnel-cta-section">
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
        <p className="footer-copy">© {new Date().getFullYear()} Arabian Estate</p>
      </footer>
    </div>
  );
}
