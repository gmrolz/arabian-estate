/**
 * listingsApi.js — Rewritten to use the Manus tRPC backend.
 * All Supabase / VPS / Google Sheets code has been removed.
 * Function signatures remain the same so admin pages keep working.
 */

const API_BASE = '/api/trpc';

// ─── tRPC helpers ───

async function trpcQuery(path, input) {
  const url = new URL(`${API_BASE}/${path}`, window.location.origin);
  if (input !== undefined) {
    url.searchParams.set('input', JSON.stringify({ json: input }));
  }
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.result?.data?.json ?? data?.result?.data ?? data;
}

async function trpcMutation(path, input) {
  const url = `${API_BASE}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.result?.data?.json ?? data?.result?.data ?? data;
}

// ─── Control session (password-based admin auth) ───

const CONTROL_PASSWORDS = [
  import.meta.env.VITE_CONTROL_PASSWORD || 'arabianestate@tdm',
  '324511',
].filter(Boolean);
const CONTROL_KEY = 'arabian_control_session';

export function getControlSession() {
  try {
    const stored = sessionStorage.getItem(CONTROL_KEY);
    return stored && CONTROL_PASSWORDS.includes(stored);
  } catch {
    return false;
  }
}

export function setControlSession(password) {
  const ok = CONTROL_PASSWORDS.includes(password);
  if (ok) sessionStorage.setItem(CONTROL_KEY, password);
  else sessionStorage.removeItem(CONTROL_KEY);
  return ok;
}

export function clearControlSession() {
  sessionStorage.removeItem(CONTROL_KEY);
}

// ─── Frontend: fetch listings ───

export async function fetchListings(locale = 'en', _siteId = null) {
  try {
    const data = await trpcQuery('listings.list');
    if (!Array.isArray(data)) return { data: [], error: null };
    // Normalize to the shape the frontend expects
    const list = data.map((row) => normalizeRow(row, locale));
    return { data: list, error: null };
  } catch (err) {
    console.error('fetchListings error:', err);
    return { data: null, error: { message: err.message } };
  }
}

function normalizeRow(row, locale = 'en') {
  const title = locale === 'ar'
    ? (row.titleAr || row.title_ar || row.titleEn || row.title_en || '')
    : (row.titleEn || row.title_en || row.titleAr || row.title_ar || '');
  const developer = locale === 'ar'
    ? (row.developerAr || row.developer_ar || row.developerEn || row.developer_en || '')
    : (row.developerEn || row.developer_en || row.developerAr || row.developer_ar || '');
  const project = locale === 'ar'
    ? (row.projectAr || row.project_ar || row.projectEn || row.project_en || '')
    : (row.projectEn || row.project_en || row.projectAr || row.project_ar || '');

  let images = row.images ?? [];
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = []; }
  }

  return {
    id: row.id,
    unitCode: row.unitCode ?? row.unit_code ?? '',
    title,
    developer,
    project,
    location: row.location ?? '',
    unitType: row.unitType ?? row.unit_type ?? 'Apartment',
    area: row.area ?? 0,
    rooms: row.rooms ?? 0,
    toilets: row.toilets ?? 0,
    downpayment: row.downpayment ?? '',
    monthlyInst: row.monthlyInst ?? row.monthly_inst ?? '',
    price: row.price ?? '',
    finishing: row.finishing ?? '',
    delivery: row.delivery ?? '',
    featured: row.featured === 1 || row.featured === true,
    area_slug: row.areaSlug ?? row.area_slug ?? 'new-capital',
    images,
    sort_order: row.sortOrder ?? row.sort_order ?? 0,
  };
}

// ─── Analytics (stub — analytics not yet migrated to new DB) ───

const SESSION_ID_KEY = 'arabian_analytics_session';

function getOrCreateSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export async function trackEvent(listingId, eventType, payload = {}, _siteId = null) {
  // Analytics tracking — no-op for now until analytics table is created
  return;
}

export async function getAnalyticsByListing(_siteId = null) {
  return { data: {}, error: null };
}

export async function getAnalyticsByListingInRange(fromIso, toIso, _siteId = null) {
  return { data: {}, uniqueVisits: 0, byArea: {}, error: null };
}

export async function getAnalyticsDaily(fromIso, toIso, _siteId = null) {
  return { data: [], error: null };
}

// ─── Control panel: list listings (raw for edit) ───

export async function controlListings(_siteId = null) {
  try {
    const data = await trpcQuery('listings.adminList');
    if (!Array.isArray(data)) return { data: [], error: null };
    // Convert to the shape the admin pages expect (snake_case + images as objects)
    const list = data.map((row) => {
      let images = row.images ?? [];
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch { images = []; }
      }
      // Admin expects images as [{url, sort_order}]
      const imgObjects = images.map((img, i) =>
        typeof img === 'string' ? { url: img, sort_order: i } : img
      );
      return {
        id: row.id,
        unit_code: row.unitCode ?? row.unit_code ?? '',
        title_ar: row.titleAr ?? row.title_ar ?? '',
        title_en: row.titleEn ?? row.title_en ?? '',
        developer_ar: row.developerAr ?? row.developer_ar ?? '',
        developer_en: row.developerEn ?? row.developer_en ?? '',
        project_ar: row.projectAr ?? row.project_ar ?? '',
        project_en: row.projectEn ?? row.project_en ?? '',
        location: row.location ?? '',
        unit_type: row.unitType ?? row.unit_type ?? 'Apartment',
        area: row.area ?? 0,
        rooms: row.rooms ?? 0,
        toilets: row.toilets ?? 0,
        downpayment: row.downpayment ?? '',
        monthly_inst: row.monthlyInst ?? row.monthly_inst ?? '',
        price: row.price ?? '',
        payment_years: row.paymentYears ?? row.payment_years ?? null,
        payment_down_pct: row.paymentDownPct ?? row.payment_down_pct ?? null,
        finishing: row.finishing ?? '',
        delivery: row.delivery ?? '',
        featured: row.featured === 1 || row.featured === true,
        area_slug: row.areaSlug ?? row.area_slug ?? 'new-capital',
        sort_order: row.sortOrder ?? row.sort_order ?? 0,
        active: row.active === 1 || row.active === true,
        images: imgObjects,
        locationId: row.locationId ?? row.location_id ?? null,
        compoundName: row.compoundName ?? row.compound_name ?? '',
        mapsUrl: row.mapsUrl ?? row.maps_url ?? '',
      };
    });
    return { data: list, error: null };
  } catch (err) {
    console.error('controlListings error:', err);
    return { data: null, error: { message: err.message } };
  }
}

// ─── Control panel: upsert listing ───

export async function upsertListing(listing) {
  try {
    const payload = {
      unitCode: listing.unit_code ?? listing.unitCode ?? '',
      titleAr: listing.title_ar ?? listing.titleAr ?? '',
      titleEn: listing.title_en ?? listing.titleEn ?? '',
      developerAr: listing.developer_ar ?? listing.developerAr ?? '',
      developerEn: listing.developer_en ?? listing.developerEn ?? '',
      projectAr: listing.project_ar ?? listing.projectAr ?? '',
      projectEn: listing.project_en ?? listing.projectEn ?? '',
      location: listing.location ?? '',
      locationId: listing.locationId ?? listing.location_id ?? null,
      compoundName: listing.compound_name ?? listing.compoundName ?? '',
      unitType: listing.unit_type ?? listing.unitType ?? 'Apartment',
      area: listing.area ? Number(listing.area) : 0,
      rooms: listing.rooms ? Number(listing.rooms) : 0,
      toilets: listing.toilets ? Number(listing.toilets) : 0,
      downpayment: listing.downpayment ?? '',
      monthlyInst: listing.monthly_inst ?? listing.monthlyInst ?? '',
      price: listing.price ?? '',
      finishing: listing.finishing ?? '',
      delivery: listing.delivery ?? '',
      featured: !!listing.featured,
      areaSlug: listing.area_slug ?? listing.areaSlug ?? 'new-capital',
      mapsUrl: listing.maps_url ?? listing.mapsUrl ?? '',
      sortOrder: listing.sort_order ?? listing.sortOrder ?? 0,
      images: listing.images
        ? (listing.images || []).map((img) => typeof img === 'string' ? img : img?.url).filter(Boolean)
        : undefined,
    };

    let data;
    if (listing.id) {
      data = await trpcMutation('listings.update', { id: listing.id, ...payload });
    } else {
      data = await trpcMutation('listings.create', payload);
    }

    // Return in snake_case format for admin pages
    return {
      data: {
        id: data.id ?? listing.id,
        unit_code: payload.unitCode,
        title_ar: payload.titleAr,
        title_en: payload.titleEn,
        developer_ar: payload.developerAr,
        developer_en: payload.developerEn,
        project_ar: payload.projectAr,
        project_en: payload.projectEn,
        location: payload.location,
        locationId: payload.locationId,
        compound_name: payload.compoundName,
        unit_type: payload.unitType,
        area: payload.area,
        rooms: payload.rooms,
        toilets: payload.toilets,
        downpayment: payload.downpayment,
        monthly_inst: payload.monthlyInst,
        price: payload.price,
        finishing: payload.finishing,
        delivery: payload.delivery,
        featured: payload.featured,
        area_slug: payload.areaSlug,
        maps_url: payload.mapsUrl,
        sort_order: payload.sortOrder,
      },
      error: null,
    };
  } catch (err) {
    console.error('upsertListing error:', err);
    return { data: null, error: { message: err.message } };
  }
}

// ─── Control panel: reorder listings ───

export async function setListingsOrder(orderedIds) {
  try {
    await trpcMutation('listings.reorder', { orderedIds });
    return { error: null };
  } catch (err) {
    return { error: { message: err.message } };
  }
}

// ─── Control panel: delete listing ───

export async function deleteListing(id) {
  try {
    await trpcMutation('listings.delete', { id });
    return { error: null };
  } catch (err) {
    return { error: { message: err.message } };
  }
}

// ─── Control panel: set images for a listing ───

export async function setListingImages(listingId, urls) {
  try {
    const urlStrings = (urls || []).map((u) => (typeof u === 'string' ? u : u?.url)).filter(Boolean);
    // Update the listing with new images array
    await trpcMutation('listings.update', {
      id: listingId,
      images: urlStrings,
    });
    return { error: null };
  } catch (err) {
    return { error: { message: err.message } };
  }
}

// ─── Control panel: upload image ───

export async function uploadListingImage(file, listingId) {
  try {
    // Upload to the server's /api/upload endpoint
    const formData = new FormData();
    formData.append('file', file);
    formData.append('listingId', String(listingId));

    const res = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return { url: null, error: { message: text || 'Upload failed' } };
    }

    const result = await res.json();
    return { url: result.url || null, error: null };
  } catch (err) {
    return { url: null, error: { message: err.message || 'Upload failed' } };
  }
}

// ─── Formatting helper (used by admin) ───

export function formatNumberReadable(val) {
  if (val == null || val === '') return '';
  const s = String(val).replace(/,/g, '');
  const n = Number(s);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US');
}

// ─── Control panel: append images to a listing (preserves existing) ───

export async function appendListingImages(listingId, newUrls) {
  try {
    // Fetch current listing to get existing images
    const current = await trpcQuery('listings.getById', { id: listingId });
    const existingImages = current?.images || [];
    
    // Convert new URLs to strings
    const newUrlStrings = (newUrls || []).map((u) => (typeof u === 'string' ? u : u?.url)).filter(Boolean);
    
    // Merge: existing + new (avoiding duplicates)
    const merged = [...existingImages, ...newUrlStrings];
    const unique = Array.from(new Set(merged));
    
    // Update the listing with merged images array
    await trpcMutation('listings.update', {
      id: listingId,
      images: unique,
    });
    return { error: null };
  } catch (err) {
    return { error: { message: err.message } };
  }
}

// ─── Bulk upload multiple images at once ───

export async function uploadMultipleImages(files, listingId) {
  try {
    // Upload all files to the server's /api/upload-multiple endpoint in one request
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    formData.append('listingId', String(listingId));

    const res = await fetch('/api/upload-multiple', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return { urls: [], errors: [text || 'Bulk upload failed'] };
    }

    const result = await res.json();
    return { urls: result.urls || [], errors: result.errors || [] };
  } catch (err) {
    return { urls: [], errors: [err.message || 'Bulk upload failed'] };
  }
}
