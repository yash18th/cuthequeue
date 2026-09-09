import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI, restaurantAPI } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import RestaurantCard from '../components/RestaurantCard';
import {
  RotateCcw,
  ChevronRight,
  ShoppingBag,
  Search,
  Navigation,
  RefreshCw,
  X,
  AlertCircle,
  UtensilsCrossed,
  ClipboardList
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

export default function OrderHistoryPage({
  setActivePage,
  setTrackedOrderId,
  setSelectedRestaurantId,
  initialTab = 'browse'
}) {
  // Main segment tab: 'browse' | 'orders'
  const [mainTab, setMainTab] = useState(initialTab);

  // Orders state
  const [orders, setOrders] = useState({ active: [], previous: [] });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersTab, setOrdersTab] = useState('active'); // 'active' | 'previous'

  // Restaurant discovery state for "Browse Restaurants" / "All Restaurants"
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantError, setRestaurantError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);

  // Geolocation state
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'requesting' | 'granted' | 'denied'
  const [locationMessage, setLocationMessage] = useState('');

  // Sync initialTab when changed from Navbar/BottomNav
  useEffect(() => {
    if (initialTab) {
      setMainTab(initialTab);
    }
  }, [initialTab]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Load orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await orderAPI.getMyOrders();
      setOrders(data || { active: [], previous: [] });
      if (data?.active?.length === 0 && data?.previous?.length > 0) {
        setOrdersTab('previous');
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load restaurants
  const loadRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    setRestaurantError(null);
    try {
      const data = await restaurantAPI.getAll({
        search: debouncedSearch || undefined,
        cuisine: selectedCuisine !== 'All' ? selectedCuisine : undefined,
        open_only: openOnly ? 'true' : undefined
      });
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load all restaurants:', err);
      setRestaurantError(err.message || 'Unable to load restaurants');
    } finally {
      setLoadingRestaurants(false);
    }
  }, [debouncedSearch, selectedCuisine, openOnly]);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (mainTab === 'browse') {
      loadRestaurants();
    }
  }, [mainTab, loadRestaurants]);

  // Geolocation handling
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('requesting');
    setLocationMessage('Getting your current location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationStatus('granted');
        setLocationMessage('Location enabled. Showing nearest restaurants.');
      },
      (err) => {
        console.warn('Location permission denied:', err.message);
        setLocationStatus('denied');
        setLocationMessage('Location permission denied. Showing all available restaurants.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Process restaurants with coordinates if available in database
  const hasCoordinatesInDB = restaurants.some(
    (r) => r.latitude !== undefined && r.latitude !== null && r.longitude !== undefined && r.longitude !== null
  );

  let processedRestaurants = [...restaurants];
  if (userCoords && hasCoordinatesInDB) {
    processedRestaurants = processedRestaurants.map((r) => {
      if (r.latitude && r.longitude) {
        return {
          ...r,
          calculatedDistance: calculateDistance(userCoords.latitude, userCoords.longitude, r.latitude, r.longitude)
        };
      }
      return { ...r, calculatedDistance: null };
    });

    processedRestaurants.sort((a, b) => {
      if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
        return a.calculatedDistance - b.calculatedDistance;
      }
      return 0;
    });
  }

  const handleOrderAgain = (order) => {
    setSelectedRestaurantId(order.restaurant_id);
    setActivePage('restaurant-menu-view');
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCuisine('All');
    setOpenOnly(false);
  };

  const hasActiveFilters = Boolean(search.trim() || selectedCuisine !== 'All' || openOnly);
  const cuisines = ['All', 'Burgers', 'Fast Food', 'South Indian', 'Sandwiches', 'Beverages'];
  const currentOrderList = ordersTab === 'active' ? orders.active : orders.previous;

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container">
        {/* Top-Level Orders Hub Segment Navigation: Browse Restaurants vs My Orders */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '5px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: '480px',
            width: '100%'
          }}>
            <button
              type="button"
              onClick={() => setMainTab('browse')}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.925rem',
                fontWeight: 700,
                border: 'none',
                background: mainTab === 'browse' ? 'white' : 'transparent',
                color: mainTab === 'browse' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: mainTab === 'browse' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <UtensilsCrossed size={17} /> Browse Restaurants
            </button>

            <button
              type="button"
              onClick={() => setMainTab('orders')}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.925rem',
                fontWeight: 700,
                border: 'none',
                background: mainTab === 'orders' ? 'white' : 'transparent',
                color: mainTab === 'orders' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: mainTab === 'orders' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <ClipboardList size={17} /> My Orders
              {orders.active.length > 0 && (
                <span style={{
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '9999px',
                  padding: '2px 7px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {orders.active.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ----------------- TAB 1: BROWSE RESTAURANTS (ALL RESTAURANTS) ----------------- */}
        {mainTab === 'browse' && (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2rem auto' }}>
              <h1 style={{
                fontSize: 'clamp(2rem, 3.8vw, 2.6rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                marginBottom: '0.4rem'
              }}>
                All Restaurants
              </h1>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
                Choose a restaurant and order ahead.
              </p>
            </div>

            {/* Search and Filters Bar */}
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '2rem'
            }}>
              {/* Search Box */}
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

              {/* Location Status Message */}
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

              {/* Category Pills & Open Now Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
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

            {/* Results Count Strip */}
            {!loadingRestaurants && !restaurantError && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {processedRestaurants.length} {processedRestaurants.length === 1 ? 'Restaurant' : 'Restaurants'} Available
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--primary)' }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}

            {/* Loading State */}
            {loadingRestaurants && (
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

            {/* Error State */}
            {!loadingRestaurants && restaurantError && (
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
                  We could not connect to the restaurant servers. Please check your connection and try again.
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

            {/* Empty State */}
            {!loadingRestaurants && !restaurantError && processedRestaurants.length === 0 && (
              <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'white' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {hasActiveFilters ? 'No restaurants match your search.' : 'No restaurants available right now.'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  {hasActiveFilters
                    ? 'Try adjusting your search query, switching cuisine categories, or unchecking "Open Now Only".'
                    : 'There are currently no dining kitchens available. Please check back shortly.'}
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

            {/* Restaurant Cards Grid */}
            {!loadingRestaurants && !restaurantError && processedRestaurants.length > 0 && (
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
                      setSelectedRestaurantId(id);
                      setActivePage('restaurant-menu-view');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 2: MY ORDERS ----------------- */}
        {mainTab === 'orders' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
              My Orders
            </h1>

            {/* Sub-tab Switcher: Active Pre-Orders vs Previous Orders */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '4px',
              marginBottom: '2rem',
              maxWidth: '380px'
            }}>
              <button
                type="button"
                onClick={() => setOrdersTab('active')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: 'none',
                  background: ordersTab === 'active' ? 'white' : 'transparent',
                  color: ordersTab === 'active' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: ordersTab === 'active' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Active Pre-Orders ({orders.active.length})
              </button>
              <button
                type="button"
                onClick={() => setOrdersTab('previous')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: 'none',
                  background: ordersTab === 'previous' ? 'white' : 'transparent',
                  color: ordersTab === 'previous' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: ordersTab === 'previous' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Previous Orders ({orders.previous.length})
              </button>
            </div>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} className="spin" style={{ marginBottom: '0.5rem' }} />
                <div>Loading orders...</div>
              </div>
            ) : currentOrderList.length === 0 ? (
              <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'white' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--bg-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem'
                }}>
                  <ShoppingBag size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  No {ordersTab} orders
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {ordersTab === 'active'
                    ? 'You don’t have any food currently in the queue.'
                    : 'You have not placed any completed orders yet.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setMainTab('browse')}
                >
                  Browse Campus Restaurants
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {currentOrderList.map((order) => (
                  <div
                    key={order.id}
                    className="card card-hover"
                    style={{
                      padding: '1.5rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setTrackedOrderId(order.id);
                      setActivePage('order-tracking');
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                            {order.restaurant_name}
                          </h3>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {order.order_number}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <StatusBadge status={order.status} />
                    </div>

                    {/* Items preview */}
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      {(order.items || []).map((i) => `${i.item_name} (×${i.quantity})`).join(', ')}
                    </div>

                    {/* Action footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ₹{order.total}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {order.status === 'completed' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderAgain(order);
                            }}
                          >
                            <RotateCcw size={14} /> Order Again
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackedOrderId(order.id);
                            setActivePage('order-tracking');
                          }}
                        >
                          View Order <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
