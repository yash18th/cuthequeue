import React from 'react';

/**
 * Tasteful South Indian Ornamental Divider
 * Features a subtle traditional brass / floral geometric motif flanked by gold hairline gradients.
 */
export default function HeritageDivider({ label, style = {} }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        margin: '2rem 0',
        width: '100%',
        ...style
      }}
      role="separator"
      aria-hidden="true"
    >
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(198, 161, 91, 0.45) 80%, rgba(198, 161, 91, 0.7) 100%)',
          maxWidth: '160px'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Subtle Brass / Temple Geometry Motif */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
            fill="#C6A15B"
            fillOpacity="0.85"
          />
          <circle cx="12" cy="12" r="2.5" fill="#123C32" />
        </svg>

        {label && (
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent-gold-muted)'
            }}
          >
            {label}
          </span>
        )}

        {label && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill="#C6A15B"
              fillOpacity="0.85"
            />
            <circle cx="12" cy="12" r="2.5" fill="#123C32" />
          </svg>
        )}
      </div>

      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(90deg, rgba(198, 161, 91, 0.7) 0%, rgba(198, 161, 91, 0.45) 20%, transparent 100%)',
          maxWidth: '160px'
        }}
      />
    </div>
  );
}
