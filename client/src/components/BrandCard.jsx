import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ChevronRight, Award, Utensils } from 'lucide-react';

export default function BrandCard({ brand }) {
  const navigate = useNavigate();

  const handleOpenBrand = () => {
    navigate(`/restaurants/${brand.slug || brand.id}`);
  };

  return (
    <div
      className="heritage-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={handleOpenBrand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenBrand();
        }
      }}
    >
      {/* Cover Image & Heritage Badge */}
      <div style={{ position: 'relative', height: '210px', width: '100%', overflow: 'hidden', background: '#1c1917' }}>
        <img
          src={brand.cover_image || 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1000'}
          alt={brand.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        />

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 2 }}>
          <span className="heritage-badge badge-gold" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <Award size={13} style={{ color: 'var(--accent-brass)' }} />
            <span>Bengaluru Icon {brand.heritage_since ? `• Est. ${brand.heritage_since}` : ''}</span>
          </span>
        </div>

        <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 2 }}>
          <span style={{
            background: 'rgba(28, 25, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#fbbf24',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <Star size={13} fill="#fbbf24" strokeWidth={0} />
            <span>{brand.rating ? Number(brand.rating).toFixed(1) : '4.8'}</span>
          </span>
        </div>

        {/* Floating Brand Logo in circle */}
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#FFFFFF',
          padding: '3px',
          boxShadow: '0 4px 14px rgba(11, 41, 35, 0.25)',
          border: '2px solid #C6A15B',
          zIndex: 3,
          overflow: 'hidden'
        }}>
          <img
            src={brand.logo || brand.cover_image}
            alt={`${brand.name} logo`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        </div>
      </div>

      {/* Brand Information */}
      <div style={{ padding: '1.6rem 1.4rem 1.4rem 1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-charcoal)',
            letterSpacing: '0.01em',
            margin: 0
          }}>
            {brand.name}
          </h2>
        </div>

        <p style={{
          fontSize: '0.825rem',
          color: 'var(--accent-gold-muted)',
          fontWeight: 700,
          marginBottom: '0.6rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {brand.cuisine}
        </p>

        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '1rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {brand.tagline || brand.description}
        </p>

        {/* Localities / Branches strip */}
        <div style={{
          marginTop: 'auto',
          padding: '0.75rem 0.9rem',
          background: 'var(--bg-sand-light)',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-charcoal)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} style={{ color: 'var(--accent-gold)' }} />
              {brand.branch_count || (brand.branches ? brand.branches.length : 0)} Bengaluru Branches
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--bg-deep-green)', fontWeight: 700 }}>
              Pre-Order Available
            </span>
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {brand.areas && brand.areas.length > 0
              ? brand.areas.join(' • ')
              : 'Indiranagar • Koramangala • Jayanagar • Whitefield'}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenBrand();
          }}
          className="btn btn-forest"
          style={{
            width: '100%',
            fontWeight: 700,
            fontSize: '0.88rem',
            padding: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>Choose Branch & Pre-Order</span>
          <ChevronRight size={16} style={{ color: 'var(--accent-gold)' }} />
        </button>
      </div>
    </div>
  );
}
