import { Link } from 'react-router-dom';

/**
 * Breadcrumb item: { label, path } — path null/undefined = current page (no link)
 */
export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <div className="container">
        <ol className="breadcrumbs-list">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={i} className="breadcrumbs-item">
                {!isLast && item.path != null ? (
                  <>
                    <Link to={item.path} className="breadcrumbs-link">
                      {item.label}
                    </Link>
                    <span className="breadcrumbs-sep" aria-hidden="true">›</span>
                  </>
                ) : (
                  <span className="breadcrumbs-current" aria-current="page">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
