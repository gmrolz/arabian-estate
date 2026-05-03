import { useState, useEffect, useRef } from 'react';
import '../styles/property-card.css';
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

/* ─── Image Carousel ─────────────────────────────────── */
function ImageCarousel({ images, alt, featured, t, listingId, siteId }) {
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

    const handlePrev = (e) => { e.stopPropagation(); setIdx((i) => (i - 1 + total) % total); };
    const handleNext = (e) => { e.stopPropagation(); setIdx((i) => (i + 1) % total); };
    const handleThumbnailClick = (newIdx) => setIdx(newIdx);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        setDragging(true);
        startRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startRef.current.x;
        if (Math.abs(dx) > 50) {
            if (dx > 0) setIdx((i) => (i - 1 + total) % total);
            else setIdx((i) => (i + 1) % total);
            setDragging(false);
        }
    };
    const handleMouseUp = () => setDragging(false);

    return (
        <div className="carousel-container" ref={wrapRef}>
            <div className="carousel-main">
                {featured && <div className="carousel-badge-featured">{t('card.featured')}</div>}
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
                    {total > 1 && (
                        <>
                            <button type="button" className="carousel-btn carousel-btn-prev" onClick={handlePrev} aria-label="Previous image">‹</button>
                            <button type="button" className="carousel-btn carousel-btn-next" onClick={handleNext} aria-label="Next image">›</button>
                        </>
                    )}
                    {total > 1 && (
                        <div className="carousel-counter">{idx + 1} / {total}</div>
                    )}
                </div>
            </div>
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

/* ─── SVG Icons ─────────────────────────────────── */
const BedIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
    </svg>
);
const BathIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h3v2.25"/><path d="M4 21l1-1.5"/><path d="M20 21l-1-1.5"/>
    </svg>
);
const AreaIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/>
    </svg>
);
const LocationIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
);
const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

