import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { controlListings, getAnalyticsByListingInRange, getAnalyticsDaily } from '../../lib/listingsApi';
// Supabase removed — using Manus backend now
import { useSite } from '../../context/SiteContext';
import { formatNumberReadable } from '../../lib/format';

const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];

function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function getRangeDates(value, customFrom, customTo) {
  if (value === 'all') return { from: null, to: null };
  if (value === 'custom' && customFrom && customTo) {
    const from = new Date(customFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  const now = new Date();
  let from, to;
  if (value === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
    to = now;
  } else if (value === 'yesterday') {
    from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    to = new Date(from);
    to.setHours(23, 59, 59, 999);
  } else {
    to = now;
    from = new Date(now);
    if (value === '7d') from.setDate(from.getDate() - 7);
    else if (value === '30d') from.setDate(from.getDate() - 30);
    else if (value === '90d') from.setDate(from.getDate() - 90);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

function listingTitle(l) {
  return l.title_ar || l.title_en || l.project_ar || l.project_en || `#${l.id}`;
}

const AREA_LABELS = {
  'new-capital': 'New Capital',
  'new-cairo': 'New Cairo',
  'mostakbal-city': 'Mostakbal City',
  'north-coast': 'North Coast',
  sokhna: 'Sokhna',
  galala: 'Galala',
  hurghada: 'Hurghada',
};
function areaLabel(slug) {
  return AREA_LABELS[slug] || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Other');
}

export default function AdminDashboard() {
  const { siteId } = useSite();
  const [listings, setListings] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [byArea, setByArea] = useState({});
  const [uniqueVisits, setUniqueVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [customFrom, setCustomFrom] = useState(toDateOnly(new Date()));
  const [customTo, setCustomTo] = useState(toDateOnly(new Date()));
  const [sortBy, setSortBy] = useState('view');
  const [sortDir, setSortDir] = useState('desc');
  const [popupUnit, setPopupUnit] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [dailyData, setDailyData] = useState([]);

  const fetchAnalytics = useCallback(() => {
    if (timeRange === 'custom' && (!customFrom || !customTo)) return;
    setRefreshing(true);
    setAnalyticsError(null);
    const { from, to } = getRangeDates(timeRange, customFrom, customTo);
    Promise.all([
      getAnalyticsByListingInRange(from, to, siteId),
      from && to ? getAnalyticsDaily(from, to, siteId) : Promise.resolve({ data: [], error: null }),
    ]).then(([res, dailyRes]) => {
      if (res.error) {
        setAnalyticsError(res.error?.message || String(res.error));
      } else {
        setAnalytics(res.data || {});
        setUniqueVisits(res.uniqueVisits ?? 0);
        setByArea(res.byArea || {});
      }
      setDailyData(dailyRes?.data || []);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    });
  }, [timeRange, customFrom, customTo, siteId]);

  useEffect(() => {
    let cancelled = false;
    controlListings(siteId).then((res) => {
      if (!cancelled) setListings(res.data || []);
    });
    return () => { cancelled = true; };
  }, [siteId]);

  useEffect(() => {
    let cancelled = false;
    if (timeRange === 'custom' && (!customFrom || !customTo)) return;
    setLoading(true);
    setAnalyticsError(null);
    const { from, to } = getRangeDates(timeRange, customFrom, customTo);
    Promise.all([
      getAnalyticsByListingInRange(from, to, siteId),
      from && to ? getAnalyticsDaily(from, to, siteId) : Promise.resolve({ data: [], error: null }),
    ]).then(([res, dailyRes]) => {
      if (!cancelled) {
        if (res.error) {
          setAnalyticsError(res.error?.message || String(res.error));
        } else {
          setAnalytics(res.data || {});
          setUniqueVisits(res.uniqueVisits ?? 0);
          setByArea(res.byArea || {});
        }
        setDailyData(dailyRes?.data || []);
        setLastUpdated(new Date());
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [timeRange, customFrom, customTo, siteId]);

  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const rangeLabel = useMemo(() => {
    const { from, to } = getRangeDates(timeRange, customFrom, customTo);
    if (!from || !to) return 'All time';
    const fromStr = from.slice(0, 10);
    const toStr = to.slice(0, 10);
    return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
  }, [timeRange, customFrom, customTo]);

  useEffect(() => {
    if (!popupUnit) return;
    const onKey = (e) => { if (e.key === 'Escape') setPopupUnit(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popupUnit]);

  const rows = useMemo(() => {
    return listings.map((l) => {
      const a = analytics[l.id] || {};
      const view = a.view || 0;
      const lead = a.lead || 0;
      const ctaWhatsApp = a.cta_whatsapp || 0;
      const ctaCall = a.cta_call || 0;
      const ctaClicks = ctaWhatsApp + ctaCall;
      const photoView = a.photo_view || 0;
      const cv = view > 0 ? ((lead / view) * 100).toFixed(1) : '—';
      const ctr = view > 0 ? ((ctaClicks / view) * 100).toFixed(1) : '—';
      return {
        ...l,
        view,
        lead,
        ctaClicks,
        ctaWhatsApp,
        ctaCall,
        photoView,
        cv: view > 0 ? parseFloat(cv) : 0,
        cvLabel: view > 0 ? `${cv}%` : '—',
        ctr: view > 0 ? parseFloat(ctr) : 0,
        ctrLabel: view > 0 ? `${ctr}%` : '—',
      };
    });
  }, [listings, analytics]);

  const locationVisits = useMemo(() => {
    return Object.entries(byArea)
      .map(([slug, v]) => ({
        slug,
        label: areaLabel(slug),
        visits: v?.visits ?? 0,
        leads: v?.leads ?? 0,
      }))
      .sort((a, b) => b.visits - a.visits);
  }, [byArea]);

  const sortedRows = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      let va, vb;
      if (sortBy === 'listing') {
        va = (listingTitle(a) || '').toLowerCase();
        vb = (listingTitle(b) || '').toLowerCase();
        return dir * va.localeCompare(vb);
      }
      if (sortBy === 'unit_code') {
        va = (a.unit_code || '').toString().toLowerCase();
        vb = (b.unit_code || '').toString().toLowerCase();
        return dir * va.localeCompare(vb);
      }
      const key = sortBy === 'cta' ? 'ctaClicks' : sortBy === 'lead' ? 'lead' : sortBy === 'ctr' ? 'ctr' : sortBy === 'cv' ? 'cv' : sortBy;
      va = a[key];
      vb = b[key];
      return dir * (Number(va) - Number(vb));
    });
  }, [rows, sortBy, sortDir]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else setSortBy(key);
  };

  const totalLeads = rows.reduce((s, r) => s + r.lead, 0);
  const totalCtaClicks = rows.reduce((s, r) => s + r.ctaClicks, 0);
  const totalWhatsApp = rows.reduce((s, r) => s + r.ctaWhatsApp, 0);
  const totalCall = rows.reduce((s, r) => s + r.ctaCall, 0);
  const totalPhotos = rows.reduce((s, r) => s + r.photoView, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.view, 0);
  const overallCtr = totalImpressions > 0 ? ((totalCtaClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const cardsToConversion = totalLeads > 0 ? (totalImpressions / totalLeads).toFixed(1) : '—';
  const imagesPerCard = totalImpressions > 0 ? (totalPhotos / totalImpressions).toFixed(1) : '—';
  const imagesPerVisitor = uniqueVisits > 0 ? (totalPhotos / uniqueVisits).toFixed(1) : '—';

  if (loading && !Object.keys(analytics).length) {
    return (
      <div className="admin-page">
        <p className="admin-loading">Loading…</p>
      </div>
    );
  }

  const chartMax = Math.max(1, ...dailyData.map((d) => d.uniqueVisits));
  const chartHeight = 120;
  const chartWidth = Math.max(400, dailyData.length * 48);

  return (
    <div className="admin-page admin-dashboard">
      <div className="admin-dashboard-head">
        <div className="admin-dashboard-title-row">
          <h1 className="admin-page-title">Website metrics</h1>
          <span className="admin-dashboard-date-label">{rangeLabel}</span>
          <div className="admin-dashboard-live">
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-secondary"
              onClick={fetchAnalytics}
              disabled={refreshing}
              title="Refresh data now"
            >
              {refreshing ? 'Refreshing…' : '↻ Refresh'}
            </button>
            {lastUpdated && (
              <span className="admin-dashboard-last-updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {analyticsError && (
          <div className="admin-dashboard-banner admin-dashboard-banner-error">
            Analytics error: {analyticsError}
          </div>
        )}
        <div className="admin-dashboard-time">
          <span className="admin-dashboard-time-label">Time range:</span>
          <div className="admin-dashboard-time-btns" role="group" aria-label="Time range">
            {TIME_RANGES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`admin-btn admin-btn-sm ${timeRange === value ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setTimeRange(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {timeRange === 'custom' && (
            <div className="admin-dashboard-custom-range">
              <label>
                <span className="admin-dashboard-time-label">From</span>
                <input
                  type="date"
                  className="admin-input"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </label>
              <label>
                <span className="admin-dashboard-time-label">To</span>
                <input
                  type="date"
                  className="admin-input"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="admin-stats admin-stats--ga">
        <div className="admin-stat-card">
          <span className="admin-stat-value">{uniqueVisits}</span>
          <span className="admin-stat-label">Website visitors</span>
          <span className="admin-stat-hint">Unique sessions</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{totalCtaClicks}</span>
          <span className="admin-stat-label">CTA clicks</span>
          <span className="admin-stat-hint admin-stat-breakdown">{totalWhatsApp} WhatsApp · {totalCall} Call</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{cardsToConversion}</span>
          <span className="admin-stat-label">Cards to conversion</span>
          <span className="admin-stat-hint">Avg cards seen per lead</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{imagesPerVisitor}</span>
          <span className="admin-stat-label">Images per visitor</span>
          <span className="admin-stat-hint">Avg gallery views per session ({imagesPerCard} per card)</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{overallCtr}%</span>
          <span className="admin-stat-label">CTR</span>
          <span className="admin-stat-hint">CTA clicks / card views</span>
        </div>
      </div>

      {dailyData.length > 0 && (
        <section className="admin-dashboard-chart">
          <h2 className="admin-dashboard-section-title">Visits over time</h2>
          <div className="admin-chart-wrap">
            <svg className="admin-chart" viewBox={`0 0 ${chartWidth} ${chartHeight + 36}`} preserveAspectRatio="xMidYMid meet">
              {dailyData.map((d, i) => {
                const pad = 24;
                const innerW = chartWidth - pad * 2;
                const x = pad + (dailyData.length > 1 ? (i / (dailyData.length - 1)) * innerW : innerW / 2);
                const y = 10 + chartHeight - (d.uniqueVisits / chartMax) * chartHeight;
                const prevX = i > 0 ? pad + ((i - 1) / (dailyData.length - 1)) * innerW : x;
                const prevY = i > 0 ? 10 + chartHeight - (dailyData[i - 1].uniqueVisits / chartMax) * chartHeight : y;
                return (
                  <g key={d.day}>
                    {i > 0 && (
                      <line x1={prevX} y1={prevY} x2={x} y2={y} stroke="var(--admin-gold)" strokeWidth="2" fill="none" />
                    )}
                    <circle cx={x} cy={y} r="4" fill="var(--admin-gold)" />
                  </g>
                );
              })}
            </svg>
            <div className="admin-chart-labels">
              {dailyData.map((d) => (
                <span key={d.day} className="admin-chart-label">
                  {new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="admin-dashboard-locations">
        <h2 className="admin-dashboard-section-title">Location visits</h2>
        <div className="admin-location-cards">
          {locationVisits.map((loc) => (
            <div key={loc.slug} className="admin-location-card">
              <span className="admin-location-card-label">{loc.label}</span>
              <span className="admin-location-card-value">{loc.visits}</span>
              <span className="admin-location-card-hint">visits · {loc.leads} leads</span>
            </div>
          ))}
          {locationVisits.length === 0 && (
            <span className="admin-location-card-empty">No location data in range</span>
          )}
        </div>
      </section>

      <section className="admin-dashboard-sheet">
        <h2 className="admin-dashboard-section-title">Card performance (Impr. = card views, CTR = CTA/views, CV = leads/views)</h2>
        <div className="admin-sheet-wrap">
          <table className="admin-sheet-table" role="grid">
            <thead>
              <tr>
                <th className="admin-sheet-th admin-sheet-th--num">#</th>
                <th
                  className={`admin-sheet-th admin-sheet-th--unit ${sortBy === 'unit_code' ? `admin-sheet-th--sort-${sortDir}` : ''}`}
                  onClick={() => handleSort('unit_code')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('unit_code')}
                >
                  Unit <span className="admin-sheet-sort-icon">{sortBy === 'unit_code' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th
                  className={`admin-sheet-th admin-sheet-th--listing ${sortBy === 'listing' ? `admin-sheet-th--sort-${sortDir}` : ''}`}
                  onClick={() => handleSort('listing')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('listing')}
                >
                  Listing <span className="admin-sheet-sort-icon">{sortBy === 'listing' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th
                  className={`admin-sheet-th admin-sheet-th--num ${sortBy === 'view' ? `admin-sheet-th--sort-${sortDir}` : ''}`}
                  onClick={() => handleSort('view')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('view')}
                >
                  Card views <span className="admin-sheet-sort-icon">{sortBy === 'view' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th
                  className={`admin-sheet-th admin-sheet-th--num ${sortBy === 'lead' ? `admin-sheet-th--sort-${sortDir}` : ''}`}
                  onClick={() => handleSort('lead')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('lead')}
                >
                  Conversions <span className="admin-sheet-sort-icon">{sortBy === 'lead' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th
                  className={`admin-sheet-th admin-sheet-th--num ${sortBy === 'cta' ? `admin-sheet-th--sort-${sortDir}` : ''}`}
                  onClick={() => handleSort('cta')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('cta')}
                >
                  CTA Clicks <span className="admin-sheet-sort-icon">{sortBy === 'cta' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th
                  className={`admin-sheet-th admin-sheet-th--num ${sortBy === 'photo_view' ? `admin-sheet-th--sort-${sortDir}` : ''}`}
                  onClick={() => handleSort('photo_view')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('photo_view')}
                >
                  Image views <span className="admin-sheet-sort-icon">{sortBy === 'photo_view' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th
                  className={`admin-sheet-th admin-sheet-th--num ${sortBy === 'ctr' ? `admin-sheet-th--sort-${sortDir}` : ''}`}
                  onClick={() => handleSort('ctr')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('ctr')}
                >
                  CTR <span className="admin-sheet-sort-icon">{sortBy === 'ctr' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th
                  className={`admin-sheet-th admin-sheet-th--num ${sortBy === 'cv' ? `admin-sheet-th--sort-${sortDir}` : ''}`}
                  onClick={() => handleSort('cv')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('cv')}
                >
                  CV <span className="admin-sheet-sort-icon">{sortBy === 'cv' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => (
                <tr
                  key={row.id}
                  className="admin-sheet-tr"
                  onClick={() => setPopupUnit(row)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setPopupUnit(row)}
                >
                  <td className="admin-sheet-td admin-sheet-td--num">{index + 1}</td>
                  <td className="admin-sheet-td admin-sheet-td--unit">{row.unit_code || '—'}</td>
                  <td className="admin-sheet-td admin-sheet-td--listing">{listingTitle(row)}</td>
                  <td className="admin-sheet-td admin-sheet-td--num">{row.view}</td>
                  <td className="admin-sheet-td admin-sheet-td--num">{row.lead}</td>
                  <td className="admin-sheet-td admin-sheet-td--num">{row.ctaClicks}</td>
                  <td className="admin-sheet-td admin-sheet-td--num">{row.photoView}</td>
                  <td className="admin-sheet-td admin-sheet-td--num">{row.ctrLabel}</td>
                  <td className="admin-sheet-td admin-sheet-td--num">{row.cvLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {popupUnit && (
        <div
          className="admin-unit-popup-overlay"
          onClick={() => setPopupUnit(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-unit-popup-title"
        >
          <div className="admin-unit-popup" onClick={(e) => e.stopPropagation()}>
            <div className="admin-unit-popup-head">
              <h2 id="admin-unit-popup-title" className="admin-unit-popup-title">
                Unit {popupUnit.unit_code || popupUnit.id}
              </h2>
              <button
                type="button"
                className="admin-unit-popup-close"
                onClick={() => setPopupUnit(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="admin-unit-popup-body">
              {Array.isArray(popupUnit.images) && popupUnit.images.length > 0 && (
                <div className="admin-unit-popup-img">
                  <img src={typeof popupUnit.images[0] === 'string' ? popupUnit.images[0] : popupUnit.images[0]?.url} alt="" />
                </div>
              )}
              <dl className="admin-unit-popup-dl">
                <dt>Title (AR)</dt>
                <dd>{popupUnit.title_ar || '—'}</dd>
                <dt>Title (EN)</dt>
                <dd>{popupUnit.title_en || '—'}</dd>
                <dt>Developer</dt>
                <dd>{popupUnit.developer_ar || popupUnit.developer_en || '—'}</dd>
                <dt>Project</dt>
                <dd>{popupUnit.project_ar || popupUnit.project_en || '—'}</dd>
                {popupUnit.location && (
                  <>
                    <dt>Location</dt>
                    <dd>{popupUnit.location}</dd>
                  </>
                )}
                {(popupUnit.area != null || popupUnit.rooms != null || popupUnit.toilets != null) && (
                  <>
                    <dt>Specs</dt>
                    <dd>
                      {[popupUnit.area != null && `${popupUnit.area} m²`, popupUnit.rooms != null && `${popupUnit.rooms} beds`, popupUnit.toilets != null && `${popupUnit.toilets} bath`].filter(Boolean).join(' · ')}
                    </dd>
                  </>
                )}
                {(popupUnit.downpayment || popupUnit.price || popupUnit.monthly_inst) && (
                  <>
                    <dt>Pricing</dt>
                    <dd>
                      {[popupUnit.downpayment && `Pay now: ${formatNumberReadable(popupUnit.downpayment)}`, popupUnit.monthly_inst && `Monthly: ${formatNumberReadable(popupUnit.monthly_inst)}`, popupUnit.price && `Price: ${formatNumberReadable(popupUnit.price)}`].filter(Boolean).join(' · ')}
                    </dd>
                  </>
                )}
                {popupUnit.delivery && (
                  <>
                    <dt>Delivery</dt>
                    <dd>{popupUnit.delivery}</dd>
                  </>
                )}
                <dt>Performance (this period)</dt>
                <dd>Views {popupUnit.view} · Leads {popupUnit.lead} · CTA {popupUnit.ctaClicks} · Images {popupUnit.photoView} · CTR {popupUnit.ctrLabel} · CV {popupUnit.cvLabel}</dd>
              </dl>
            </div>
            <div className="admin-unit-popup-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setPopupUnit(null)}
              >
                Close
              </button>
              <Link
                to={`/admin/listings/${popupUnit.id}`}
                className="admin-btn admin-btn-primary"
                onClick={() => setPopupUnit(null)}
              >
                Edit unit
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="admin-quick-actions">
        <Link to="/admin/listings" className="admin-btn admin-btn-primary">
          Manage listings
        </Link>
      </div>
    </div>
  );
}
