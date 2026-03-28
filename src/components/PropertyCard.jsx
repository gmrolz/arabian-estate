import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useSite } from '../context/SiteContext';
import { getAreaFromListing } from '../data/newCapitalListings';
import { hasSupabase } from '../lib/supabase';
import { trackEvent } from '../lib/listingsApi';
import { trackLeadConversion } from '../lib/conversions';
import { formatNumberReadable } from '../lib/format';

const WHATSAPP_NUMBER = '201226662193';
const PHONE_NUMBER = '+201226662193';
const FALLBACK_IMG = 'https://placehold.co/600x400/e8e8e8/999?text=Arabian+Estate';

function formatPriceShort(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return '';
    const num = parseInt(priceStr.replace(/,/g, ''), 10);
    if (isNaN(num)) return priceStr;
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return String(num);
}

/* ─── Image Carousel ─────────────────────────────────── */
function ImageCarousel({ images, alt, featured, priceTag, t, listingId, siteId }) {
    const [idx, setIdx] = useState(0);
    const [isInView, setIsInView] = useState(false);
    const [dragging, setDragging] = useState(false);
    const startRef = useRef({ x: 0, y: 0 });
    const wrapRef = useRef(null);
    const trackedIndices = useRef(new Set());

    const list = (images && images.length > 0) ? images : [FALLBACK_IMG];
    const total = list.length;

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => setIsInView(e.isIntersecting),
            { threshold: 0.5, rootMargin: '80px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!listingId || !hasSupabase() || !isInView || trackedIndices.current.has(idx)) return;
        trackedIndices.current.add(idx);
        trackEvent(listingId, 'photo_view', { photo_index: idx }, siteId);
    }, [idx, isInView, listingId, siteId]);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const onMove = (e) => {
            if (!e.touches?.[0]) return;
            const { x: sx, y: sy } = startRef.current;
            const curX = e.touches[0].clientX;
            const curY = e.touches[0].clientY;
            const deltaX = Math.abs(curX - sx);
            const deltaY = Math.abs(curY - sy);
            if (deltaX > deltaY && deltaX > 10) e.preventDefault();
        };
        el.addEventListener('touchmove', onMove, { passive: false });
        return () => el.removeEventListener('touchmove', onMove);
    }, []);

    const prev = useCallback((e) => {
        e.stopPropagation();
        setIdx(i => (i - 1 + total) % total);
    }, [total]);

    const next = useCallback((e) => {
        e.stopPropagation();
        setIdx(i => (i + 1) % total);
    }, [total]);

    /* touch/mouse swipe */
    const onDragStart = (e) => {
        setDragging(true);
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        startRef.current = { x, y };
    };
    const onDragEnd = (e) => {
        if (!dragging) return;
        setDragging(false);
        const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const diff = startRef.current.x - endX;
        if (diff > 40) setIdx(i => (i + 1) % total);
        else if (diff < -40) setIdx(i => (i - 1 + total) % total);
    };

    return (
        <div
            ref={wrapRef}
            className="carousel-wrap"
            dir="ltr"
            onMouseDown={onDragStart}
            onMouseUp={onDragEnd}
            onTouchStart={onDragStart}
            onTouchEnd={onDragEnd}
        >
            {/* Images */}
            <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
                {list.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt={`${alt} – photo ${i + 1}`}
                        onError={(e) => { e.target.src = FALLBACK_IMG; }}
                        loading="lazy"
                        draggable={false}
                        className="carousel-img"
                    />
                ))}
            </div>

            {/* Arrows — only show if more than 1 photo */}
            {total > 1 && (
                <>
                    <button className="carousel-btn carousel-prev" onClick={prev} aria-label={t('aria.prevPhoto')}>
                        ‹
                    </button>
                    <button className="carousel-btn carousel-next" onClick={next} aria-label={t('aria.nextPhoto')}>
                        ›
                    </button>

                    {/* Dot indicators */}
                    <div className="carousel-dots">
                        {list.map((_, i) => (
                            <button
                                key={i}
                                className={`carousel-dot${i === idx ? ' active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                                aria-label={`${t('aria.photo')} ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Counter */}
                    <div className="carousel-counter">{idx + 1} / {total}</div>
                </>
            )}

            {/* Badges */}
            {priceTag && <span className="card-badge badge-price">EGP {priceTag}</span>}
            {featured && <span className="badge-featured">{t('card.featured')}</span>}
        </div>
    );
}

/* ─── Property Card ──────────────────────────────────── */
export default function PropertyCard({ listing, featured = false }) {
    const { t, locationLabel } = useLocale();
    const { siteId } = useSite();
    const cardRef = useRef(null);
    const viewTracked = useRef(false);
    const {
        project, developer, area, rooms, toilets,
        downpayment, monthlyInst, price, finishing, delivery,
        payment_years, payment_down_pct,
        images, location, title, id: listingId,
    } = listing;

    useEffect(() => {
        if (!listingId || !hasSupabase() || viewTracked.current) return;
        const el = cardRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (!e.isIntersecting || viewTracked.current) return;
                viewTracked.current = true;
                trackEvent(listingId, 'view', {}, listing.site_id ?? siteId);
            },
            { threshold: 0.2, rootMargin: '50px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [listingId]);

    const waMessage = encodeURIComponent(
        [
            `*Unit Inquiry – Arabian Estate*`,
            ``,
            `*${title || project}*`,
            `Project: ${project}`,
            `Developer: ${developer}`,
            `Location: ${location}`,
            ``,
            `Area: ${area} m²`,
            `Bedrooms: ${rooms}`,
            `Bathrooms: ${toilets}`,
            `Finishing: ${finishing}`,
            `Delivery: ${delivery}`,
            ``,
            `Total Price: EGP ${formatNumberReadable(price)}`,
            `Pay now: EGP ${formatNumberReadable(downpayment)}`,
            `Monthly: ${formatNumberReadable(monthlyInst)}`,
            ``,
            `Please send me more details and available payment plans. Thank you!`
        ].join('\n')
    );
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

    return (
        <div className="property-card" ref={cardRef}>
            <ImageCarousel
                images={images}
                alt={`${project} by ${developer}`}
                featured={featured}
                priceTag={formatPriceShort(price)}
                t={t}
                listingId={listingId}
                siteId={listing.site_id ?? siteId}
            />

            <div className="card-body">
                <div>
                    {title && <div className="card-title">{title}</div>}
                    <div className="card-project">{project}</div>
                    <div className="card-developer">{developer} · {locationLabel(getAreaFromListing(listing))}</div>
                    {delivery && <div className="card-delivery">{t('card.delivery')}: {delivery}</div>}
                </div>

                <div className="card-specs">
                    <span className="spec">{area} m²</span>
                    <span className="spec">{rooms} {t('card.beds')}</span>
                    <span className="spec">{toilets} {t('card.bath')}</span>
                    <span className="spec">{finishing}</span>
                </div>

                <hr className="card-divider" />

                <div className="card-pricing">
                    <div className="price-row price-downpayment">
                        <span className="price-label">{t('card.downPayment')}</span>
                        <span className="price-amount">EGP {formatNumberReadable(downpayment)}</span>
                    </div>
                    <div className="price-row price-monthly">
                        <span className="price-label">{t('card.monthly')}</span>
                        <span className="price-amount">{formatNumberReadable(monthlyInst)} <span className="price-suffix">{t('card.perMonth')}</span></span>
                    </div>
                    {(payment_years != null || payment_down_pct != null) && (
                        <div className="price-row price-plan">
                            <span className="price-label">{t('card.paymentPlan')}</span>
                            <span className="price-amount">
                                {payment_years === 0
                                  ? t('card.cashPrice')
                                  : (
                                    <>
                                      {payment_down_pct != null && `${payment_down_pct}% down`}
                                      {payment_down_pct != null && payment_years != null && ' · '}
                                      {payment_years != null && (payment_years === 1 ? t('card.oneYear') : t('card.years', { count: payment_years }))}
                                    </>
                                  )}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="card-footer">
                <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                    onClick={() => {
                        if (listingId && hasSupabase()) trackEvent(listingId, 'cta_whatsapp', {}, listing.site_id ?? siteId);
                        if (trackLeadConversion() && listingId && hasSupabase()) trackEvent(listingId, 'lead', {}, listing.site_id ?? siteId);
                    }}
                >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    {t('card.whatsapp')}
                </a>
                <a
                    href={`tel:${PHONE_NUMBER}`}
                    className="btn-call"
                    title={t('aria.callUs')}
                    onClick={() => {
                        if (listingId && hasSupabase()) trackEvent(listingId, 'cta_call', {}, listing.site_id ?? siteId);
                        if (trackLeadConversion() && listingId && hasSupabase()) trackEvent(listingId, 'lead', {}, listing.site_id ?? siteId);
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z" />
                    </svg>
                    {t('card.call')}
                </a>
            </div>
        </div>
    );
}
