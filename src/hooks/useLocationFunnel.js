/**
 * useLocationFunnel
 * Fetches location node(s) and their children from the API,
 * plus listings filtered by locationId(s).
 * Used by all 4 funnel pages: City, Collection, Neighborhood, Compound.
 */
import { useState, useEffect } from 'react';

export function useLocationNode(slug) {
  const [node, setNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/locations/by-slug/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) setError(data.error);
        else setNode(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { node, loading, error };
}

export function useLocationChildren(nodeId) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!nodeId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/locations/${nodeId}/children`)
      .then((r) => r.json())
      .then((data) => setChildren(Array.isArray(data) ? data : []))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, [nodeId]);

  return { children, loading };
}

export function useLocationPath(slugs) {
  // slugs: array of slug strings e.g. ['cairo', 'east-cairo', 'area-new-capital']
  const [path, setPath] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slugs || slugs.length === 0) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/locations/by-path?slugs=${slugs.join(',')}`)
      .then((r) => r.json())
      .then((data) => setPath(Array.isArray(data) ? data : []))
      .catch(() => setPath([]))
      .finally(() => setLoading(false));
  }, [slugs.join(',')]);

  return { path, loading };
}

export function useListingsByLocationIds(locationIds) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationIds || locationIds.length === 0) { setLoading(false); return; }
    setLoading(true);
    // Use tRPC list with locationIds filter
    const url = `/api/trpc/listings.list?input=${encodeURIComponent(JSON.stringify({ locationIds }))}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const rows = data?.result?.data?.json ?? [];
        setListings(rows);
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [locationIds.join(',')]);

  return { listings, loading };
}

export function useListingsByCompoundName(compoundName) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!compoundName) { setLoading(false); return; }
    setLoading(true);
    const url = `/api/trpc/listings.list?input=${encodeURIComponent(JSON.stringify({ compoundName }))}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const rows = data?.result?.data?.json ?? [];
        setListings(rows);
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [compoundName]);

  return { listings, loading };
}
