import React from 'react';
import { Star, Clock, MapPin, ChevronRight, Zap, ShoppingBag } from 'lucide-react';

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

  // Calculate dynamic ready time based on prep time
  const prepMinutes = restaurant.prep_time_minutes || 15;
  const readyDate = new Date(Date.now() + prepMinutes * 60000);
  const readyByTime = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Determine distance display
  const displayDistance = calculatedDistance !== undefined && calculatedDistance !== null
    ? `${calculatedDistance} km away`
    : restaurant.distance_km
    ? `${restaurant.distance_km} km away`
    : null;

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
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
          <span style={{
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#38bdf8',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(56, 189, 248, 0.35)'
          }}>
            ⚡ Available on CutTheQueue
          </span>
        </div>

        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 2 }}>
          <span className={`badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
            {isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </span>
        </div>

        {/* Pickup & Queue Badges */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          zIndex: 2
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.82)',
            color: '#a7f3d0',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(6px)'
          }}>
            <ShoppingBag size={12} /> Pickup Available
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.82)',
            color: '#fef08a',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(6px)'
          }}>
            <Zap size={11} /> Low queue • Ready faster
          </div>
        </div>

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

        {/* Pickup & Preparation Callout */}
        <div style={{
          fontSize: '0.78rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          marginBottom: '0.85rem',
          padding: '0.6rem 0.75rem',
          background: 'var(--primary-light)',
          border: '1px solid var(--primary-border)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: 'var(--primary)' }}>
              <Clock size={13} />
              <span>Preparing in ~{prepMinutes} min</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Ready by ~{readyByTime}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
              <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {restaurant.location ? `${restaurant.location} • ${restaurant.address}` : restaurant.address}
              </span>
            </div>
            {displayDistance && (
              <span style={{ flexShrink: 0, fontWeight: 600 }}>
                {displayDistance}
              </span>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {hoursDisplay ? `Open ${hoursDisplay}` : 'Walk-in Counter Pickup'}
          </span>

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
              Pre-Order Now <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
