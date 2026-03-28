import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import './NotFound.css';

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="not-found">
      <div className="not-found-illus">
        <div className="not-found-code">404</div>
      </div>
      <h1 className="not-found-title">{t('notFound.title')}</h1>
      <p className="not-found-message">{t('notFound.message')}</p>
      <div className="not-found-actions">
        <Link to="/" className="not-found-btn not-found-btn-primary">{t('notFound.goHome')}</Link>
        <Link to="/admin" className="not-found-btn not-found-btn-secondary">{t('notFound.admin')}</Link>
      </div>
    </div>
  );
}
