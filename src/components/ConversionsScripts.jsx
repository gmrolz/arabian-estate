import { useEffect } from 'react';

const GTM_ID = import.meta.env.VITE_GTM_ID || '';
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || '';
const FACEBOOK_PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID || '';

/**
 * Option A – Google Tag Manager (recommended): set VITE_GTM_ID=GTM-XXXXXX.
 *   We load the GTM container. When a lead happens we push dataLayer.push({ event: 'lead' }).
 *   In GTM: create Trigger = Custom Event "lead", then add your Google Ads conversion + Facebook Lead tags to that trigger.
 *
 * Option B – Direct gtag: set VITE_GOOGLE_ADS_ID and VITE_GOOGLE_ADS_CONVERSION_SEND_TO.
 *
 * Option C – Facebook only: set VITE_FACEBOOK_PIXEL_ID (or add the pixel in GTM).
 */
export default function ConversionsScripts() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];

    if (GTM_ID) {
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      const gtmScript = document.createElement('script');
      gtmScript.async = true;
      gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
      document.head.appendChild(gtmScript);

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
      iframe.style.cssText = 'height:0;width:0;display:none;visibility:hidden';
      iframe.title = 'Google Tag Manager';
      document.body.appendChild(iframe);
    }

    if (!GTM_ID && GOOGLE_ADS_ID) {
      function gtag(...args) {
        window.dataLayer.push(args);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', GOOGLE_ADS_ID);

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
      document.head.appendChild(script);
    }

    if (!GTM_ID && FACEBOOK_PIXEL_ID) {
      const f = window;
      const b = document;
      const e = 'script';
      const v = 'https://connect.facebook.net/en_US/fbevents.js';
      if (f.fbq) return;
      const n = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      const t = b.createElement(e);
      t.async = true;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
      window.fbq = n;
      fbq('init', FACEBOOK_PIXEL_ID);
      fbq('track', 'PageView');
    }
  }, []);

  return null;
}
