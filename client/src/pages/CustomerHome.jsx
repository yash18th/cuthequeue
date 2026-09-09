import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { restaurantAPI } from '../utils/api';
import RestaurantCard from '../components/RestaurantCard';
import BrandCard from '../components/BrandCard';
import {
  Search,
  Sparkles,
  Navigation,
  RefreshCw,
  AlertCircle,
  X,
  MapPin,
  Clock,
  Award,
  Utensils
} from 'lucide-react';

export default function CustomerHome({ setActivePage, setSelectedRestaurantId }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data states
  const [brands, setBrands] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('brands'); // 'brands' | 'branches'

  // Geolocation state
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationMessage, setLocationMessage] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Load brands and branches
  const loadDiscoveryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandsRes, restRes] = await Promise.all([
        restaurantAPI.getBrands().catch(() => ({ brands: [] })),
        restaurantAPI.getAll({
          search: debouncedSearch || undefined,
          area: selectedArea !== 'All' ? selectedArea : undefined,
          brand: selectedBrandFilter !== 'All' ? selectedBrandFilter : undefined,
          open_only: openOnly ? 'true' : undefined,
          lat: userCoords?.latitude,
          lng: userCoords?.longitude
        })
      ]);

      setBrands(brandsRes.brands || []);
      const branchList = Array.isArray(restRes) ? restRes : (restRes?.restaurants || []);
      setRestaurants(branchList);
    } catch (err) {
      console.error('Failed to load Bengaluru restaurant discovery:', err);
      setError(err.message || 'Unable to load Bengaluru restaurants');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedArea, selectedBrandFilter, openOnly, userCoords]);

  useEffect(() => {
    loadDiscoveryData();
  }, [loadDiscoveryData]);

  // Geolocation handling
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('requesting');
    setLocationMessage('Locating nearest Bengaluru branches...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        setLocationStatus('granted');
        setLocationMessage('Showing restaurants sorted by proximity to you.');
        setTimeout(() => setLocationMessage(''), 4000);
      },
      () => {
        setLocationStatus('denied');
        setLocationMessage('Location permission denied. Showing all Bengaluru branches.');
        setTimeout(() => setLocationMessage(''), 4000);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedArea('All');
    setSelectedBrandFilter('All');
    setOpenOnly(false);
  };

  const areas = [
    'All',
    'Indiranagar',
    'Koramangala',
    'Jayanagar',
    'Church Street',
    'Whitefield',
    'Marathahalli',
    'JP Nagar',
    'Rajajinagar',
    'Kammanahalli',
    'Residency Road'
  ];

  const hasActiveFilters = Boolean(search.trim() || selectedArea !== 'All' || selectedBrandFilter !== 'All' || openOnly);

  return (
    <div className="bg-warm-canvas" style={{ minHeight: '90vh', padding: '3rem 0 6rem 0' }}>
      <div className="container">
        {/* ========================================================= */}
        {/* HERO SECTION WITH ROYAL SOUTH INDIAN AESTHETICS          */}
        {/* ========================================================= */}
        <div style={{
          textAlign: 'center',
          maxWidth: '820px',
          margin: '0 auto 2.5rem auto'
        }}>
          {/* Subtle Heritage Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.4rem 1rem',
            background: '#FEF6EC',
            border: '1px solid #E8DDC8',
            borderRadius: '4px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent-gold-muted)',
            fontFamily: 'var(--font-serif)',
            marginBottom: '1rem'
          }}>
            <Award size={15} style={{ color: 'var(--accent-gold)' }} />
            <span>Bengaluru's Authentic Culinary Institutions • Zero Waiting</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            lineHeight: 1.15,
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.01em',
            fontWeight: 800
          }}>
            Discover Bengaluru's Favourite Restaurants
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '640px',
            margin: '0 auto'
          }}>
            Pre-order ahead from legendary dining institutions across the city. Arrive to a table that's already waiting and collect hot with zero queue wait.
          </p>

          <div className="heritage-ornament">
            <span style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>✦ ✦ ✦</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SEARCH, LOCALITY SELECTOR, AND GEOLOCATION BAR          */}
        {/* ========================================================= */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-heritage)',
          border: '1px solid var(--border-heritage)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
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
                placeholder="Search brand (Rameshwaram, Empire, Meghana) or locality (Indiranagar)..."
                style={{
                  width: '100%',
                  paddingLeft: '42px',
                  paddingRight: search ? '36px' : '14px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-heritage)',
                  background: 'var(--bg-heritage)'
                }}
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
              className={`btn btn-sm ${locationStatus === 'granted' ? 'btn-gold' : 'btn-forest'}`}
              onClick={handleRequestLocation}
              disabled={locationStatus === 'requesting'}
              title="Locate nearest branches"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '44px',
                padding: '0 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700
              }}
            >
              <Navigation
                size={15}
                style={{
                  transform: locationStatus === 'requesting' ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.3s ease',
                  color: locationStatus === 'granted' ? '#0B2923' : '#C6A15B'
                }}
              />
              <span>
                {locationStatus === 'requesting'
                  ? 'Locating...'
                  : locationStatus === 'granted'
                  ? 'Nearby Active'
                  : 'Find Nearby'}
              </span>
            </button>
          </div>

          {/* Location status message */}
          {locationMessage && (
            <div style={{
              fontSize: '0.825rem',
              color: 'var(--bg-deep-green)',
              marginBottom: '0.85rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: '#F0E6D2',
              border: '1px solid #E8DDC8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{locationMessage}</span>
              <button
                type="button"
                onClick={() => setLocationMessage('')}
                style={{ color: 'inherit', padding: '2px', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Area / Locality Filter Pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #E8DDC8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px', fontFamily: 'var(--font-serif)' }}>
                Area:
              </span>
              {areas.map((area) => {
                const isSelected = selectedArea === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedArea(area)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-gold)' : '#E8DDC8',
                      background: isSelected ? 'var(--bg-deep-green)' : 'white',
                      color: isSelected ? '#F7F1E5' : 'var(--text-charcoal)',
                      boxShadow: isSelected ? '0 2px 8px rgba(18, 60, 50, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer'
                    }}
                  >
                    {area}
                  </button>
                );
              })}
            </div>

            {/* Open Now Only Toggle */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 700,
              color: 'var(--text-charcoal)',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--bg-deep-green)',
                  cursor: 'pointer'
                }}
              />
              <span>Open Kitchens Only</span>
            </label>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW SELECTOR: ICONIC BRANDS VS ALL BENGALURU BRANCHES   */}
        {/* ========================================================= */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'inline-flex',
            background: '#EDE4D4',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #D9CBBA',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('brands')}
              style={{
                padding: '0.55rem 1.4rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: 700,
                border: 'none',
                background: activeTab === 'brands' ? 'var(--bg-deep-green)' : 'transparent',
                color: activeTab === 'brands' ? '#F7F1E5' : 'var(--text-charcoal)',
                boxShadow: activeTab === 'brands' ? '0 2px 6px rgba(18, 60, 50, 0.2)' : 'none',
                fontFamily: 'var(--font-serif)',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
            >
              Iconic Restaurant Brands ({brands.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('branches')}
              style={{
                padding: '0.55rem 1.4rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: 700,
                border: 'none',
                background: activeTab === 'branches' ? 'var(--bg-deep-green)' : 'transparent',
                color: activeTab === 'branches' ? '#F7F1E5' : 'var(--text-charcoal)',
                boxShadow: activeTab === 'branches' ? '0 2px 6px rgba(18, 60, 50, 0.2)' : 'none',
                fontFamily: 'var(--font-serif)',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
            >
              All Bengaluru Branches ({restaurants.length})
            </button>
          </div>

          {/* Active Filter Clear Info */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--accent-maroon)',
                background: 'none',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} /> Clear all filters
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* LOADING & ERROR STATES                                   */}
        {/* ========================================================= */}
        {loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.75rem'
          }}>
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="heritage-card"
                style={{ height: '380px', background: '#E8DDC8', position: 'relative' }}
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid #E8DDC8',
            maxWidth: '500px',
            margin: '2rem auto',
            boxShadow: 'var(--shadow-heritage)'
          }}>
            <AlertCircle size={44} style={{ color: 'var(--accent-maroon)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-charcoal)' }}>
              Unable to load Bengaluru restaurants
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {error}
            </p>
            <button type="button" className="btn btn-forest" onClick={loadDiscoveryData}>
              <RefreshCw size={15} /> Try Again
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: ICONIC BRANDS SHOWCASE                            */}
        {/* ========================================================= */}
        {!loading && !error && activeTab === 'brands' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.75rem'
            }}>
              {brands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>

            {/* Quick Helper Strip */}
            <div style={{
              marginTop: '3.5rem',
              padding: '1.75rem 2rem',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #E8DDC8',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0, fontFamily: 'var(--font-serif)' }}>
                  Looking for a specific branch near you?
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Browse all 14 individual branches across Indiranagar, Koramangala, Church St, Jayanagar & Whitefield.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('branches')}
                className="btn btn-sm btn-forest"
                style={{ fontWeight: 700, padding: '0.65rem 1.4rem' }}
              >
                View All Bengaluru Branches
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ALL BENGALURU BRANCHES GRID                       */}
        {/* ========================================================= */}
        {!loading && !error && activeTab === 'branches' && (
          <div>
            {restaurants.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '4rem 2rem',
                textAlign: 'center',
                border: '1px solid #E8DDC8',
                maxWidth: '560px',
                margin: '2rem auto'
              }}>
                <Utensils size={40} style={{ color: 'var(--accent-gold)', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
                  No branches found matching "{search || selectedArea}"
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Try searching another Bengaluru locality or clear your active filters.
                </p>
                <button
                  type="button"
                  className="btn btn-forest"
                  onClick={handleClearFilters}
                >
                  Clear Search & Filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1.75rem'
              }}>
                {restaurants.map((rest) => (
                  <RestaurantCard
                    key={rest.id}
                    restaurant={rest}
                    calculatedDistance={rest.calculatedDistance}
                    onSelectRestaurant={(id) => {
                      setSelectedRestaurantId?.(id);
                      setActivePage?.('restaurant-menu-view');
                      const brandParam = rest.brand_slug || rest.brand_id || 'brand';
                      navigate(`/restaurants/${brandParam}/branches/${id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
