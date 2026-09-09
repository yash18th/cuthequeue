import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { restaurantAPI } from '../utils/api';
import { Search, Star, Clock, MapPin, CheckCircle2, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function CustomerHome({ setActivePage, setSelectedRestaurantId }) {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const data = await restaurantAPI.getAll({
        search: search.trim() || undefined,
        cuisine: selectedCuisine !== 'All' ? selectedCuisine : undefined,
        open_only: openOnly ? 'true' : undefined
      });
      setRestaurants(data);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [selectedCuisine, openOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRestaurants();
  };

  const cuisines = ['All', 'Burgers', 'Fast Food', 'South Indian', 'Sandwiches', 'Beverages'];

  return (
    <div style={{ padding: '2rem 0 5rem 0' }}>
      <div className="container">
        {/* Personalized Greeting Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={16} /> Campus Dining Hub
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
            {getGreeting()}, {user ? user.name.split(' ')[0] : 'Foodie'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Choose a kitchen, order ahead, and skip the counter lines.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2rem'
        }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search restaurants or food items..."
                style={{ paddingLeft: '40px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {/* Cuisine Pill Tags & Filter toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {cuisines.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selectedCuisine === c ? 'var(--primary)' : 'var(--border-subtle)',
                    background: selectedCuisine === c ? 'var(--primary)' : 'var(--bg-card)',
                    color: selectedCuisine === c ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              Open Now Only
            </label>
          </div>
        </div>

        {/* Restaurants Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Nearby & Available Restaurants
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {restaurants.length} kitchens ready
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="card" style={{ height: '340px', background: 'white', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'white' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                No restaurants matched your filters.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); setSelectedCuisine('All'); setOpenOnly(false); }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem'
            }}>
              {restaurants.map((rest) => (
                <div
                  key={rest.id}
                  className="card card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    opacity: rest.is_open ? 1 : 0.82
                  }}
                  onClick={() => {
                    setSelectedRestaurantId(rest.id);
                    setActivePage('restaurant-menu-view');
                  }}
                >
                  {/* Cover Image + Badges */}
                  <div style={{ position: 'relative', height: '190px', width: '100%', overflow: 'hidden' }}>
                    <img
                      src={rest.cover_image}
                      alt={rest.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                      <span className={`badge ${rest.is_open ? 'badge-open' : 'badge-closed'}`}>
                        {rest.is_open ? '🟢 Open' : '🔴 Currently Closed'}
                      </span>
                    </div>
                    {rest.distance_km && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backdropFilter: 'blur(4px)'
                      }}>
                        <MapPin size={12} /> {rest.distance_km} km away
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {rest.name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#fef3c7',
                        color: '#b45309',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        <Star size={12} fill="#b45309" strokeWidth={0} />
                        {rest.rating || 4.5}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 500 }}>
                      {rest.cuisine}
                    </p>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1rem', flex: 1 }}>
                      {rest.description}
                    </p>

                    {/* Metadata Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        <Clock size={16} style={{ color: 'var(--primary)' }} />
                        <span>{rest.prep_time_minutes || 15}–{(rest.prep_time_minutes || 15) + 5} min</span>
                      </div>

                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRestaurantId(rest.id);
                          setActivePage('restaurant-menu-view');
                        }}
                      >
                        View Menu <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
