import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Set Arabic as the default language.
 * On first visit, redirect all users to the Arabic version.
 * Users can manually switch to English using the language selector.
 */
export default function LanguageRedirect() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    // Only run on first visit — check if user has already chosen a language
    const hasChosen = sessionStorage.getItem('lang_chosen');
    if (hasChosen) return;

    // Only redirect from Arabic root pages (not /en, not /ar, not /admin)
    if (pathname.startsWith('/en') || pathname.startsWith('/ar') || pathname.startsWith('/admin')) {
      sessionStorage.setItem('lang_chosen', '1');
      return;
    }

    // Detect browser language
    const browserLang = navigator.language || navigator.userLanguage || '';
    const isArabic = browserLang.startsWith('ar');

    // Always redirect to Arabic version by default
    sessionStorage.setItem('lang_chosen', '1');
    const arPath = '/ar' + (pathname === '/' ? '' : pathname);
    navigate(arPath, { replace: true });
  }, []); // Only run once on mount

  return null;
}
