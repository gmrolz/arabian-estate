import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  controlListings,
  upsertListing,
  setListingImages,
  appendListingImages,
  uploadListingImage,
  uploadMultipleImages,
  deleteListing,
} from '../../lib/listingsApi';
import { translateArToEn } from '../../lib/translate';
import { useListings } from '../../context/ListingsContext';
import { useAdminToast } from '../../context/AdminToastContext';
import { useSite } from '../../context/SiteContext';
import { CAIRO_AREAS, EGYPT_REGIONS } from '../../data/newCapitalListings';
import { formatNumberReadable } from '../../lib/format';
import { ListingPreviewCard } from '../../components/ListingPreviewCard';
import { CascadingLocationSelector } from '../../components/CascadingLocationSelector';
import '../../styles/listing-preview.css';
import { useState as useStateHook } from 'react';

// NOTE: LocationSelector component now handles location selection
// The old REGIONS and CAIRO_SUB_AREAS are kept for backward compatibility
// but will be phased out in favor of the new location system

const REGIONS = [
  { value: 'cairo', label: 'Cairo' },
  ...EGYPT_REGIONS.filter((r) => r.slug !== 'cairo').map((r) => ({ value: r.slug, label: r.label })),
];

const CAIRO_SUB_AREAS = CAIRO_AREAS;

const FINISHING_OPTIONS = [
  { value: '', label: '—' },
  { value: 'Fully Finished', label: 'Fully Finished' },
  { value: 'Semi Finished', label: 'Semi Finished' },
  { value: 'Core and Shell', label: 'Core and Shell' },
];

const DELIVERY_OPTIONS = [
  { value: '', label: '—' },
  { value: 'Ready to Move', label: 'Ready to Move' },
  { value: '6 Months', label: '6 Months' },
  { value: '1 Year', label: '1 Year' },
  { value: '1.5 Years', label: '1.5 Years' },
  { value: '2 Years', label: '2 Years' },
  { value: '2.5 Years', label: '2.5 Years' },
  { value: '3 Years', label: '3 Years' },
  { value: '3.5 Years', label: '3.5 Years' },
  { value: '4 Years', label: '4 Years' },
  { value: '4.5 Years', label: '4.5 Years' },
  { value: '5 Years', label: '5 Years' },
];

function getRegionFromAreaSlug(areaSlug) {
  if (!areaSlug) return 'cairo';
  if (areaSlug === 'new-capital' || areaSlug === 'new-cairo' || areaSlug === 'mostakbal-city') return 'cairo';
  return areaSlug;
}

function parseNum(s) {
  if (s == null || s === '') return NaN;
  const n = parseInt(String(s).replace(/,/g, ''), 10);
  return isNaN(n) ? NaN : n;
}

const DOWN_PCT_OPTIONS = [0, 1.5, 5, 10, 15, 20, 25, 30];
const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];

function calculatePaymentPlan(price, downPct, paymentAfter3mPct, years, equalInstallments) {
  const priceNum = parseNum(price);
  if (isNaN(priceNum) || priceNum <= 0) return null;
  if (years === 0) {
    return { payNow: priceNum, monthly: 0, annual: 0, years: 0, downPct: null };
  }
  const payNow = Math.round((priceNum * downPct) / 100);
  let remainder = priceNum - payNow;
  const after3mAmount = Math.round((priceNum * (paymentAfter3mPct || 0)) / 100);
  if (after3mAmount > 0) remainder -= after3mAmount;
  if (remainder <= 0) return null;
  const monthly = equalInstallments ? Math.round(remainder / (years * 12)) : null;
  const annual = equalInstallments ? Math.round(remainder / years) : null;
  return { payNow, monthly, annual, years, downPct };
}

function getUrl(img) {
  return typeof img === 'string' ? img : img?.url ?? '';
}

