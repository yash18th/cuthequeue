import React from 'react';
import { Star, Clock, MapPin, ChevronRight, Zap, Award } from 'lucide-react';

export default function RestaurantCard({
  restaurant,
  onSelectRestaurant,
  calculatedDistance
}) {
  const isOpen = restaurant.is_currently_open !== undefined
    ? restaurant.is_currently_open
    : !!restaurant.is_open;

  // Calculate ready time estimate
  const prepMinutes = restaurant.prep_time_minutes || 15;

  // Determine distance display
  const displayDistance = calculatedDistance !== undefined && calculatedDistance !== null
    ? `${calculatedDistance} km away`
    : restaurant.distance_km
    ? `${restaurant.distance_km} km away`
    : null;

  // Queue pill helper
  const renderQueuePill = () => {
    const q = (restaurant.queue_status || 'moderate').toLowerCase();
    const count = restaurant.queue_count || 6;
    if (q === 'low') {
      return (
        <span className="queue-pill queue-pill-low">
          ● Low ({count} orders ahead)
        </span>
      );
    }
    if (q === 'busy') {
      return (
        <span className="queue-pill queue-pill-busy">
          ● Busy ({count} orders ahead)
        </span>
      );
    }
    if (q === 'very_busy') {
      return (
        <span className="queue-pill queue-pill-very-busy">
          ● High Rush ({count} orders ahead)
        </span>
      );
    }
    return (
      <span className="queue-pill queue-pill-moderate">
        ● Moderate ({count} orders ahead)
      </span>
    );
  };

  const displayName = restaurant.brand_name
    ? `${restaurant.brand_name} — ${restaurant.branch_name || restaurant.area || ''}`
    : restaurant.name;

  return (
    <div
      className="heritage-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => onSelectRestaurant(restaurant.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectRestaurant(restaurant.id);
        }
      }}
    >
      {/* Cover Image & Badges */}
      <div style={{ position: 'relative', height: '190px', width: '100%', overflow: 'hidden', background: '#1c1917' }}>
        <img
          src={restaurant.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000'}
          alt={restaurant.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        />

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
          <span style={{
            background: 'rgba(28, 25, 23, 0.88)',
            color: '#fbbf24',
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            ⚡ Pre-Order & Skip Queue
          </span>
        </div>

        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
          <span className={`badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
            {isOpen ? '🟢 Open' : '🔴 Closed'}
          </span>
        </div>

        {/* Bottom Logo & Rating Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '12px',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            background: 'rgba(28, 25, 23, 0.88)',
            color: '#fbbf24',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(6px)'
          }}>
            <Star size={13} fill="#fbbf24" strokeWidth={0} />
            {restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.7'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Brand / Area Title */}
        <div style={{ marginBottom: '0.4rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--accent-brass)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {restaurant.area || 'Bengaluru'}
          </span>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--text-heritage-dark)',
            letterSpacing: '-0.02em',
            margin: '2px 0 0 0'
          }}>
            {displayName}
          </h3>
        </div>

        {/* Cuisine */}
        <p style={{
          fontSize: '0.825rem',
          color: 'var(--text-heritage-secondary)',
          marginBottom: '0.75rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {restaurant.cuisine}
        </p>

        {/* Location & Distance */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          color: 'var(--text-heritage-muted)',
          marginBottom: '1rem'
        }}>
          <MapPin size={13} style={{ color: 'var(--accent-brass)', flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {restaurant.address}
          </span>
          {displayDistance && (
            <span style={{ fontWeight: 700, color: 'var(--text-heritage-dark)', flexShrink: 0 }}>
              • {displayDistance}
            </span>
          )}
        </div>

        {/* Live Queue & Preparation Strip */}
        <div style={{
          marginTop: 'auto',
          padding: '0.7rem 0.85rem',
          background: 'var(--bg-heritage-warm)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          border: '1px solid #e7e5e4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          <div>
            {renderQueuePill()}
          </div>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-heritage-dark)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Clock size={13} style={{ color: 'var(--accent-brass)' }} />
            Ready in ~{prepMinutes} min
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            onSelectRestaurant(restaurant.id);
          }}
          style={{
            width: '100%',
            fontWeight: 700,
            fontSize: '0.88rem',
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
            border: 'none',
            color: 'white',
            boxShadow: '0 2px 6px rgba(180, 83, 9, 0.3)'
          }}
        >
          <span>View Menu & Pre-Order</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