/* ─── Main PropertyCard ─────────────────────────────────── */
export default function PropertyCard({ listing, featured, priceTag }) {
    const { t, locale } = useLocale();
    const { siteId } = useSite();
    const isRTL = locale === 'ar';

    const {
        id: listingId,
        title,
        price,
        area,
        rooms,
        toilets,
        finishing,
        images = [],
        downpayment,
        monthlyInst,
        monthly_inst,
        annual_payment,
        annualPayment,
        show_downpayment,
        show_monthly,
        show_annual,
        show_full_price,
        show_compound,
        location_name,
        location,
        developer,
        project,
        delivery,
        payment_years,
        paymentYears,
        unitType,
        unit_type,
        compoundName,
        compound_name,
    } = listing;

    // Normalize fields
    const beds = rooms || listing.beds;
    const baths = toilets || listing.baths;
    const monthlyVal = monthlyInst || monthly_inst || listing.monthly_inst;
    const annualVal = annualPayment || annual_payment || listing.annual_payment;
    const payYears = payment_years || paymentYears || listing.payment_years;
    const propType = unitType || unit_type || 'Apartment';
    const compound = compoundName || compound_name || '';
    const rawLocation = location_name || location || '';
    
    // Priority: areaSlug (if not default) > extracted from location > fallback
    let areaSlug = '';
    if (listing.areaSlug && listing.areaSlug !== 'new-capital') {
      areaSlug = listing.areaSlug;
    } else {
      areaSlug = getAreaFromListing(listing) || '';
    }

    // Build rich location display: "Area, City" format
    const buildLocationDisplay = () => {
        // Map area slugs to readable names
        const areaNames = {
            'new-capital': isRTL ? 'العاصمة الإدارية الجديدة' : 'New Administrative Capital',
            'new-cairo': isRTL ? 'القاهرة الجديدة' : 'New Cairo',
            'mostakbal-city': isRTL ? 'مدينة المستقبل' : 'Mostakbal City',
            'north-coast': isRTL ? 'الساحل الشمالي' : 'North Coast',
            'red-sea': isRTL ? 'البحر الأحمر' : 'Red Sea',
            'sokhna': isRTL ? 'العين السخنة' : 'Ain Sokhna',
            'galala': isRTL ? 'الجلالة' : 'Galala',
            'hurghada': isRTL ? 'الغردقة' : 'Hurghada',
            '6-october': isRTL ? '6 أكتوبر' : '6th of October',
            'sheikh-zayed': isRTL ? 'الشيخ زايد' : 'Sheikh Zayed',
        };
        const areaName = areaNames[areaSlug] || rawLocation || areaSlug;
        return areaName;
    };
    const locationDisplay = buildLocationDisplay();

    // Format delivery text
    const getDeliveryText = () => {
        if (!delivery) return null;
        if (delivery === 'Ready to Move' || delivery === 'RTM') return t('card.readyToMove');
        return delivery;
    };

    // Build full WhatsApp message with all listing details
    const buildWhatsAppMessage = () => {
        const monthlyDisplay = monthlyVal ? formatNumberReadable(monthlyVal) : null;
        const dpDisplay = downpayment ? formatNumberReadable(downpayment) : null;
        const priceDisplay = price ? formatNumberReadable(price) : null;
        const deliveryText = getDeliveryText();

        if (isRTL) {
            let msg = `مرحباً، أنا مهتم بهذا العقار:\n`;
            msg += `📌 ${title || 'عقار'}\n`;
            if (locationDisplay) msg += `📍 الموقع: ${locationDisplay}\n`;
            if (propType) msg += `🏠 النوع: ${propType}\n`;
            if (developer) msg += `🏗️ المطور: ${developer}\n`;
            if (beds) msg += `🛏️ غرف: ${beds}\n`;
            if (baths) msg += `🚿 حمامات: ${baths}\n`;
            if (area) msg += `📐 المساحة: ${area} م²\n`;
            if (priceDisplay && show_full_price !== false) msg += `💰 السعر الكامل: ${priceDisplay} جنيه\n`;
            if (dpDisplay && show_downpayment !== false) msg += `💵 المقدم: ${dpDisplay} جنيه\n`;
            if (monthlyDisplay && show_monthly !== false) msg += `📅 القسط الشهري: ${monthlyDisplay} جنيه/شهر\n`;
            if (deliveryText) msg += `🗓️ التسليم: ${deliveryText}\n`;
            if (payYears) msg += `📊 فترة السداد: ${payYears} سنوات\n`;
            if (finishing) msg += `✨ التشطيب: ${finishing}\n`;
            msg += `\nأرجو التواصل معي لمزيد من التفاصيل.`;
            return msg;
        } else {
            let msg = `Hi, I'm interested in this property:\n`;
            msg += `📌 ${title || 'Property'}\n`;
            if (locationDisplay) msg += `📍 Location: ${locationDisplay}\n`;
            if (propType) msg += `🏠 Type: ${propType}\n`;
            if (developer) msg += `🏗️ Developer: ${developer}\n`;
            if (beds) msg += `🛏️ Beds: ${beds}\n`;
            if (baths) msg += `🚿 Baths: ${baths}\n`;
            if (area) msg += `📐 Area: ${area} m²\n`;
            if (priceDisplay && show_full_price !== false) msg += `💰 Full Price: EGP ${priceDisplay}\n`;
            if (dpDisplay && show_downpayment !== false) msg += `💵 Down Payment: EGP ${dpDisplay}\n`;
            if (monthlyDisplay && show_monthly !== false) msg += `📅 Monthly: EGP ${monthlyDisplay}/month\n`;
            if (deliveryText) msg += `🗓️ Delivery: ${deliveryText}\n`;
            if (payYears) msg += `📊 Installments: ${payYears} years\n`;
            if (finishing) msg += `✨ Finishing: ${finishing}\n`;
            msg += `\nPlease contact me for more details.`;
            return msg;
        }
    };

    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`;

    return (
        <div className="property-card" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Image Carousel */}
            <ImageCarousel
                images={images}
                alt={title || 'Property'}
                featured={featured}
                t={t}
                listingId={listingId}
                siteId={siteId}
            />

            {/* Card Body */}
            <div className="card-body">
                {/* Property Type + Developer */}
                <div className="card-meta-row">
                    <span className="card-type-badge">{propType}</span>
                    {developer && <span className="card-developer">{developer}</span>}
                </div>

                {/* Title */}
                <h3 className="card-title">{title}</h3>

                {/* Location */}
                {(locationDisplay || compound) && (
                    <div className="card-location-row">
                        <LocationIcon />
                        <span>{locationDisplay}</span>
                    </div>
                )}

                {/* Compound Name */}
                {compound && show_compound !== false && (
                    <div className="card-compound-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/>
                        </svg>
                        <span>{compound}</span>
                    </div>
                )}

                {/* Specs Row - Icon based */}
                <div className="card-specs-row">
                    {beds ? (
                        <div className="card-spec-item">
                            <BedIcon />
                            <span>{beds} {t('card.beds')}</span>
                        </div>
                    ) : null}
                    {baths ? (
                        <div className="card-spec-item">
                            <BathIcon />
                            <span>{baths} {t('card.bath')}</span>
                        </div>
                    ) : null}
                    {area ? (
                        <div className="card-spec-item">
                            <AreaIcon />
                            <span>{area} m²</span>
                        </div>
                    ) : null}
                </div>

                {/* Delivery + Installment Info */}
                {(getDeliveryText() || payYears) && (
                    <div className="card-delivery-row">
                        {getDeliveryText() && (
                            <div className="card-delivery-item">
                                <CalendarIcon />
                                <span>{getDeliveryText()}</span>
                            </div>
                        )}
                        {payYears && (
                            <div className="card-delivery-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                </svg>
                                <span>{payYears} {t('card.yrs')} {t('card.installments')}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Divider */}
                <div className="card-divider"></div>

                {/* Price Section - Full price first, then DP + Monthly */}
                <div className="card-price-section">
                    {(() => {
                        if (!price) {
                            return (
                                <a href={waLink} target="_blank" rel="noopener noreferrer" className="card-ask-price">
                                    {t('card.askPrice')}
                                </a>
                            );
                        }
                        return (
                            <>
                                {/* Full Price - Always first if shown */}
                                {show_full_price && price && (
                                    <div className="card-price-main">
                                        <span className="card-price-label">{t('card.fullPrice')}</span>
                                        <span className="card-price-value">EGP {formatNumberReadable(price)}</span>
                                    </div>
                                )}

                                {/* Secondary prices row */}
                                <div className="card-price-details">
                                    {show_downpayment && downpayment && (
                                        <div className="card-price-detail">
                                            <span className="detail-label">{t('card.downPayment')}</span>
                                            <span className="detail-value">EGP {formatNumberReadable(downpayment)}</span>
                                        </div>
                                    )}
                                    {show_monthly && monthlyVal && (
                                        <div className="card-price-detail">
                                            <span className="detail-label">{t('card.monthly')}</span>
                                            <span className="detail-value">EGP {formatNumberReadable(monthlyVal)}{t('card.perMonth')}</span>
                                        </div>
                                    )}
                                    {show_annual && annualVal && (
                                        <div className="card-price-detail">
                                            <span className="detail-label">{t('card.annual')}</span>
                                            <span className="detail-value">EGP {formatNumberReadable(annualVal)}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* CTA Actions */}
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
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
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
                            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z"/>
                        </svg>
                        {t('card.call')}
                    </a>
                </div>
            </div>
        </div>
    );
}