export default function AdminListingEdit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { refetchListings } = useListings();
  const { showToast } = useAdminToast();
  const { siteId } = useSite();
  const isNew = id === 'new' || location.pathname.endsWith('/listings/new');

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [pricingMode, setPricingMode] = useState('manual');
  const [planDownPct, setPlanDownPct] = useState(0);
  const [planAfter3mPct, setPlanAfter3mPct] = useState(0);
  const [planYears, setPlanYears] = useState(0);
  const [planEqual, setPlanEqual] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    controlListings(siteId).then((res) => {
      if (!cancelled) setListings(res.data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [siteId]);

  useEffect(() => {
    if (loading) return;
    if (isNew) {
      setForm({
        unit_code: '',
        title_ar: '',
        title_en: '',
        developer_ar: '',
        developer_en: '',
        project_ar: '',
        project_en: '',
        location: '',
        locationId: null,
        compound_name: '',
        maps_url: '',
        unit_type: 'Apartment',
        area: '',
        rooms: '',
        toilets: '',
        downpayment: '',
        monthly_inst: '',
        price: '',
        payment_years: null,
        payment_down_pct: null,
        finishing: '',
        delivery: '',
        featured: false,
        area_slug: 'new-capital',
        sort_order: listings.length,
        images: [],
        show_price: true,
        show_downpayment: true,
        show_monthly: true,
        show_full_price: false,
        show_annual: false,
      });
      return;
    }
    const lid = Number(id);
    const listing = listings.find((l) => l.id === lid);
    if (!listing) {
      setForm(null);
      return;
    }
    const images = (listing.images || []).map((img) => ({ url: getUrl(img), sort_order: img.sort_order ?? 0 }));
    images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const formatted = {
      ...listing,
      images: images.map((i) => i.url),
      price: listing.price && !String(listing.price).includes('%') ? formatNumberReadable(String(listing.price)) : listing.price,
      downpayment: listing.downpayment && !String(listing.downpayment).includes('%') ? formatNumberReadable(String(listing.downpayment)) : listing.downpayment,
      monthly_inst: listing.monthly_inst ? formatNumberReadable(String(listing.monthly_inst)) : listing.monthly_inst,
    };
    setForm(formatted);
  }, [loading, isNew, id, listings]);

  const handleTranslate = async () => {
    if (!form?.title_ar) return;
    setTranslateLoading(true);
    const en = await translateArToEn(form.title_ar);
    setForm((prev) => (prev ? { ...prev, title_en: en || prev.title_en } : null));
    setTranslateLoading(false);
  };

  const moveImage = (index, direction) => {
    if (!form?.images?.length) return;
    const next = [...form.images];
    const j = index + direction;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setForm((prev) => (prev ? { ...prev, images: next } : null));
  };

  const removeImage = (index) => {
    setForm((prev) => (prev ? { ...prev, images: prev.images.filter((_, i) => i !== index) } : null));
  };

  const buildListingRow = () => ({
    id: form?.id,
    unit_code: form?.unit_code || null,
    title_ar: form?.title_ar || null,
    title_en: form?.title_en || null,
    developer_ar: form?.developer_ar || null,
    developer_en: form?.developer_en || null,
    project_ar: form?.project_ar || null,
    project_en: form?.project_en || null,
    location: form?.location || null,
    locationId: form?.locationId || null,
    compound_name: form?.compound_name || null,
    maps_url: form?.maps_url || '',
    unit_type: form?.unit_type || 'Apartment',
    area: form?.area ? Number(form.area) : null,
    rooms: form?.rooms ? Number(form.rooms) : null,
    toilets: form?.toilets ? Number(form.toilets) : null,
    downpayment: form?.downpayment || null,
    monthly_inst: form?.monthly_inst || null,
    price: form?.price || null,
    payment_years: form?.payment_years ?? null,
    payment_down_pct: form?.payment_down_pct ?? null,
    finishing: form?.finishing || null,
    delivery: form?.delivery || null,
    featured: !!form?.featured,
    area_slug: form?.area_slug || 'new-capital',
    sort_order: form?.sort_order ?? 0,
  });

    const handleImageUpload = async (files) => {
    let listingId = form?.id;
    if (!listingId) {
      // Auto-save the listing first to get an ID
      if (!form?.title_ar) {
        showToast('Please fill in at least the Arabic Title before uploading images.', 'error');
        return;
      }
      showToast('Saving listing first...', 'info');
      const row = buildListingRow();
      const { data, error } = await upsertListing(row);
      if (error || !data?.id) {
        showToast(error?.message || 'Failed to save listing', 'error');
        return;
      }
      listingId = data.id;
      // Update form with the new ID
      setForm((prev) => (prev ? { ...prev, id: listingId } : null));
    }
    if (!files || files.length === 0) return;
    
    setUploadLoading(true);
    
    // Upload all files in one request to the bulk endpoint
    const { urls, errors } = await uploadMultipleImages(files, listingId);
    
    setUploadLoading(false);
    
    if (urls.length > 0) {
      // Persist all uploaded URLs to DB in one call (appends to existing)
      try {
        const { error } = await appendListingImages(listingId, urls);
        if (error) {
          showToast(`${urls.length} image(s) uploaded but failed to save to database: ${error.message}`, 'warning');
        } else {
          showToast(`${urls.length} image(s) uploaded successfully.`, 'success');
          // Update form with new images after successful persistence
          setForm((prev) => {
            if (!prev) return null;
            const newImages = [...(prev.images || []), ...urls];
            return { ...prev, images: newImages };
          });
        }
      } catch (err) {
        console.error('Failed to persist images:', err);
        showToast(`${urls.length} image(s) uploaded but failed to save to database: ${err.message}`, 'warning');
      }
    }
    
    if (errors.length > 0) {
      showToast(`Failed to upload ${errors.length} file(s): ${errors.join('; ')}`, 'error');
    }
  };

  const handleImageUrlUpload = async (imageUrl) => {
    let listingId = form?.id;
    if (!listingId) {
      // Auto-save the listing first to get an ID
      if (!form?.title_ar) {
        showToast('Please fill in at least the Arabic Title before uploading images.', 'error');
        return;
      }
      showToast('Saving listing first...', 'info');
      const row = buildListingRow();
      const { data, error } = await upsertListing(row);
      if (error || !data?.id) {
        showToast(error?.message || 'Failed to save listing', 'error');
        return;
      }
      listingId = data.id;
      // Update form with the new ID
      setForm((prev) => (prev ? { ...prev, id: listingId } : null));
    }
    if (!imageUrl || !imageUrl.trim()) return;
    
    setUploadLoading(true);
    try {
      const response = await fetch('/api/listings/upload-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageUrl.trim(), listingId }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.url) {
        showToast(`Failed to upload image: ${data.error || 'Unknown error'}`, 'error');
      } else {

        
        // Persist image to DB immediately (appends to existing)
        try {
          const { error } = await appendListingImages(listingId, [data.url]);
          if (error) {
            showToast(`Image uploaded but failed to save to database: ${error.message}`, 'warning');
          } else {
            showToast('Image uploaded from URL successfully.', 'success');
            // Update form with new image after successful persistence
            setForm((prev) => {
              if (!prev) return null;
              const newImages = [...(prev.images || []), data.url];
              return { ...prev, images: newImages };
            });
          }
        } catch (err) {
          console.error('Failed to persist image:', err);
          showToast(`Image uploaded but failed to save to database: ${err.message}`, 'warning');
        }
        
        // Clear the input
        const input = document.getElementById('admin-add-image-url');
        if (input) input.value = '';
      }
    } catch (err) {
      showToast(`Error uploading image: ${err.message}`, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    const row = {
      id: form.id,
      site_id: form.site_id ?? siteId,
      unit_code: form.unit_code,
      title_ar: form.title_ar || null,
      title_en: form.title_en || null,
      developer_ar: form.developer_ar || null,
      developer_en: form.developer_en || null,
      project_ar: form.project_ar || null,
      project_en: form.project_en || null,
      location: form.location || null,
      location_id: form.locationId || null,
      compound_name: form.compound_name || '',
      unit_type: form.unit_type || 'Apartment',
      area: form.area ? Number(form.area) : null,
      rooms: form.rooms ? Number(form.rooms) : null,
      toilets: form.toilets ? Number(form.toilets) : null,
      downpayment: form.downpayment || null,
      monthly_inst: form.monthly_inst || null,
      price: form.price || null,
      payment_years: form.payment_years ?? null,
      payment_down_pct: form.payment_down_pct ?? null,
      finishing: form.finishing || null,
      delivery: form.delivery || null,
      featured: !!form.featured,
      area_slug: form.area_slug || 'new-capital',
      maps_url: form.maps_url || '',
      sort_order: form.sort_order ?? 0,
    };
    const { data, error } = await upsertListing(row);
    setSaving(false);
    if (error) {
      showToast(error.message || 'Save failed', 'error');
      return;
    }
    if (data?.id != null) {
      // Images are now saved atomically with upsertListing, no separate call needed
      setListings((prev) => {
        const idx = prev.findIndex((l) => l.id === data.id);
        const next = [...prev];
        const updated = { ...data, images: (form.images || []).map((url) => ({ url, sort_order: 0 })) };
        if (idx >= 0) next[idx] = updated;
        else next.push(updated);
        return next;
      });
      refetchListings?.();
      navigate(`/admin/listings/${data.id}`);
      showToast(isNew ? 'Listing added' : 'Listing saved', 'success');
    }
  };

  const handleDelete = async () => {
    if (!form?.id || !confirm('Are you sure you want to delete it?')) return;
    const { error } = await deleteListing(form.id);
    if (error) {
      showToast(error?.message || 'Delete failed', 'error');
      return;
    }
    showToast('Listing deleted', 'success');
    navigate('/admin/listings');
  };

  if (loading || !form) {
    const message = loading || isNew ? 'Loading…' : 'Listing not found.';
    return (
      <div className="admin-page">
        <p className="admin-loading">{message}</p>
      </div>
    );
  }

  return (
    <>
    <div className="admin-edit-with-preview">
      <div className="admin-edit-main">
      <div className="admin-page admin-edit">
      <div className="admin-edit-header">
        <Link to="/admin/listings" className="admin-back">← Listings</Link>
        <h1 className="admin-page-title">{isNew ? 'New listing' : 'Edit listing'}</h1>
      </div>

      <div className="admin-form">
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Title</h2>
          <div className="admin-form-row">
            <label>Title (Arabic) *</label>
            <input
              className="admin-input"
              value={form.title_ar || ''}
              onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
              placeholder="العنوان بالعربية"
            />
          </div>
          <div className="admin-form-row">
            <label>Title (English)</label>
            <div className="admin-input-group">
              <input
                className="admin-input"
                value={form.title_en || ''}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                placeholder="Title in English"
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={handleTranslate}
                disabled={!form.title_ar || translateLoading}
              >
                {translateLoading ? '…' : 'Translate from Arabic'}
              </button>
            </div>
          </div>
        </section>

        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Developer</h2>
          <div className="admin-form-row two-cols">
            <div>
              <label>Developer (AR)</label>
              <input
                className="admin-input"
                value={form.developer_ar || ''}
                onChange={(e) => setForm({ ...form, developer_ar: e.target.value })}
              />
            </div>
            <div>
              <label>Developer (EN)</label>
              <input
                className="admin-input"
                value={form.developer_en || ''}
                onChange={(e) => setForm({ ...form, developer_en: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Location & Details</h2>
          <div className="admin-form-row two-cols">
            <div>
              <label>Display order (position on page)</label>
              <input
                type="number"
                min={1}
                className="admin-input"
                value={form.sort_order != null && form.sort_order !== '' ? Number(form.sort_order) + 1 : (listings.length + 1)}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  const oneBased = v === '' ? listings.length + 1 : Math.max(1, parseInt(v, 10));
                  setForm({ ...form, sort_order: oneBased - 1 });
                }}
                title="1 = first on page, 2 = second, etc. Same as order in Listings page."
              />
              <span className="admin-form-hint-inline">1 = first, 2 = second, etc.</span>
            </div>
            <div />
          </div>
          <div className="admin-form-row">
            <CascadingLocationSelector
              locationId={form.locationId || null}
              compound={form.compound_name || ''}
              onChange={({ locationId, compound, locationLabel }) =>
                setForm(prev => ({
                  ...prev,
                  locationId,
                  compound_name: compound,
                  location: locationLabel || prev.location || '',
                  // Keep area_slug in sync for backwards compatibility
                  area_slug: prev.area_slug || 'new-capital',
                }))
              }
            />
          </div>
          <div className="admin-form-row">
            <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>
              🗺️ Google Maps URL
              <span style={{ fontWeight: 400, fontSize: 12, color: '#718096', marginLeft: 8 }}>Paste a Google Maps share link — shows as an in-site popup</span>
            </label>
            <input
              type="url"
              className="admin-input"
              value={form.maps_url || ''}
              onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
              placeholder="https://maps.google.com/maps?q=..."
              style={{ width: '100%' }}
            />
          </div>
          <div className="admin-form-row grid-cols">
            <div><label>Area (m²)</label><input type="number" className="admin-input" value={form.area ?? ''} onChange={(e) => setForm({ ...form, area: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><label>Rooms</label><input type="number" className="admin-input" value={form.rooms ?? ''} onChange={(e) => setForm({ ...form, rooms: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><label>Toilets</label><input type="number" className="admin-input" value={form.toilets ?? ''} onChange={(e) => setForm({ ...form, toilets: e.target.value ? Number(e.target.value) : null })} /></div>
          </div>
          <section className="admin-form-section admin-form-section-pricing">
          <h2 className="admin-form-section-title">Pricing</h2>
          <div className="admin-form-row admin-form-row-with-checkbox">
            <div className="admin-form-input-group">
              <label>Full Price (total) EGP</label>
              <input
                className="admin-input"
                value={form.price || ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
                  setForm({ ...form, price: raw === '' ? '' : formatNumberReadable(raw) });
                }}
                placeholder="e.g. 5,000,000"
              />
            </div>
            <label className="admin-checkbox-inline">
              <input
                type="checkbox"
                checked={form.show_full_price === true}
                onChange={(e) => setForm({ ...form, show_full_price: e.target.checked })}
              />
              <span>Show Full Price</span>
            </label>
          </div>
          <div className="admin-form-row">
            <span className="admin-form-label">How to set Pay now & Monthly</span>
            <div className="admin-form-radio-group">
              <label className="admin-radio">
                <input type="radio" name="pricingMode" checked={pricingMode === 'plan'} onChange={() => setPricingMode('plan')} />
                Calculate from payment plan
              </label>
              <label className="admin-radio">
                <input type="radio" name="pricingMode" checked={pricingMode === 'manual'} onChange={() => setPricingMode('manual')} />
                Enter Pay now & Monthly manually
              </label>
            </div>
          </div>
          {pricingMode === 'plan' && (
            <>
              <div className="admin-form-row">
                <label>Number of years</label>
                <select className="admin-input" value={planYears} onChange={(e) => setPlanYears(Number(e.target.value))}>
                  <option value={0}>Cash price (full payment)</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y} {y === 1 ? 'year' : 'years'}</option>
                  ))}
                </select>
              </div>
              {planYears > 0 && (
                <div className="admin-form-row two-cols">
                  <div>
                    <label>Down payment</label>
                    <select className="admin-input" value={planDownPct} onChange={(e) => setPlanDownPct(Number(e.target.value))}>
                      {DOWN_PCT_OPTIONS.map((pct) => (
                        <option key={pct} value={pct}>{pct}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Payment after 3 months</label>
                    <select className="admin-input" value={planAfter3mPct} onChange={(e) => setPlanAfter3mPct(Number(e.target.value))}>
                      {DOWN_PCT_OPTIONS.map((pct) => (
                        <option key={pct} value={pct}>{pct}%</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {planYears > 0 && (
                <div className="admin-form-row">
                  <label>Equal installments</label>
                  <select className="admin-input" value={planEqual ? 'yes' : 'no'} onChange={(e) => setPlanEqual(e.target.value === 'yes')}>
                    <option value="yes">Yes</option>
                    <option value="no">No (manual monthly)</option>
                  </select>
                </div>
              )}
              <div className="admin-form-row">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => {
                    const result = calculatePaymentPlan(form.price, planDownPct, planAfter3mPct, planYears, planEqual);
                    if (!result) {
                      showToast('Enter a valid Price.', 'error');
                      return;
                    }
                    setForm((prev) => prev ? {
                      ...prev,
                      downpayment: formatNumberReadable(String(result.payNow)),
                      monthly_inst: result.monthly != null ? formatNumberReadable(String(result.monthly)) : prev.monthly_inst,
                      annual_payment: result.annual != null ? formatNumberReadable(String(result.annual)) : prev.annual_payment,
                      payment_years: result.years,
                      payment_down_pct: result.downPct,
                    } : null);
                  }}
                >
                  Calculate Pay now, Monthly & Annual
                </button>
              </div>
            </>
          )}
          {pricingMode === 'manual' && (
            <>
            <div className="admin-form-row two-cols">
              <div className="admin-form-row-with-checkbox">
                <div className="admin-form-input-group">
                  <label>Pay now (EGP)</label>
                  <input
                    className="admin-input"
                    value={form.downpayment || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
                      setForm({ ...form, downpayment: raw === '' ? '' : formatNumberReadable(raw) });
                    }}
                    placeholder="e.g. 500,000"
                  />
                </div>
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={form.show_downpayment !== false}
                    onChange={(e) => setForm({ ...form, show_downpayment: e.target.checked })}
                  />
                  <span>Show</span>
                </label>
              </div>
              <div className="admin-form-row-with-checkbox">
                <div className="admin-form-input-group">
                  <label>Monthly (EGP)</label>
                  <input
                    className="admin-input"
                    value={form.monthly_inst || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
                      setForm({ ...form, monthly_inst: raw === '' ? '' : formatNumberReadable(raw) });
                    }}
                    placeholder="e.g. 50,000"
                  />
                </div>
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={form.show_monthly !== false}
                    onChange={(e) => setForm({ ...form, show_monthly: e.target.checked })}
                  />
                  <span>Show</span>
                </label>
              </div>
            </div>
            <div className="admin-form-row admin-form-row-with-checkbox">
              <div className="admin-form-input-group">
                <label>Annual Payment - دفعة سنويه (EGP)</label>
                <input
                  className="admin-input"
                  value={form.annual_payment || ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
                    setForm({ ...form, annual_payment: raw === '' ? '' : formatNumberReadable(raw) });
                  }}
                  placeholder="e.g. 600,000"
                />
              </div>
              <label className="admin-checkbox-inline">
                <input
                  type="checkbox"
                  checked={form.show_annual !== false}
                  onChange={(e) => setForm({ ...form, show_annual: e.target.checked })}
                />
                <span>Show</span>
              </label>
            </div>
            </>
          )}
          {(form.downpayment || form.monthly_inst) && (
            <div className="admin-form-row admin-pricing-summary">
              <span className="admin-form-label">Output</span>
              <div className="admin-pricing-output">
                <span>Pay now: EGP {formatNumberReadable(form.downpayment)}</span>
                <span>Monthly: EGP {formatNumberReadable(form.monthly_inst)}/mo</span>
                {form.annual_payment && <span>Annual: EGP {formatNumberReadable(form.annual_payment)}/year</span>}
                {(form.payment_years != null || form.payment_down_pct != null) && (
                  <span className="admin-pricing-plan">
                    {form.payment_down_pct != null && `${form.payment_down_pct}% down`}
                    {form.payment_down_pct != null && form.payment_years != null && ' · '}
                    {form.payment_years != null && `${form.payment_years} years`}
                  </span>
                )}
              </div>
            </div>
          )}
          {pricingMode === 'manual' && (
            <div className="admin-form-row two-cols">
              <div>
                <label>Years (for card display, optional)</label>
                <select
                  className="admin-input"
                  value={form.payment_years ?? ''}
                  onChange={(e) => setForm({ ...form, payment_years: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">—</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y} {y === 1 ? 'year' : 'years'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Down % (for card display, optional)</label>
                <select
                  className="admin-input"
                  value={form.payment_down_pct ?? ''}
                  onChange={(e) => setForm({ ...form, payment_down_pct: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">—</option>
                  {DOWN_PCT_OPTIONS.map((pct) => (
                    <option key={pct} value={pct}>{pct}%</option>
                  ))}
                </select>
              </div>
            </div>
          )}

        </section>
          <div className="admin-form-row two-cols">
            <div>
              <label>Finishing</label>
              <select
                className="admin-input"
                value={form.finishing || ''}
                onChange={(e) => setForm({ ...form, finishing: e.target.value })}
              >
                {FINISHING_OPTIONS.map((opt) => (
                  <option key={opt.value || 'blank'} value={opt.value}>{opt.label}</option>
                ))}
                {form.finishing && !FINISHING_OPTIONS.some((o) => o.value === form.finishing) && (
                  <option value={form.finishing}>{form.finishing}</option>
                )}
              </select>
            </div>
            <div>
              <label>Delivery</label>
              <select
                className="admin-input"
                value={form.delivery || ''}
                onChange={(e) => setForm({ ...form, delivery: e.target.value })}
              >
                {DELIVERY_OPTIONS.map((opt) => (
                  <option key={opt.value || 'blank'} value={opt.value}>{opt.label}</option>
                ))}
                {form.delivery && !DELIVERY_OPTIONS.some((o) => o.value === form.delivery) && (
                  <option value={form.delivery}>{form.delivery}</option>
                )}
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <label className="admin-checkbox">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Featured on home page
            </label>
          </div>
        </section>

        <section className="admin-form-section admin-form-section-images">
          <h2 className="admin-form-section-title">Images</h2>
          <p className="admin-form-hint">Reorder with ↑ ↓. First image is the main one. Add image URLs or upload from your computer. New listing: save first, then upload images.</p>
          <div className="admin-images-list">
            {(form.images || []).map((url, i) => (
              <div key={`${i}-${url?.slice(-20)}`} className="admin-image-item">
                <div className="admin-image-thumb">
                  <img src={url} alt="" />
                </div>
                <div className="admin-image-order">
                  <button type="button" className="admin-btn admin-btn-icon" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <span className="admin-image-num">{i + 1}</span>
                  <button type="button" className="admin-btn admin-btn-icon" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} aria-label="Move down">↓</button>
                </div>
                <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeImage(i)}>Remove</button>
              </div>
            ))}
            <div className="admin-image-url-row">
              <input
                type="url"
                className="admin-input"
                placeholder="https://… image URL"
                id="admin-add-image-url"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target;
                    const v = (input.value || '').trim();
                    if (v) {
                      handleImageUrlUpload(v);
                    }
                  }
                }}
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={uploadLoading}
                onClick={() => {
                  const input = document.getElementById('admin-add-image-url');
                  const v = (input?.value || '').trim();
                  if (v) {
                    handleImageUrlUpload(v);
                  }
                }}
              >
                {uploadLoading ? 'Uploading...' : 'Add URL'}
              </button>
            </div>
            <label className={`admin-image-upload ${uploadLoading ? 'admin-image-upload-loading' : ''}`}>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadLoading}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) handleImageUpload(files);
                  e.target.value = '';
                }}
              />
              <span>{uploadLoading ? 'Saving & uploading…' : '+ Upload from computer to Website Server'}</span>
            </label>
          </div>
          {!form.id && (
            <p className="admin-form-hint">Fill in at least the Arabic Title, then you can upload images directly. The listing will be saved automatically.</p>
          )}
        </section>

        <div className="admin-form-actions">
          <div className="admin-form-actions-left">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/listings')}>
              Cancel
            </button>
            {form.id && (
              <button type="button" className="admin-btn admin-btn-danger" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
      </div>
      
      {/* Desktop Preview Panel */}
      <div className="admin-edit-preview-panel">
        {form && <ListingPreviewCard listing={form} />}
      </div>
    </div>
    
    {/* Mobile Preview Button */}
    <button
      className="preview-toggle-btn"
      onClick={() => setPreviewDrawerOpen(true)}
      title="Preview"
    >
      👁️
    </button>
    
    {/* Mobile Preview Drawer */}
    <div className={`preview-drawer ${previewDrawerOpen ? 'open' : ''}`}>
      <div className="preview-drawer-header">
        <h2>Preview</h2>
        <button
          className="preview-drawer-close"
          onClick={() => setPreviewDrawerOpen(false)}
        >
          ✕
        </button>
      </div>
      <div className="preview-drawer-content">
        {form && <ListingPreviewCard listing={form} />}
      </div>
    </div>
    </>
  );
}
