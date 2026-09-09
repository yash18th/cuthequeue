import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function PageNavHeader({
  title,
  backLabel = 'Back',
  fallbackPath = '/',
  breadcrumbs = [],
  extraAction = null,
  style = {}
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem', ...style }}>
      {/* Contextual Breadcrumb Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ marginBottom: '0.75rem' }}>
          <ol style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '0.825rem',
            color: 'var(--text-muted)'
          }}>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <li style={{ display: 'flex', alignItems: 'center' }}>
                      <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                    </li>
                  )}
                  <li>
                    {isLast || !crumb.path ? (
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        to={crumb.path}
                        style={{
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          fontWeight: 500,
                          transition: 'color 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Back Button & Title / Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleBack}
          className="btn btn-sm btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.825rem',
            fontWeight: 600,
            padding: '0.45rem 0.85rem'
          }}
          aria-label={backLabel}
        >
          <ArrowLeft size={15} />
          <span>{backLabel}</span>
        </button>

        {extraAction && (
          <div>
            {extraAction}
          </div>
        )}
      </div>

      {title && (
        <h1 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginTop: '1rem',
          color: 'var(--text-primary)'
        }}>
          {title}
        </h1>
      )}
    </div>
  );
}
