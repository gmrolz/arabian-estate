import { useState, useRef, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useSite } from '../context/SiteContext';
import { getAreaFromListing } from '../data/newCapitalListings';
import { hasSupabase } from '../lib/supabase';
import { trackEvent } from '../lib/listingsApi';
import { trackLeadConversion } from '../lib/conversions';
import { formatNumberReadable } from '../lib/format';
const WHATSAPP_NUMBER = '201000257941';
const PHONE_NUMBER = '+201000257941';
const FALLBACK_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663026741040/Amy8eaCEPruFwakvoHY8Wk/placeholder-listing-gwAks4ueAQVz8qfmqQpEYM.webp';
function formatPriceShort(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return '';
    const num = parseInt(priceStr.replace(/,/g, ''), 10);
    if (isNaN(num)) return priceStr;
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return String(num);
}

/* ─── Image Carousel with Thumbnails ─────────────────────────────────── */
function ImageCarousel({ images, alt, featured, priceTag, t, listingId, siteId, show_full_price, price }) {
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
    }, [idx, listingId, isInView, siteId]);

    const handlePrev = () => setIdx((i) => (i - 1 + total) % total);
    const handleNext = () => setIdx((i) => (i + 1) % total);
    const handleThumbnailClick = (newIdx) => setIdx(newIdx);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        setDragging(true);
        startRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            if (dx > 0) handlePrev();
            else handleNext();
            setDragging(false);
        }
    };

    const handleMouseUp = () => setDragging(false);

    return (
        <div className="carousel-container" ref={wrapRef}>
            {/* Main Image */}
            <div className="carousel-main">
                {featured && <div className="carousel-badge-featured">{t('card.featured')}</div>}
                {priceTag && <div className="carousel-badge-price">{priceTag}</div>}

                <div
                    className="carousel-wrap"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div className="carousel-inner">
                        {list.map((img, i) => (
                            <img
                                key={i}
                                src={typeof img === 'string' ? img : img.url}
                                alt={`${alt} ${i + 1}`}
                                className={`carousel-img ${i === idx ? 'active' : ''}`}
                                loading={i === idx ? 'eager' : 'lazy'}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    {total > 1 && (
                        <>
                            <button
                                type="button"
                                className="carousel-btn carousel-btn-prev"
                                onClick={handlePrev}
                                aria-label="Previous image"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                className="carousel-btn carousel-btn-next"
                                onClick={handleNext}
                                aria-label="Next image"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Image Counter */}
                    {total > 1 && (
                        <div className="carousel-counter">
                            {idx + 1} / {total}
                        </div>
                    )}
                </div>
            </div>

            {/* Thumbnail Gallery */}
            {total > 1 && (
                <div className="carousel-thumbnails">
                    {list.map((img, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`carousel-thumbnail ${i === idx ? 'active' : ''}`}
                            onClick={() => handleThumbnailClick(i)}
                            aria-label={`View image ${i + 1}`}
                        >
                            <img
                                src={typeof img === 'string' ? img : img.url}
                                alt={`${alt} thumbnail ${i + 1}`}
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PropertyCard({ listing, featured, priceTag }) {
    const { t, locale } = useLocale();
    const { siteId } = useSite();
    const isRTL = locale === 'ar';

    const {
        id: listingId,
        title,
        price,
        area,
        beds,
        baths,
        finishing,
        images = [],
        downpayment,
        monthly_inst,
        annual_payment,
        show_downpayment,
        show_monthly,
        show_annual,
        show_full_price,
        location_name,
    } = listing;

    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I'm interested in: ${encodeURIComponent(title || 'Property')}`;

    return (
        <div className="property-card">
            {/* Image Carousel */}
            <ImageCarousel
                images={images}
                alt={title || 'Property'}
                featured={featured}
                priceTag={priceTag}
                t={t}
                listingId={listingId}
                siteId={siteId}
                show_full_price={show_full_price}
                price={price}
            />

            {/* Card Content */}
            <div className="card-body">
                <h3 className="card-title">{title}</h3>
                <p className="card-location">{location_name || getAreaFromListing(listing) || 'Location'}</p>

                {/* Specs */}
                <div className="card-specs">
                    {area && (
                        <div className="spec">
                            <span className="spec-label">{t('card.area')}</span>
                            <span className="spec-value">{area} m²</span>
                        </div>
                    )}
                    {beds && (
                        <div className="spec">
                            <span className="spec-label">{t('card.beds')}</span>
                            <span className="spec-value">{beds}</span>
                        </div>
                    )}
                    {baths && (
                        <div className="spec">
                            <span className="spec-label">{t('card.baths')}</span>
                            <span className="spec-value">{baths}</span>
                        </div>
                    )}
                    {finishing && (
                        <div className="spec">
                            <span className="spec-label">{t('card.finishing')}</span>
                            <span className="spec-value">{finishing}</span>
                        </div>
                    )}
                </div>

                {/* Pricing */}
                <div className="card-pricing">
                    {(() => {
                        if (!price) {
                            return (
                                <div className="price-row">
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="price-inquiry-link"
                                    >
                                        استعلم عن السعر
                                    </a>
                                </div>
                            );
                        }
                        return (
                            <>
                                {show_downpayment && downpayment && (
                                    <div className="price-row">
                                        <span>{t('card.downPayment')}</span>
                                        <span>EGP {formatNumberReadable(downpayment)}</span>
                                    </div>
                                )}
                                {show_monthly && monthly_inst && (
                                    <div className="price-row">
                                        <span>{t('card.monthly')}</span>
                                        <span>EGP {formatNumberReadable(monthly_inst)} /mo</span>
                                    </div>
                                )}
                                {show_annual && annual_payment && (
                                    <div className="price-row">
                                        <span>{t('card.annual')}</span>
                                        <span>EGP {formatNumberReadable(annual_payment)} /yr</span>
                                    </div>
                                )}
                                {show_full_price && price && (
                                    <div className="price-row price-full">
                                        <span>{t('card.fullPrice')}</span>
                                        <span>EGP {formatNumberReadable(price)}</span>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* Actions */}
                <div className="card-actions">
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
        </div>
    );
}
