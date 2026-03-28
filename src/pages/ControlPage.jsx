import { useState, useEffect } from 'react';
import { hasSupabase } from '../lib/supabase';
import {
  getControlSession,
  setControlSession,
  clearControlSession,
  controlListings,
  getAnalyticsByListing,
  upsertListing,
  deleteListing,
  setListingImages,
  uploadListingImage,
} from '../lib/listingsApi';
import { translateArToEn } from '../lib/translate';

const AREA_SLUGS = [{ value: 'new-capital', label: 'New Capital' }, { value: 'new-cairo', label: 'New Cairo' }, { value: 'mostakbal-city', label: 'Mostakbal City' }];

export default function ControlPage() {
  const [authenticated, setAuthenticated] = useState(getControlSession());
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [listings, setListings] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);

  useEffect(() => {
    if (!authenticated || !hasSupabase()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [listRes, analyticsRes] = await Promise.all([controlListings(), getAnalyticsByListing()]);
      if (!cancelled) {
        setListings(listRes.data || []);
        setAnalytics(analyticsRes.data || {});
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [authenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (setControlSession(password)) {
      setAuthenticated(true);
      setPassword('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const handleLogout = () => {
    clearControlSession();
    setAuthenticated(false);
    setEditing(null);
  };

  const handleTranslateTitle = async () => {
    if (!editing?.title_ar) return;
    setTranslateLoading(true);
    const en = await translateArToEn(editing.title_ar);
    setEditing((prev) => (prev ? { ...prev, title_en: en || prev.title_en } : null));
    setTranslateLoading(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const row = {
      id: editing.id,
      unit_code: editing.unit_code,
      title_ar: editing.title_ar || null,
      title_en: editing.title_en || null,
      developer_ar: editing.developer_ar || null,
      developer_en: editing.developer_en || null,
      project_ar: editing.project_ar || null,
      project_en: editing.project_en || null,
      location: editing.location || null,
      unit_type: editing.unit_type || 'Apartment',
      area: editing.area ? Number(editing.area) : null,
      rooms: editing.rooms ? Number(editing.rooms) : null,
      toilets: editing.toilets ? Number(editing.toilets) : null,
      downpayment: editing.downpayment || null,
      monthly_inst: editing.monthly_inst || null,
      price: editing.price || null,
      finishing: editing.finishing || null,
      delivery: editing.delivery || null,
      featured: !!editing.featured,
      area_slug: editing.area_slug || 'new-capital',
      sort_order: editing.sort_order ?? 0,
    };
    const { data, error } = await upsertListing(row);
    setSaving(false);
    if (error) {
      alert(error.message || 'Save failed');
      return;
    }
    const urls = (editing.images || []).map((i) => (typeof i === 'string' ? i : i.url)).filter(Boolean);
    await setListingImages(data.id, urls);
    setListings((prev) => {
      const idx = prev.findIndex((l) => l.id === data.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = { ...data, images: editing.images };
      else next.push({ ...data, images: editing.images });
      return next;
    });
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing?')) return;
    const { error } = await deleteListing(id);
    if (error) {
      alert(error.message || 'Delete failed');
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== id));
    setEditing((e) => (e?.id === id ? null : e));
  };

  const handleImageUpload = async (file, listingId) => {
    const { url, error } = await uploadListingImage(file, listingId);
    if (error || !url) {
      alert(error?.message || 'Upload failed. Ensure bucket "listing-images" exists and is public.');
      return;
    }
    setEditing((prev) => {
      if (!prev) return null;
      const images = [...(prev.images || []).map((i) => (typeof i === 'string' ? i : i.url)), url];
      return { ...prev, images };
    });
  };

  if (!authenticated) {
    return (
      <div className="control-page control-login">
        <div className="control-login-box">
          <h1>Arabian Estate Control</h1>
          <p>Enter password to manage listings.</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="control-input"
            />
            <button type="submit" className="btn-primary">Login</button>
            {loginError && <p className="control-error">{loginError}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="control-page">
      <div className="control-header">
        <h1>Arabian Estate Control</h1>
        <button type="button" className="btn-secondary" onClick={handleLogout}>Logout</button>
      </div>

      {!hasSupabase() && (
        <div className="control-alert">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and run the SQL migration in Supabase.
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="control-toolbar">
            <button type="button" className="btn-primary" onClick={() => setEditing({
              unit_code: '',
              title_ar: '',
              title_en: '',
              developer_ar: '',
              developer_en: '',
              project_ar: '',
              project_en: '',
              location: '',
              unit_type: 'Apartment',
              area: '',
              rooms: '',
              toilets: '',
              downpayment: '',
              monthly_inst: '',
              price: '',
              finishing: '',
              delivery: '',
              featured: false,
              area_slug: 'new-capital',
              sort_order: listings.length,
              images: [],
            })}>
              Add listing
            </button>
          </div>

          <div className="control-table-wrap">
            <table className="control-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title (AR / EN)</th>
                  <th>Project</th>
                  <th>Developer</th>
                  <th>Area</th>
                  <th>Visibility</th>
                  <th>CTA (WA / Call)</th>
                  <th>Photos viewed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => {
                  const a = analytics[l.id] || {};
                  return (
                    <tr key={l.id}>
                      <td>{l.id}</td>
                      <td>
                        <div className="control-cell-title">{l.title_ar || '—'}</div>
                        <div className="control-cell-sub">{l.title_en || '—'}</div>
                      </td>
                      <td>{l.project_ar || l.project_en || '—'}</td>
                      <td>{l.developer_ar || l.developer_en || '—'}</td>
                      <td>{l.area_slug}</td>
                      <td>{a.view ?? 0}</td>
                      <td>{a.cta_whatsapp ?? 0} / {a.cta_call ?? 0}</td>
                      <td>{a.photo_view ?? 0}</td>
                      <td>
                        <button type="button" className="control-btn-sm" onClick={() => setEditing({ ...l, images: l.images?.map((i) => ({ url: typeof i === 'string' ? i : i.url })) || [] })}>Edit</button>
                        <button type="button" className="control-btn-sm control-btn-danger" onClick={() => handleDelete(l.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {editing && (
            <div className="control-modal">
              <div className="control-modal-inner">
                <h2>{editing.id ? 'Edit listing' : 'New listing'}</h2>
                <div className="control-form">
                  <div className="control-form-row">
                    <label>Title (Arabic) *</label>
                    <input className="control-input" value={editing.title_ar || ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} placeholder="العنوان بالعربية" />
                  </div>
                  <div className="control-form-row">
                    <label>Title (English)</label>
                    <div className="control-input-group">
                      <input className="control-input" value={editing.title_en || ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} placeholder="Title in English" />
                      <button type="button" className="btn-secondary" onClick={handleTranslateTitle} disabled={!editing.title_ar || translateLoading}>
                        {translateLoading ? 'Translating…' : 'Translate from Arabic'}
                      </button>
                    </div>
                  </div>
                  <div className="control-form-row two-cols">
                    <div>
                      <label>Developer (AR)</label>
                      <input className="control-input" value={editing.developer_ar || ''} onChange={(e) => setEditing({ ...editing, developer_ar: e.target.value })} />
                    </div>
                    <div>
                      <label>Developer (EN)</label>
                      <input className="control-input" value={editing.developer_en || ''} onChange={(e) => setEditing({ ...editing, developer_en: e.target.value })} />
                    </div>
                  </div>
                  <div className="control-form-row two-cols">
                    <div>
                      <label>Project (AR)</label>
                      <input className="control-input" value={editing.project_ar || ''} onChange={(e) => setEditing({ ...editing, project_ar: e.target.value })} />
                    </div>
                    <div>
                      <label>Project (EN)</label>
                      <input className="control-input" value={editing.project_en || ''} onChange={(e) => setEditing({ ...editing, project_en: e.target.value })} />
                    </div>
                  </div>
                  <div className="control-form-row two-cols">
                    <div>
                      <label>Location</label>
                      <input className="control-input" value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
                    </div>
                    <div>
                      <label>Area</label>
                      <select className="control-input" value={editing.area_slug || 'new-capital'} onChange={(e) => setEditing({ ...editing, area_slug: e.target.value })}>
                        {AREA_SLUGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="control-form-row two-cols">
                    <div><label>Area (m²)</label><input type="number" className="control-input" value={editing.area ?? ''} onChange={(e) => setEditing({ ...editing, area: e.target.value ? Number(e.target.value) : null })} /></div>
                    <div><label>Rooms</label><input type="number" className="control-input" value={editing.rooms ?? ''} onChange={(e) => setEditing({ ...editing, rooms: e.target.value ? Number(e.target.value) : null })} /></div>
                    <div><label>Toilets</label><input type="number" className="control-input" value={editing.toilets ?? ''} onChange={(e) => setEditing({ ...editing, toilets: e.target.value ? Number(e.target.value) : null })} /></div>
                  </div>
                  <div className="control-form-row two-cols">
                    <div><label>Pay now</label><input className="control-input" value={editing.downpayment || ''} onChange={(e) => setEditing({ ...editing, downpayment: e.target.value })} /></div>
                    <div><label>Monthly</label><input className="control-input" value={editing.monthly_inst || ''} onChange={(e) => setEditing({ ...editing, monthly_inst: e.target.value })} /></div>
                    <div><label>Price</label><input className="control-input" value={editing.price || ''} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
                  </div>
                  <div className="control-form-row two-cols">
                    <div><label>Finishing</label><input className="control-input" value={editing.finishing || ''} onChange={(e) => setEditing({ ...editing, finishing: e.target.value })} /></div>
                    <div><label>Delivery</label><input className="control-input" value={editing.delivery || ''} onChange={(e) => setEditing({ ...editing, delivery: e.target.value })} /></div>
                  </div>
                  <div className="control-form-row">
                    <label><input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Featured</label>
                  </div>
                  <div className="control-form-row">
                    <label>Images</label>
                    <div className="control-images">
                      {(editing.images || []).map((img, i) => (
                        <div key={i} className="control-image-item">
                          <img src={typeof img === 'string' ? img : img.url} alt="" />
                          <button type="button" className="control-btn-sm" onClick={() => setEditing({ ...editing, images: editing.images.filter((_, j) => j !== i) })}>Remove</button>
                        </div>
                      ))}
                      {editing.id && (
                        <label className="control-upload">
                          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, editing.id); e.target.value = ''; }} />
                          + Upload
                        </label>
                      )}
                      {!editing.id && <p className="control-hint">Save the listing first to upload images.</p>}
                    </div>
                  </div>
                </div>
                <div className="control-modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                  <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
