import React from 'react';
import { Star, Clock, MapPin, ChevronRight } from 'lucide-react';

export default function RestaurantCard({
  restaurant,
  onSelectRestaurant,
  calculatedDistance
}) {
  const isOpen = restaurant.is_currently_open !== undefined
    ? restaurant.is_currently_open
    : !!restaurant.is_open;

  // Format hours cleanly (e.g., "08:30 – 23:00")
  const hoursDisplay = restaurant.opening_time && restaurant.closing_time
    ? `${restaurant.opening_time} – ${restaurant.closing_time}`
    : null;

  // Determine distance display: use calculated distance from geolocation if provided, otherwise distance_km if available
  const displayDistance = calculatedDistance !== undefined && calculatedDistance !== null
    ? `${calculatedDistance} km away`
    : restaurant.distance_km
    ? `${restaurant.distance_km} km away`
    : null;

  const minOrderText = restaurant.min_order_amount > 0
    ? `Min ₹${restaurant.min_order_amount}`
    : 'No min order';

  const prepTimeText = `${restaurant.prep_time_minutes || 15}–${(restaurant.prep_time_minutes || 15) + 5} min`;

  return (
    <div
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        background: 'white',
        opacity: isOpen ? 1 : 0.88,
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
      <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden', background: '#0f172a' }}>
        <img
          src={restaurant.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000'}
          alt={restaurant.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 2 }}>
          <span className={`badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
            {isOpen ? '🟢 Open Now' : '🔴 Closed'}
          </span>
        </div>

        {/* Distance Badge */}
        {displayDistance && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.78)',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(6px)',
            zIndex: 2
          }}>
            <MapPin size={12} /> {displayDistance}
          </div>
        )}

        {/* Floating Restaurant Logo Thumbnail */}
        {restaurant.logo && (
          <div style={{
            position: 'absolute',
            bottom: '-16px',
            right: '16px',
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            border: '2px solid white',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
            background: 'white',
            zIndex: 3
          }}>
            <img
              src={restaurant.logo}
              alt={`${restaurant.name} logo`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      {/* Body Information */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Title & Rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '0.35rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {restaurant.name}
          </h3>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: '#fef3c7',
            color: '#b45309',
            padding: '2px 7px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 700,
            flexShrink: 0
          }}>
            <Star size={12} fill="#b45309" strokeWidth={0} />
            {restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.5'}
          </div>
        </div>

        {/* Cuisine */}
        <p style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.4rem' }}>
          {restaurant.cuisine}
        </p>

        {/* Short Description */}
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          marginBottom: '0.85rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {restaurant.description}
        </p>

        {/* Address and Hours Info */}
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginBottom: '0.85rem',
          padding: '0.5rem 0.65rem',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {restaurant.address}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
            {hoursDisplay && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                <span>Hours: {hoursDisplay}</span>
              </div>
            )}
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {minOrderText}
            </span>
          </div>
        </div>

        {/* Metadata & Actions Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          gap: '0.5rem'
        }}>
          {/* Prep Time Estimate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Clock size={15} style={{ color: 'var(--primary)' }} />
            <span>{prepTimeText}</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRestaurant(restaurant.id);
              }}
            >
              View Menu
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRestaurant(restaurant.id);
              }}
            >
              Order Now <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
