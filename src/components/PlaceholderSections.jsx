import { useLocale } from '../context/LocaleContext';

export default function PlaceholderSections() {
    const { t } = useLocale();
    const services = [
        { titleKey: 'services.offPlan', descKey: 'services.offPlanDesc' },
        { titleKey: 'services.readyToMove', descKey: 'services.readyToMoveDesc' },
        { titleKey: 'services.investment', descKey: 'services.investmentDesc' },
        { titleKey: 'services.developerPartnerships', descKey: 'services.developerPartnershipsDesc' },
        { titleKey: 'services.flexiblePayments', descKey: 'services.flexiblePaymentsDesc' },
        { titleKey: 'services.locationExpertise', descKey: 'services.locationExpertiseDesc' },
    ];
    const whyStats = [
        { num: '54 km²', labelKey: 'why.totalArea' },
        { num: '6.5M+', labelKey: 'why.futureResidents' },
        { num: '21', labelKey: 'why.residentialDistricts' },
        { num: '2025+', labelKey: 'why.deliveryPhase' },
    ];

    return (
        <>
            <section className="placeholder-section" id="about">
                <div className="container">
                    <div className="section-tag">{t('services.tag')}</div>
                    <h2 className="section-title">
                        {t('services.title')}<br />{t('services.titleSpan')}
                    </h2>
                    <p className="section-sub">{t('services.sub')}</p>
                    <div className="placeholder-grid">
                        {services.map((s, i) => (
                            <div className="placeholder-card" key={i}>
                                <h3>{t(s.titleKey)}</h3>
                                <p>{t(s.descKey)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="placeholder-section" id="why">
                <div className="container">
                    <div className="section-tag">{t('why.tag')}</div>
                    <h2 className="section-title">
                        {t('why.title')}<br /><span>{t('why.titleSuffix')}</span>
                    </h2>
                    <p className="section-sub">{t('why.sub')}</p>
                    <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        {whyStats.map((item, i) => (
                            <div key={i} className="placeholder-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--gold)', marginBottom: '8px' }}>{item.num}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t(item.labelKey)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta-section" id="contact">
                <div className="container">
                    <div className="section-tag">{t('cta.tag')}</div>
                    <h2 className="section-title" style={{ textAlign: 'center' }}>
                        {t('cta.title')}<br /><span>{t('cta.titleSpan')}</span>
                    </h2>
                    <p className="section-sub" style={{ textAlign: 'center', margin: '0 auto 36px' }}>
                        {t('cta.sub')}
                    </p>
                    <div className="cta-actions">
                        <a
                            href="https://wa.me/201226662193?text=Hello%2C%20I%27m%20interested%20in%20Arabian%20Estate%20listings"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            {t('cta.whatsapp')}
                        </a>
                        <a href="tel:+201226662193" className="btn-secondary">{t('cta.callUs')}</a>
                    </div>
                </div>
            </section>
        </>
    );
}
