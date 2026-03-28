/**
 * Simple API client for the tRPC backend.
 * Calls the listings endpoints via HTTP fetch.
 */

const API_BASE = '/api/trpc';

async function trpcQuery(path, input) {
  const url = new URL(`${API_BASE}/${path}`, window.location.origin);
  if (input !== undefined) {
    // superjson wraps the input
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
  // superjson wraps the result
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

// ─── Public API ───

export async function fetchListingsFromAPI(filters) {
  return trpcQuery('listings.list', filters);
}

export async function fetchListingById(id) {
  return trpcQuery('listings.getById', { id });
}

export async function fetchFilterOptions() {
  return trpcQuery('listings.filterOptions');
}

export async function fetchFeaturedListings() {
  return trpcQuery('listings.list', { featured: true });
}

// ─── Admin API ───

export async function fetchAdminListings() {
  return trpcQuery('listings.adminList');
}

export async function createListing(data) {
  return trpcMutation('listings.create', data);
}

export async function updateListing(data) {
  return trpcMutation('listings.update', data);
}

export async function deleteListing(id) {
  return trpcMutation('listings.delete', { id });
}

// ─── Auth API ───

export async function fetchCurrentUser() {
  return trpcQuery('auth.me');
}

export async function logoutUser() {
  return trpcMutation('auth.logout');
}
