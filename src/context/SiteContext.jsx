import { createContext, useContext, useMemo } from 'react';
import { SITE_ID, SITE_NAME, SITE_SLUG, SITE_PREFIX } from '../siteConfig';

const SiteContext = createContext(null);

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}

const value = {
  siteId: SITE_ID,
  currentSite: { id: SITE_ID, name: SITE_NAME, slug: SITE_SLUG, logo_url: null },
  sitePrefix: SITE_PREFIX,
  sites: [{ id: SITE_ID, name: SITE_NAME, slug: SITE_SLUG }],
  setAdminSite: () => {},
};

export function SiteProvider({ children }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
