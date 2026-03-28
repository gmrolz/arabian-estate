import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import HeroSection from '../components/HeroSection';
import CitiesSection from '../components/CitiesSection';
import BestChoices from '../components/BestChoices';
import PlaceholderSections from '../components/PlaceholderSections';

export default function HomePage() {
    const { t, lp } = useLocale();
    const brandName = t('brandName');
    const brandParts = brandName.split(' ');
    return (
        <>
            <HeroSection />
            <CitiesSection />
            <BestChoices />
            <PlaceholderSections />

            <footer className="footer">
                <div className="footer-logo">{brandParts.length >= 2 ? <>{brandParts[0]} <span>{brandParts.slice(1).join(' ')}</span></> : brandName}</div>
                <p className="footer-tagline">{t('footer.tagline')}</p>
                <div className="footer-links">
                    <Link to={lp('/')}>{t('footer.home')}</Link>
                    <Link to={lp('/listings')}>{t('footer.listings')}</Link>
                    <Link to={lp('/east-cairo')}>{t('location.eastCairo')}</Link>
                    <a href="#about">{t('footer.about')}</a>
                    <a href="#contact">{t('footer.contact')}</a>
                    <Link to="/admin">{t('footer.admin')}</Link>
                </div>
                <p className="footer-copy">{t('footer.copyFull')}</p>
                <p className="footer-credit">{t('footer.madeBy')}<a href="https://wemake.deals" target="_blank" rel="noopener noreferrer">{t('footer.dealMaker')}</a></p>
                <p className="footer-version">{t('footer.version')}</p>
            </footer>
        </>
    );
}
