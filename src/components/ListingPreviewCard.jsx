import { useState } from 'react';
import { formatNumberReadable } from '../lib/format';

const FALLBACK_IMG = 'https://placehold.co/600x400/e8e8e8/999?text=Arabian+Estate';

export function ListingPreviewCard({ listing }) {
  const [imageIdx, setImageIdx] = useState(0);
  const [language, setLanguage] = useState('ar'); // 'ar' or 'en'

  if (!listing) return null;

  const {
    title_ar = 'عنوان المشروع',
    title_en = 'Project Title',
    project = 'المشروع',
    area = 0,
    rooms = 0,
    toilets = 0,
    downpayment = '',
    monthly_inst = '',
    annual_payment = '',
    price = '',
    finishing = '',
    delivery = '',
    payment_years = null,
    payment_down_pct = null,
    images = [],
    show_price = true,
    show_downpayment = true,
    show_monthly = true,
    show_full_price = false,
    show_annual = false,
  } = listing;

  const imgList = (images && images.length > 0) ? images : [FALLBACK_IMG];
  const currentImg = imgList[imageIdx] || FALLBACK_IMG;
  const isArabic = language === 'ar';

  const handlePrevImg = () => setImageIdx((i) => (i - 1 + imgList.length) % imgList.length);
  const handleNextImg = () => setImageIdx((i) => (i + 1) % imgList.length);

  return (
    <div className="listing-preview-wrapper">
      {/* Language Toggle */}
      <div className="preview-language-toggle">
        <button
          className={`lang-btn ${isArabic ? 'active' : ''}`}
          onClick={() => setLanguage('ar')}
        >
          العربية
        </button>
        <button
          className={`lang-btn ${!isArabic ? 'active' : ''}`}
          onClick={() => setLanguage('en')}
        >
          English
        </button>
      </div>

      {/* Mobile-sized Preview Container */}
      <div className="mobile-preview-container" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="listing-preview-card">
          {/* Image Carousel */}
          <div className="preview-carousel">
            <img src={currentImg} alt="Preview" className="preview-image" />
            {imgList.length > 1 && (
              <>
                <button className="carousel-btn prev" onClick={handlePrevImg}>‹</button>
                <button className="carousel-btn next" onClick={handleNextImg}>›</button>
                <div className="carousel-counter">{imageIdx + 1}/{imgList.length}</div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="preview-content">
            {/* Title */}
            <div className="preview-title">
              <h3 className="title-ar">{isArabic ? title_ar : title_en}</h3>
              {isArabic && title_en && <p className="title-en">{title_en}</p>}
              {!isArabic && title_ar && <p className="title-en">{title_ar}</p>}
            </div>

            {/* Details Grid */}
            <div className="preview-details">
              <div className="detail-item">
                <span className="detail-label">{isArabic ? 'المشروع' : 'Project'}</span>
                <span className="detail-value">{project}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{isArabic ? 'المساحة' : 'Area'}</span>
                <span className="detail-value">{area} m²</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{isArabic ? 'الغرف' : 'Rooms'}</span>
                <span className="detail-value">{rooms}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{isArabic ? 'الحمامات' : 'Bathrooms'}</span>
                <span className="detail-value">{toilets}</span>
              </div>
              {finishing && (
                <div className="detail-item">
                  <span className="detail-label">{isArabic ? 'التشطيب' : 'Finishing'}</span>
                  <span className="detail-value">{finishing}</span>
                </div>
              )}
              {delivery && (
                <div className="detail-item">
                  <span className="detail-label">{isArabic ? 'التسليم' : 'Delivery'}</span>
                  <span className="detail-value">{delivery}</span>
                </div>
              )}
            </div>

            {/* Pricing */}
            {(() => {
              const hasPricingToShow = 
                (show_downpayment && downpayment) ||
                (show_monthly && monthly_inst) ||
                (show_full_price && price) ||
                (show_annual && annual_payment);

              if (!hasPricingToShow) {
                return (
                  <div className="price-hidden-notice">
                    {isArabic ? 'استعلم عن السعر' : 'Ask for Price'}
                  </div>
                );
              }

              return (
                <div className="preview-pricing">
                  {show_price && show_downpayment && downpayment && (
                    <div className="price-row">
                      <span className="price-label">{isArabic ? 'الدفعة الأولى' : 'Pay Now'}</span>
                      <span className="price-value">EGP {formatNumberReadable(downpayment)}</span>
                    </div>
                  )}
                  {show_price && show_monthly && monthly_inst && (
                    <div className="price-row">
                      <span className="price-label">{isArabic ? 'الشهري' : 'Monthly'}</span>
                      <span className="price-value">EGP {formatNumberReadable(monthly_inst)}/{isArabic ? 'شهر' : 'mo'}</span>
                    </div>
                  )}
                  {show_price && show_full_price && price && (
                    <div className="price-row">
                      <span className="price-label">{isArabic ? 'السعر الاجمالي' : 'Full Unit Price'}</span>
                      <span className="price-value">EGP {formatNumberReadable(price)}</span>
                    </div>
                  )}
                  {show_price && show_annual && annual_payment && (
                    <div className="price-row">
                      <span className="price-label">{isArabic ? 'دفعة سنويه' : 'Annual Payment'}</span>
                      <span className="price-value">EGP {formatNumberReadable(annual_payment)}/{isArabic ? 'سنة' : 'year'}</span>
                    </div>
                  )}
                  {(payment_years != null || payment_down_pct != null) && (
                    <div className="price-plan">
                      {payment_down_pct != null && `${payment_down_pct}% ${isArabic ? 'دفعة أولى' : 'down'}`}
                      {payment_down_pct != null && payment_years != null && ' · '}
                      {payment_years != null && `${payment_years} ${isArabic ? 'سنة' : 'years'}`}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* CTA Buttons */}
            <div className="preview-cta">
              <button className="cta-btn call-btn">
                {isArabic ? '📞 اتصل' : '📞 Call'}
              </button>
              <button className="cta-btn whatsapp-btn">
                {isArabic ? '💬 واتس اب' : '💬 WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
