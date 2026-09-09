import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({
  label = 'Back',
  fallbackPath = '/restaurants',
  style = {},
  className = ''
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
    <button
      type="button"
      onClick={handleBack}
      className={`btn btn-sm btn-secondary ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.84rem',
        fontWeight: 600,
        padding: '0.45rem 0.9rem',
        borderRadius: 'var(--radius-md)',
        background: 'white',
        border: '1px solid var(--border-heritage)',
        color: 'var(--text-heritage-dark)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.15s ease',
        ...style
      }}
      aria-label={label}
    >
      <ArrowLeft size={15} style={{ color: 'var(--accent-brass)' }} />
      <span>{label}</span>
    </button>
  );
}
