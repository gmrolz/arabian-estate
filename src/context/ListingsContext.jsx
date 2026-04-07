import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocale } from './LocaleContext';
import { fetchListingsFromAPI } from '../lib/api';
import { normalizeListingRow } from '../lib/listingsApi';
import { slugifyProject, EGYPT_REGIONS, CAIRO_AREAS } from '../data/newCapitalListings';

const getAreaFromListing = (listing) => {
  if (listing.areaSlug) return listing.areaSlug;
  if (listing.area_slug) return listing.area_slug;
  return 'new-capital';
};

const ListingsContext = createContext(null);

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within ListingsProvider');
  return ctx;
}

/**
 * Normalize a DB row (camelCase) to the shape the frontend components expect.
 * The old static data used snake_case keys; components reference both.
 */
const normalizeRow = (row, locale) => normalizeListingRow(row, locale);

export function ListingsProvider({ children }) {
  const { locale } = useLocale();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchListingsFromAPI();
      if (Array.isArray(data) && data.length > 0) {
        setListings(data.map((r) => normalizeRow(r, locale)));
      } else {
        setListings([]);
      }
    } catch (err) {
      console.error('Failed to fetch listings from API:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const value = useMemo(() => {
    const getListingsByRegion = (areaSlug) => {
      if (!areaSlug) return [];
      return listings.filter((l) => l.area_slug === areaSlug);
    };
    const getFeaturedByRegion = (areaSlug, limit = 3) =>
      getListingsByRegion(areaSlug).filter((l) => l.featured).slice(0, limit);
    const getFeaturedListings = () => listings.filter((l) => l.featured).slice(0, 3);
    const getRepresentativeListing = (regionOrAreaSlug) => {
      if (regionOrAreaSlug === 'cairo') {
        const areas = ['new-capital', 'new-cairo', 'mostakbal-city'];
        for (const a of areas) {
          const list = getListingsByRegion(a);
          const withImg = list.find((l) => l.images?.length);
          if (withImg) return withImg;
          if (list[0]) return list[0];
        }
        return null;
      }
      const list = getListingsByRegion(regionOrAreaSlug);
      return list.find((l) => l.images?.length) || list[0] || null;
    };
    const getListingsCountByEgyptRegion = (regionSlug) => {
      if (regionSlug === 'cairo')
        return getListingsByRegion('new-capital').length + getListingsByRegion('new-cairo').length + getListingsByRegion('mostakbal-city').length;
      return getListingsByRegion(regionSlug).length;
    };
    const getCompoundsByRegion = (regionSlug) => {
      const list = getListingsByRegion(regionSlug);
      const byProject = {};
      list.forEach((l) => {
        const key = l.project || '';
        if (!key) return;
        if (!byProject[key]) byProject[key] = { project: key, slug: slugifyProject(key), count: 0 };
        byProject[key].count += 1;
      });
      return Object.values(byProject).sort((a, b) => a.project.localeCompare(b.project));
    };
    const getListingsByCompound = (regionSlug, compoundSlug) => {
      const list = getListingsByRegion(regionSlug);
      return list.filter((l) => slugifyProject(l.project) === compoundSlug);
    };
    const getProjectBySlug = (regionSlug, compoundSlug) => {
      const compounds = getCompoundsByRegion(regionSlug);
      const found = compounds.find((c) => c.slug === compoundSlug);
      return found ? found.project : null;
    };
    return {
      listings,
      loading,
      refetchListings: loadListings,
      getListingsByRegion,
      getFeaturedByRegion,
      getFeaturedListings,
      getRepresentativeListing,
      getListingsCountByEgyptRegion,
      getCompoundsByRegion,
      getListingsByCompound,
      getProjectBySlug,
      EGYPT_REGIONS,
      CAIRO_AREAS,
    };
  }, [listings, loading, loadListings]);

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
}
