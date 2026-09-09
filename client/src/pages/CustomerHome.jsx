import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { restaurantAPI } from '../utils/api';
import RestaurantCard from '../components/RestaurantCard';
import {
  Search,
  Sparkles,
  Navigation,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';

// Distance calculation using Haversine formula (km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function CustomerHome({ setActivePage, setSelectedRestaurantId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);

  // Geolocation state
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
  const [locationMessage, setLocationMessage] = useState('');

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Debounce search input for instant live search without page reloads
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Load restaurants from backend API
  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantAPI.getAll({
        search: debouncedSearch || undefined,
        cuisine: selectedCuisine !== 'All' ? selectedCuisine : undefined,
        open_only: openOnly ? 'true' : undefined,
        lat: userCoords?.latitude,
        lng: userCoords?.longitude
      });
      const list = Array.isArray(data) ? data : (data?.restaurants || []);
      setRestaurants(list);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
      setError(err.message || 'Unable to load restaurants');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCuisine, openOnly, userCoords]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // Handle Geolocation request
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('requesting');
    setLocationMessage('Getting your current location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        setLocationStatus('granted');
        setLocationMessage('Location enabled. Showing nearest kitchens first.');
      },
      (geoError) => {
        console.warn('Geolocation access denied or unavailable:', geoError.message);
        setLocationStatus('denied');
        setLocationMessage('Location permission was not granted. Showing all available restaurants.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Process sorting with coordinates if available in database, otherwise fallback gracefully
  const hasCoordinatesInDB = restaurants.some(
    (r) => r.latitude !== undefined && r.latitude !== null && r.longitude !== undefined && r.longitude !== null
  );

  let processedRestaurants = [...restaurants];

  if (userCoords && hasCoordinatesInDB) {
    processedRestaurants = processedRestaurants.map((r) => {
      if (r.latitude && r.longitude) {
        const dist = calculateDistance(userCoords.latitude, userCoords.longitude, r.latitude, r.longitude);
        return { ...r, calculatedDistance: dist };
      }
      return { ...r, calculatedDistance: null };
    });
  }

  // Sort by: 1. Availability (open first), 2. Preparation time (fastest kitchen first), 3. Distance
  processedRestaurants.sort((a, b) => {
    const aOpen = a.is_currently_open !== undefined ? (a.is_currently_open ? 1 : 0) : (a.is_open ? 1 : 0);
    const bOpen = b.is_currently_open !== undefined ? (b.is_currently_open ? 1 : 0) : (b.is_open ? 1 : 0);
    if (aOpen !== bOpen) return bOpen - aOpen;

    const aPrep = a.prep_time_minutes || 15;
    const bPrep = b.prep_time_minutes || 15;
    if (aPrep !== bPrep) return aPrep - bPrep;

    const aDist = a.calculatedDistance !== null && a.calculatedDistance !== undefined ? a.calculatedDistance : (a.distance_km || 999);
    const bDist = b.calculatedDistance !== null && b.calculatedDistance !== undefined ? b.calculatedDistance : (b.distance_km || 999);
    return aDist - bDist;
  });

  // Section title dynamically adjusts based on location state and DB schema
  const getSectionTitle = () => {
    if (locationStatus === 'granted' && hasCoordinatesInDB) {
      return 'Nearest Kitchens for Pickup';
    }
    if (locationStatus === 'granted' && !hasCoordinatesInDB) {
      return 'Available Kitchens for Pickup';
    }
    return 'Nearby & Available Kitchens';
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCuisine('All');
    setOpenOnly(false);
  };

  const hasActiveFilters = Boolean(search.trim() || selectedCuisine !== 'All' || openOnly);

  const cuisines = ['All', 'Cafe', 'South Indian', 'Burgers', 'Pizza', 'Indian', 'Fast Food', 'Beverages'];

  return (
    <div style={{ padding: '2rem 0 5rem 0' }}>
      <div className="container">
        {/* Personalized Greeting Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Sparkles size={16} /> Campus Dining Hub
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginTop: '0.2rem'
          }}>
            {getGreeting()}, {user ? user.name.split(' ')[0] : 'Foodie'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Order before you arrive. The kitchen prepares your food while you travel so you skip the line.
          </p>
        </div>

        {/* Search & Filter Control Bar */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2rem'
        }}>
          {/* Search Input Box */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Search restaurants or food items..."
                style={{ paddingLeft: '40px', paddingRight: search ? '36px' : '14px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    padding: '4px'
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Geolocation Button */}
            <button
              type="button"
              className={`btn btn-sm ${locationStatus === 'granted' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleRequestLocation}
              disabled={locationStatus === 'requesting'}
              title="Locate nearest restaurants"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Navigation
                size={15}
                style={{
                  transform: locationStatus === 'requesting' ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.3s ease'
                }}
              />
              <span className="desktop-links">
                {locationStatus === 'requesting'
                  ? 'Locating...'
                  : locationStatus === 'granted'
                  ? 'Location Active'
                  : 'Use my location'}
              </span>
            </button>
          </div>

          {/* Location status feedback message if present */}
          {locationMessage && (
            <div style={{
              fontSize: '0.8rem',
              color: locationStatus === 'denied' ? 'var(--accent-amber)' : 'var(--primary)',
              marginBottom: '0.85rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: locationStatus === 'denied' ? 'var(--accent-amber-light)' : 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{locationMessage}</span>
              <button
                type="button"
                onClick={() => setLocationMessage('')}
                style={{ color: 'inherit', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Cuisine Pill Tags & Filter Toggles */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            {/* Category Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {cuisines.map((c) => (
                <button
                  key={c}
                  type="button"
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
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Open Now Only Toggle */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer'
                }}
              />
              Open Now Only
            </label>
          </div>
        </div>

        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {getSectionTitle()}
          </h2>
          {!loading && !error && (
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {processedRestaurants.length} {processedRestaurants.length === 1 ? 'restaurant' : 'restaurants'} ready for pre-order
            </span>
          )}
        </div>

        {/* Loading State: Finding restaurants... with skeleton cards */}
        {loading && (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--primary)',
              fontWeight: 600,
              fontSize: '0.95rem',
              marginBottom: '1.25rem'
            }}>
              <RefreshCw size={16} className="spin" /> Finding restaurants...
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem'
            }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="card"
                  style={{
                    background: 'white',
                    height: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    height: '180px',
                    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeletonPulse 1.5s infinite ease-in-out'
                  }} />
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ height: '22px', width: '60%', background: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ height: '14px', width: '40%', background: '#f1f5f9', borderRadius: '4px' }} />
                    <div style={{ height: '14px', width: '90%', background: '#f1f5f9', borderRadius: '4px' }} />
                    <div style={{ height: '14px', width: '75%', background: '#f1f5f9', borderRadius: '4px' }} />
                    <div style={{ marginTop: 'auto', height: '36px', background: '#f1f5f9', borderRadius: '8px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State: Unable to load restaurants with Try Again button */}
        {!loading && error && (
          <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'white' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--accent-rose-light)',
              color: 'var(--accent-rose)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Unable to load restaurants
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              We could not connect to the kitchen servers. Please check your network connection and try again.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={loadRestaurants}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        )}

        {/* Empty Filter State vs Empty Database State */}
        {!loading && !error && processedRestaurants.length === 0 && (
          <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {debouncedSearch
                ? `No restaurants found for "${debouncedSearch}".`
                : hasActiveFilters
                ? 'No restaurants match your filters.'
                : 'No restaurants available right now.'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              {debouncedSearch
                ? 'Try another restaurant name, cuisine, or area (e.g., "Indiranagar", "cafe", "dosa", "pizza", "burger").'
                : hasActiveFilters
                ? 'Try clearing your cuisine filter or unchecking "Open Now Only".'
                : 'There are currently no active restaurants available. Please check back shortly.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Restaurant Cards Responsive Grid */}
        {!loading && !error && processedRestaurants.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem'
          }}>
            {processedRestaurants.map((rest) => (
              <RestaurantCard
                key={rest.id}
                restaurant={rest}
                calculatedDistance={rest.calculatedDistance}
                onSelectRestaurant={(id) => {
                  setSelectedRestaurantId?.(id);
                  setActivePage?.('restaurant-menu-view');
                  navigate(`/restaurant/${id}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
