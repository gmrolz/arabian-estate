import { useState, useRef, useEffect, useMemo } from 'react';
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

/* ─── Image Carousel ─────────────────────────────────── */
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
        <div
            className="carousel-wrap"
            ref={wrapRef}
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
                        alt={alt}
                        className={`carousel-img ${i === idx ? 'active' : ''}`}
                        loading={i === idx ? 'eager' : 'lazy'}
                    />
                ))}
            </div>

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
                    <div className="carousel-dots">
                        {list.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`carousel-dot ${i === idx ? 'active' : ''}`}
                                onClick={() => setIdx(i)}
                                aria-label={`Go to image ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}

            {featured && <div className="carousel-badge carousel-badge-featured">{t('card.featured')}</div>}
            {show_full_price && priceTag && (
                <div className="carousel-badge carousel-badge-price">{priceTag}</div>
            )}
        </div>
    );
}

/* ─── Main PropertyCard Component ─────────────────────────────────── */
export default function PropertyCard({ listing, featured = false }) {
    const { t, locale } = useLocale();
    const { siteId } = useSite();
    const cardRef = useRef(null);

    // Extract fields
    const {
        id: listingId,
        title_ar, title_en,
        project_ar, project_en,
        developer_ar, developer_en,
        location,
        area, rooms, toilets,
        finishing,
        delivery,
        price, downpayment, monthly_inst, annual_payment,
        images,
        show_price, show_downpayment, show_monthly, show_full_price, show_annual, show_compound,
        compoundName,
    } = listing;

    const isAr = locale === 'ar';
    const title = isAr ? title_ar : title_en;
    const project = isAr ? project_ar : project_en;
    const developer = isAr ? developer_ar : developer_en;
    
    // Default show_price to true if not explicitly set
    const effectiveShowPrice = show_price !== false && show_price !== 0 ? true : false;

    // Calculate payment duration in years
    const monthlyPaymentDuration = monthly_inst && price && downpayment 
        ? Math.round((price - downpayment) / monthly_inst / 12)
        : null;

    const waMessage = encodeURIComponent(
        [
            `*Unit Inquiry – Arabian Estate*`,
            `*Listing ID: ${listingId}*`,
            ``,
            `*${title || project}*`,
            `Project: ${project}`,
            `Developer: ${developer}`,
            `Location: ${location}`,
            ``,
            `*Unit Specifications:*`,
            `Area: ${area} m²`,
            `Bedrooms: ${rooms}`,
            `Bathrooms: ${toilets}`,
            `Finishing: ${finishing}`,
            `Delivery: ${delivery}`,
            ``,
            `*Pricing Details:*`,
            `Total Price: EGP ${formatNumberReadable(price)}`,
            `Down Payment: EGP ${formatNumberReadable(downpayment)}`,
            `Monthly Installment: EGP ${formatNumberReadable(monthly_inst)}`,
            ...(monthlyPaymentDuration ? [`Payment Duration: ${monthlyPaymentDuration} years`] : []),
            ...(annual_payment ? [`Annual Payment Option: EGP ${formatNumberReadable(annual_payment)}`] : []),
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
                show_full_price={effectiveShowPrice && show_full_price}
                price={price}
            />

            <div className="card-body">
                <div>
                    {title && <div className="card-title">{title}</div>}
                    <div className="card-project">{project}</div>
                    <div className="card-developer">{developer} · {location}</div>
                    {delivery && <div className="card-delivery">{t('card.delivery')}: {delivery}</div>}
                </div>

                <div className="card-specs">
                    <span className="spec">Unit</span>
                    <span className="spec">{area} m²</span>
                    <span className="spec">{rooms} {t('card.beds')}</span>
                    <span className="spec">{toilets} {t('card.bath')}</span>
                    <span className="spec">{finishing}</span>
                </div>

                <hr className="card-divider" />

                <div className="card-pricing">
                    {(() => {
                        // Master show_price toggle: if false, hide all pricing
                        if (!effectiveShowPrice) {
                            return (
                                <div className="price-row price-hidden">
                                    <a
                                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I'm interested in ${title}. Can you please share the pricing details?`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-inquire-price"
                                        onClick={() => {
                                            if (listingId && hasSupabase()) trackEvent(listingId, 'inquire_price', {}, listing.site_id ?? siteId);
                                        }}
                                    >
                                        استعلم عن السعر
                                    </a>
                                </div>
                            );
                        }

                        const hasPricingToShow = 
                            (show_downpayment && downpayment) ||
                            (show_monthly && monthly_inst) ||
                            (show_full_price && price) ||
                            (show_annual && annual_payment);

                        if (!hasPricingToShow) {
                            return (
                                <div className="price-row price-hidden">
                                    <a
                                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I'm interested in ${title}. Can you please share the pricing details?`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-inquire-price"
                                        onClick={() => {
                                            if (listingId && hasSupabase()) trackEvent(listingId, 'inquire_price', {}, listing.site_id ?? siteId);
                                        }}
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
