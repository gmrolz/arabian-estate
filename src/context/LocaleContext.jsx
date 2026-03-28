import { createContext, useContext, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { translations, getT } from '../i18n/translations';
import { useSite } from './SiteContext';

const LocaleContext = createContext(null);

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function LocaleProvider({ children }) {
  const { pathname } = useLocation();
  const { sitePrefix } = useSite();
  // Arabic is default; /en prefix = English; admin is always English
  const isAdmin = pathname.startsWith('/admin');
  const isEn = pathname.startsWith('/en') || isAdmin;
  const locale = isEn ? 'en' : 'ar';
  const basePath = isAdmin ? '' : isEn ? '/en' : '';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', locale === 'ar' ? 'ar' : 'en');
  }, [locale]);

  const slugToKey = (slug) => {
    if (!slug) return 'egypt';
    const map = { cairo: 'cairo', 'east-cairo': 'eastCairo', 'new-capital': 'newCapital', 'new-cairo': 'newCairo', 'mostakbal-city': 'mostakbalCity', 'north-coast': 'northCoast', sokhna: 'sokhna', galala: 'galala', hurghada: 'hurghada' };
    return map[slug] || slug;
  };

  const value = useMemo(() => {
    const t = getT(translations, locale);
    const lp = (path) => {
      const p = path.startsWith('/') ? path : `/${path}`;
      return basePath + sitePrefix + p;
    };
    const otherLocalePath = () => {
      const withoutEn = pathname.replace(/^\/en/, '') || '/';
      return locale === 'ar' ? `/en${pathname}` : withoutEn;
    };
    const locationLabel = (slug) => t(`location.${slugToKey(slug)}`);
    return { locale, basePath, sitePrefix, t, lp, otherLocalePath, locationLabel };
  }, [locale, basePath, sitePrefix, pathname]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
