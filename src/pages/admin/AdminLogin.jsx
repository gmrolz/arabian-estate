import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getControlSession, setControlSession } from '../../lib/listingsApi';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (getControlSession()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const trimmed = (password || '').trim();
    if (setControlSession(trimmed)) {
      navigate('/admin/dashboard', { replace: true });
      window.location.reload();
      return;
    }
    setError('Invalid password');
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h1 className="admin-login-title">Arabian Estate Admin</h1>
        <p className="admin-login-sub">Sign in to manage listings</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="admin-input admin-input-password"
              autoComplete="off"
            />
            <button
              type="button"
              className="admin-login-toggle-password"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              )}
            </button>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">
            Sign in
          </button>
          {error && <p className="admin-login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
