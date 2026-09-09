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
    <div style={{ background: 'var(--bg-heritage)', minHeight: '90vh', padding: '2.5rem 0 6rem 0' }}>
      <div className="container">
        {/* ========================================================= */}
        {/* HERO SECTION WITH HERITAGE & MODERN LUXURY AESTHETICS   */}
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
            background: 'var(--accent-gold-light)',
            border: '1px solid var(--accent-gold-border)',
            borderRadius: '9999px',
            fontSize: '0.825rem',
            fontWeight: 700,
            color: 'var(--accent-brass)',
            marginBottom: '1rem'
          }}>
            <Award size={15} />
            <span>Bengaluru's Authentic Culinary Institutions • Zero Waiting</span>
          </div>

          <h1 className="heritage-heading" style={{
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            lineHeight: 1.15,
            marginBottom: '0.75rem',
            color: 'var(--text-heritage-dark)'
          }}>
            Discover Bengaluru's Favourite Restaurants
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-heritage-secondary)',
            lineHeight: 1.6,
            maxWidth: '620px',
            margin: '0 auto'
          }}>
            Choose a restaurant near you, pre-order your meal, and skip the queue.
          </p>

          <div className="heritage-ornament">
            <span style={{ color: 'var(--accent-brass)', fontSize: '0.8rem' }}>✦ ✦ ✦</span>
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
              className={`btn btn-sm ${locationStatus === 'granted' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleRequestLocation}
              disabled={locationStatus === 'requesting'}
              title="Locate nearest branches"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '44px',
                padding: '0 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700
              }}
            >
              <Navigation
                size={15}
                style={{
                  transform: locationStatus === 'requesting' ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.3s ease',
                  color: locationStatus === 'granted' ? 'white' : 'var(--accent-brass)'
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
              color: 'var(--accent-brass)',
              marginBottom: '0.85rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gold-light)',
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

          {/* Area / Locality Filter Pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #f5f0e8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-heritage-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                Area:
              </span>
              {areas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setSelectedArea(area)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: selectedArea === area ? 'var(--accent-brass)' : 'var(--border-heritage)',
                    background: selectedArea === area ? 'var(--accent-brass)' : 'white',
                    color: selectedArea === area ? 'white' : 'var(--text-heritage-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {area}
                </button>
              ))}
            </div>

            {/* Open Now Only Toggle */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 700,
              color: 'var(--text-heritage-dark)',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#b45309',
                  cursor: 'pointer'
                }}
              />
              <span>Open Now Only</span>
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
            background: 'white',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-heritage)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('brands')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 700,
                border: 'none',
                background: activeTab === 'brands' ? 'var(--accent-brass)' : 'transparent',
                color: activeTab === 'brands' ? 'white' : 'var(--text-heritage-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              Iconic Restaurant Brands ({brands.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('branches')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 700,
                border: 'none',
                background: activeTab === 'branches' ? 'var(--accent-brass)' : 'transparent',
                color: activeTab === 'branches' ? 'white' : 'var(--text-heritage-secondary)',
                transition: 'all 0.15s ease'
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
                color: 'var(--accent-terracotta)',
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
                style={{ height: '380px', background: '#f5f0e8', position: 'relative' }}
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid var(--border-heritage)',
            maxWidth: '500px',
            margin: '2rem auto'
          }}>
            <AlertCircle size={44} style={{ color: 'var(--accent-terracotta)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Unable to load Bengaluru restaurants
            </h3>
            <p style={{ color: 'var(--text-heritage-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {error}
            </p>
            <button type="button" className="btn btn-primary" onClick={loadDiscoveryData}>
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
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-heritage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-heritage-dark)', margin: 0 }}>
                  Looking for a specific branch near you?
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-heritage-secondary)', margin: '2px 0 0 0' }}>
                  Browse all 14 individual branches across Indiranagar, Koramangala, Church St, Jayanagar & Whitefield.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('branches')}
                className="btn btn-sm btn-secondary"
                style={{ fontWeight: 700, padding: '0.6rem 1.2rem', borderColor: 'var(--accent-brass)', color: 'var(--accent-brass)' }}
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
                borderRadius: 'var(--radius-xl)',
                padding: '4rem 2rem',
                textAlign: 'center',
                border: '1px solid var(--border-heritage)',
                maxWidth: '560px',
                margin: '2rem auto'
              }}>
                <Utensils size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-heritage-dark)' }}>
                  No branches found matching "{search || selectedArea}"
                </h3>
                <p style={{ color: 'var(--text-heritage-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Try searching another Bengaluru locality or clear your active filters.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleClearFilters}
                  style={{ background: 'var(--accent-brass)', border: 'none' }}
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
