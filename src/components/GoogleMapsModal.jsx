import { useEffect, useRef } from 'react';

/**
 * GoogleMapsModal
 * Opens a Google Maps URL inside an in-site iframe modal.
 * The user cannot navigate away — the iframe is sandboxed.
 *
 * Props:
 *   url      – Google Maps share/embed URL
 *   onClose  – callback to close the modal
 */
export default function GoogleMapsModal({ url, onClose }) {
  const overlayRef = useRef(null);

  // Convert a regular Google Maps share URL to an embeddable URL
  function toEmbedUrl(rawUrl) {
    if (!rawUrl) return '';
    // Already an embed URL
    if (rawUrl.includes('google.com/maps/embed')) return rawUrl;
    // Convert share URL: https://maps.google.com/... or https://www.google.com/maps/...
    // Use the /maps/embed/v1/place approach via the URL as a q param fallback
    // Best approach: wrap in an embed iframe using the maps URL directly
    // Google allows embedding share links in iframes with &output=embed
    if (rawUrl.includes('google.com/maps')) {
      // Try to add output=embed
      const separator = rawUrl.includes('?') ? '&' : '?';
      return rawUrl + separator + 'output=embed';
    }
    return rawUrl;
  }

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Close on overlay click (not on modal content)
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  const embedUrl = toEmbedUrl(url);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '900px',
          height: '70vh',
          maxHeight: '600px',
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: '#fff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontWeight: 600, fontSize: '15px', color: '#1a202c' }}>
              Location on Map
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '20px',
              color: '#718096',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Close map"
          >
            ✕
          </button>
        </div>

        {/* Map iframe — sandboxed, no allow-top-navigation */}
        <iframe
          src={embedUrl}
          title="Google Maps Location"
          style={{ flex: 1, border: 'none', width: '100%' }}
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
    </div>
  );
}
