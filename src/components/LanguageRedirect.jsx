import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Auto-detect browser language on first visit.
 * If the browser language is English (and user hasn't manually chosen a language),
 * redirect from Arabic root (/) to English (/en).
 * Arabic stays as default — no redirect needed for Arabic browsers.
 */
export default function LanguageRedirect() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    // Only run on first visit — check if user has already chosen a language
    const hasChosen = sessionStorage.getItem('lang_chosen');
    if (hasChosen) return;

    // Only redirect from Arabic root pages (not /en, not /admin)
    if (pathname.startsWith('/en') || pathname.startsWith('/admin')) {
      sessionStorage.setItem('lang_chosen', '1');
      return;
    }

    // Detect browser language
    const browserLang = navigator.language || navigator.userLanguage || '';
    const isArabic = browserLang.startsWith('ar');

    if (!isArabic) {
      // Browser is not Arabic — redirect to English version
      sessionStorage.setItem('lang_chosen', '1');
      const enPath = '/en' + (pathname === '/' ? '' : pathname);
      navigate(enPath, { replace: true });
    } else {
      // Browser is Arabic — stay on Arabic, mark as chosen
      sessionStorage.setItem('lang_chosen', '1');
    }
  }, []); // Only run once on mount

  return null;
}
