import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LocaleProvider } from './context/LocaleContext';
import { HeaderVisibilityProvider } from './context/HeaderVisibilityContext';
import { SiteProvider } from './context/SiteContext';
import { ListingsProvider } from './context/ListingsContext';
import Header from './components/Header';
// ListingLangBar removed from global layout (inline versions remain in pages)
import HomePage from './pages/HomePage';
import ListingsPage from './pages/ListingsPage';
import EastCairoPage from './pages/EastCairoPage';
import RegionPage from './pages/RegionPage';
import ListingLocationPage from './pages/ListingLocationPage';
import CompoundPage from './pages/CompoundPage';
import LocationFunnelPage from './pages/LocationFunnelPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginGate from './pages/admin/AdminLoginGate';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminListings from './pages/admin/AdminListings';
import AdminListingEdit from './pages/admin/AdminListingEdit';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import ConversionsScripts from './components/ConversionsScripts';
import LanguageRedirect from './components/LanguageRedirect';
import './index.css';

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <>
      <LanguageRedirect />
      {!isAdmin && (
        <>
          <Header />
        </>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/east-cairo" element={<EastCairoPage />} />
        {/* Redirect all Cairo sub-areas to East Cairo */}
        <Route path="/new-capital" element={<Navigate to="/east-cairo" replace />} />
        <Route path="/listings/cairo" element={<Navigate to="/east-cairo" replace />} />
        <Route path="/listings/cairo/new-capital" element={<Navigate to="/east-cairo" replace />} />
        <Route path="/listings/cairo/new-cairo" element={<Navigate to="/east-cairo" replace />} />
        <Route path="/listings/cairo/mostakbal-city" element={<Navigate to="/east-cairo" replace />} />
        {/* New location funnel routes — 4 levels deep */}
        <Route path="/listings/:citySlug" element={<LocationFunnelPage />} />
        <Route path="/listings/:citySlug/:collectionSlug" element={<LocationFunnelPage />} />
        <Route path="/listings/:citySlug/:collectionSlug/:neighborhoodSlug" element={<LocationFunnelPage />} />
        <Route path="/listings/:citySlug/:collectionSlug/:neighborhoodSlug/:compoundSlug" element={<LocationFunnelPage />} />
        {/* Legacy routes kept for backward compatibility */}
        <Route path="/listings/:region/compound/:compoundSlug" element={<CompoundPage />} />
        <Route path="/en" element={<HomePage />} />
        <Route path="/en/listings" element={<ListingsPage />} />
        <Route path="/en/east-cairo" element={<EastCairoPage />} />
        <Route path="/en/new-capital" element={<Navigate to="/en/east-cairo" replace />} />
        <Route path="/en/listings/cairo" element={<Navigate to="/en/east-cairo" replace />} />
        <Route path="/en/listings/cairo/new-capital" element={<Navigate to="/en/east-cairo" replace />} />
        <Route path="/en/listings/cairo/new-cairo" element={<Navigate to="/en/east-cairo" replace />} />
        <Route path="/en/listings/cairo/mostakbal-city" element={<Navigate to="/en/east-cairo" replace />} />
        {/* New location funnel routes (EN) */}
        <Route path="/en/listings/:citySlug" element={<LocationFunnelPage />} />
        <Route path="/en/listings/:citySlug/:collectionSlug" element={<LocationFunnelPage />} />
        <Route path="/en/listings/:citySlug/:collectionSlug/:neighborhoodSlug" element={<LocationFunnelPage />} />
        <Route path="/en/listings/:citySlug/:collectionSlug/:neighborhoodSlug/:compoundSlug" element={<LocationFunnelPage />} />
        {/* Legacy EN routes */}
        <Route path="/en/listings/:region/compound/:compoundSlug" element={<CompoundPage />} />
        <Route path="/control" element={<Navigate to="/admin" replace />} />
        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminLoginGate />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="listings/new" element={<AdminListingEdit />} />
          <Route path="listings/:id" element={<AdminListingEdit />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';
const basename = base === '/' ? undefined : base;

function App() {
  return (
    <BrowserRouter basename={basename}>
      <ConversionsScripts />
      <ErrorBoundary>
        <SiteProvider>
          <LocaleProvider>
            <HeaderVisibilityProvider>
              <ListingsProvider>
                <AppRoutes />
              </ListingsProvider>
            </HeaderVisibilityProvider>
          </LocaleProvider>
        </SiteProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
