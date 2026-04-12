import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { getControlSession, clearControlSession } from '../../lib/listingsApi';
import { AdminToastProvider } from '../../context/AdminToastContext';
import { useSite } from '../../context/SiteContext';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSite } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = getControlSession();
  const isLoginPage = location.pathname === '/admin' || location.pathname === '/admin/';
  if (!isLoggedIn && !isLoginPage) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    clearControlSession();
    navigate('/admin', { replace: true });
    window.location.reload();
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', end: false },
    { to: '/admin/listings', label: 'Listings', end: false },
    { to: '/admin/locations', label: 'Locations', end: false },
  ];

  return (
    <div className="admin">
      {isLoggedIn && (
        <header className="admin-header">
          <button
            type="button"
            className="admin-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className="admin-menu-icon" />
            <span className="admin-menu-icon" />
            <span className="admin-menu-icon" />
          </button>
          <NavLink to="/admin/dashboard" className="admin-brand" onClick={() => setMenuOpen(false)}>
            {currentSite.name} Admin
          </NavLink>
          <nav className={`admin-nav ${menuOpen ? 'admin-nav-open' : ''}`}>
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => (isActive ? 'admin-nav-link active' : 'admin-nav-link')}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              View site
            </a>
            <button type="button" className="admin-nav-link admin-logout" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </header>
      )}

      <main className={`admin-main ${isLoginPage ? 'admin-main-login' : ''}`}>
        <AdminToastProvider>
          <Outlet />
        </AdminToastProvider>
      </main>
    </div>
  );
}
