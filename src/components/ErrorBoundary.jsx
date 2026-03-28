import { Component } from 'react';
import { Link } from 'react-router-dom';

/** Catches render errors so we never show a white page. Shows a redirect/fallback page instead. */
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="not-found" style={{ minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #f8f6fc 0%, #f0ecf8 100%)', textAlign: 'center' }}>
          <div className="not-found-code" style={{ fontSize: '4rem', fontWeight: 700, color: '#6b5b95' }}>404</div>
          <h1 className="not-found-title" style={{ marginTop: '1rem', fontSize: '1.25rem' }}>This Page Does Not Exist</h1>
          <p style={{ color: '#666', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Sorry, something went wrong or the page was not found.</p>
          <Link to="/" className="not-found-btn not-found-btn-primary" style={{ display: 'inline-block', padding: '0.75rem 1.25rem', borderRadius: 8, background: '#6b5b95', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Go to Home</Link>
          <Link to="/admin" className="not-found-btn not-found-btn-secondary" style={{ display: 'inline-block', marginTop: '0.75rem', padding: '0.75rem 1.25rem', borderRadius: 8, border: '2px solid #6b5b95', color: '#6b5b95', fontWeight: 600, textDecoration: 'none' }}>Admin page</Link>
        </div>
      );
    }
    return this.props.children;
  }
}
