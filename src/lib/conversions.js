/**
 * Lead conversion tracking. Counts 1 conversion per session: first WhatsApp or Call click = 1 lead.
 *
 * Two ways to send to Google Ads:
 * 1) Google Tag Manager (GTM) – we push dataLayer event "lead"; you add conversion tag in GTM. No gtag.
 * 2) Direct gtag – set VITE_GOOGLE_ADS_CONVERSION_SEND_TO and we fire gtag('event','conversion').
 * Facebook: we fire fbq('track','Lead') if the pixel is loaded (by GTM or by our script).
 *
 * Returns true when a conversion was fired (first CTA in session), false if already sent this session.
 * When true, the caller should record a 'lead' event in analytics so the dashboard matches Google.
 */

const SESSION_KEY = 'arabian_lead_conversion_sent';

const getSendTo = () => import.meta.env.VITE_GOOGLE_ADS_CONVERSION_SEND_TO || '';

/** Call when user performs a lead action (WhatsApp or Call). Fires at most once per session. Returns true if conversion was sent. */
export function trackLeadConversion() {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    return false;
  }

  if (typeof window === 'undefined') return true;

  // Option 1: Google Tag Manager – push event so GTM can fire Google Ads / Facebook / etc.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'lead' });

  // Option 2: Direct gtag (only if you're not using GTM and set send_to in .env)
  const sendTo = getSendTo();
  if (window.gtag && sendTo) {
    window.gtag('event', 'conversion', { send_to: sendTo });
  }

  // Facebook Lead (if pixel is loaded via GTM or our script)
  if (window.fbq) {
    window.fbq('track', 'Lead');
  }

  return true;
}
