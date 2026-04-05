import { useState } from 'react';
import { formatNumberReadable } from '../lib/format';

const FALLBACK_IMG = 'https://placehold.co/600x400/e8e8e8/999?text=Arabian+Estate';

export function ListingPreviewCard({ listing }) {
  const [imageIdx, setImageIdx] = useState(0);

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
    show_full_price = true,
  } = listing;

  const imgList = (images && images.length > 0) ? images : [FALLBACK_IMG];
  const currentImg = imgList[imageIdx] || FALLBACK_IMG;

  const handlePrevImg = () => setImageIdx((i) => (i - 1 + imgList.length) % imgList.length);
  const handleNextImg = () => setImageIdx((i) => (i + 1) % imgList.length);

  return (
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
          <h3 className="title-ar">{title_ar}</h3>
          <p className="title-en">{title_en}</p>
        </div>

        {/* Details Grid */}
        <div className="preview-details">
          <div className="detail-item">
            <span className="detail-label">المشروع</span>
            <span className="detail-value">{project}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">المساحة</span>
            <span className="detail-value">{area} m²</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">الغرف</span>
            <span className="detail-value">{rooms}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">الحمامات</span>
            <span className="detail-value">{toilets}</span>
          </div>
          {finishing && (
            <div className="detail-item">
              <span className="detail-label">التشطيب</span>
              <span className="detail-value">{finishing}</span>
            </div>
          )}
          {delivery && (
            <div className="detail-item">
              <span className="detail-label">التسليم</span>
              <span className="detail-value">{delivery}</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        {show_price && (
          <div className="preview-pricing">
            {show_downpayment && downpayment && (
              <div className="price-row">
                <span className="price-label">الدفعة الأولى</span>
                <span className="price-value">EGP {formatNumberReadable(downpayment)}</span>
              </div>
            )}
            {show_monthly && monthly_inst && (
              <div className="price-row">
                <span className="price-label">الشهري</span>
                <span className="price-value">EGP {formatNumberReadable(monthly_inst)}/شهر</span>
              </div>
            )}
            {annual_payment && (
              <div className="price-row">
                <span className="price-label">دفعة سنويه</span>
                <span className="price-value">EGP {formatNumberReadable(annual_payment)}/سنة</span>
              </div>
            )}
            {show_full_price && price && (
              <div className="price-row">
                <span className="price-label">السعر الكامل</span>
                <span className="price-value">EGP {formatNumberReadable(price)}</span>
              </div>
            )}
            {(payment_years != null || payment_down_pct != null) && (
              <div className="price-plan">
                {payment_down_pct != null && `${payment_down_pct}% down`}
                {payment_down_pct != null && payment_years != null && ' · '}
                {payment_years != null && `${payment_years} years`}
              </div>
            )}
          </div>
        )}

        {!show_price && (
          <div className="price-hidden-notice">
            استعلم عن السعر / Ask for Price
          </div>
        )}
      </div>
    </div>
  );
}
