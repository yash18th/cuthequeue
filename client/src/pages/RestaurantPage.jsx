import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import ItemModal from '../components/ItemModal';
import PageNavHeader from '../components/PageNavHeader';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  Star,
  Clock,
  MapPin,
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  Plus,
  Minus,
  Info,
  Search,
  Check,
  ChevronRight,
  Utensils
} from 'lucide-react';

export default function RestaurantPage({ restaurantId, setActivePage, onOpenCart }) {
  const params = useParams();
  const navigate = useNavigate();
  const effectiveId = restaurantId || params.branchId || params.restaurantId || params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [vegOnly, setVegOnly] = useState(false);

  const {
    addItem,
    updateQuantity,
    removeItem,
    totalItemCount = 0,
    total = 0,
    cartTotal = 0,
    cartItems = [],
    restaurant: cartRestaurant
  } = useCart() || {};

  useEffect(() => {
    if (!effectiveId) return;
    setLoading(true);
    restaurantAPI.getById(effectiveId)
      .then((res) => {
        setData(res);
        if (res.categories && res.categories.length > 0) {
          setActiveCategory(res.categories[0].id);
        }
      })
      .catch((err) => console.error('Failed to load restaurant:', err))
      .finally(() => setLoading(false));
  }, [effectiveId]);

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-heritage)', minHeight: '80vh', padding: '4rem 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ width: '120px', height: '36px', background: '#e7e5e4', borderRadius: '8px', marginBottom: '2rem' }} />
          <div style={{ height: '240px', background: '#e7e5e4', borderRadius: '16px', marginBottom: '2rem' }} />
          <p style={{ color: 'var(--text-heritage-muted)' }}>Loading authentic Bengaluru menu...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.restaurant) {
    return (
      <div style={{ background: 'var(--bg-heritage)', minHeight: '70vh', padding: '4rem 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '500px' }}>
          <AlertCircle size={44} style={{ color: 'var(--accent-terracotta)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-heritage-dark)' }}>
            Branch Not Found
          </h2>
          <p style={{ color: 'var(--text-heritage-secondary)', marginBottom: '1.5rem' }}>
            We could not find this restaurant branch.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/restaurants')}
          >
            <ArrowLeft size={16} /> Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  const { restaurant, categories, allItems } = data;

  const brandSlug = restaurant.brand_slug || restaurant.brand_id;
  const brandName = restaurant.brand_name || restaurant.name.split(' - ')[0];
  const branchName = restaurant.branch_name || restaurant.area || restaurant.name;

  const fallbackPath = brandSlug ? `/restaurants/${brandSlug}` : '/restaurants';
  const backLabel = brandName ? `Back to ${brandName}` : 'Back to Restaurants';

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Restaurants', path: '/restaurants' }
  ];
  if (brandSlug && brandName) {
    breadcrumbs.push({ label: brandName, path: `/restaurants/${brandSlug}` });
  }
  breadcrumbs.push({ label: `${branchName} Menu` });

  const isOpen = restaurant.is_currently_open !== undefined
    ? restaurant.is_currently_open
    : !!restaurant.is_open;

  // Queue Pill Helper
  const renderQueueBadge = () => {
    const q = (restaurant.queue_status || 'moderate').toLowerCase();
    const count = restaurant.queue_count || 6;
    if (q === 'low') {
      return (
        <span className="queue-pill queue-pill-low">
          ● Low Queue ({count} orders ahead)
        </span>
      );
    }
    if (q === 'busy') {
      return (
        <span className="queue-pill queue-pill-busy">
          ● Busy Queue ({count} orders ahead)
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
        ● Moderate Queue ({count} orders ahead)
      </span>
    );
  };

  // Filter items
  const filteredItems = (allItems || []).filter((item) => {
    const matchesCategory = activeCategory ? item.category_id === activeCategory : true;
    const matchesSearch = menuSearch.trim() === '' ||
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));
    const matchesVeg = vegOnly ? Boolean(item.is_veg) : true;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  const getItemCustomizations = (item) => {
    if (!item) return [];
    try {
      if (Array.isArray(item.customizations)) return item.customizations;
      if (typeof item.customizations_json === 'string' && item.customizations_json.trim()) {
        const parsed = JSON.parse(item.customizations_json);
        if (Array.isArray(parsed)) return parsed;
      }
      if (Array.isArray(item.customizations_json)) return item.customizations_json;
    } catch {
      return [];
    }
    return [];
  };

  const handleAddToCart = (item) => {
    if (!item || !restaurant) return;
    try {
      const customizations = getItemCustomizations(item);
      if (customizations.length > 0) {
        setSelectedItemForModal(item);
      } else {
        addItem(item, restaurant, 1, {});
      }
    } catch (err) {
      console.error('Failed to add item to cart:', err);
    }
  };

  const handleIncreaseQuantity = (item) => {
    if (!item) return;
    try {
      const customizations = getItemCustomizations(item);
      if (customizations.length > 0) {
        setSelectedItemForModal(item);
      } else {
        const matching = (cartItems || []).find((ci) => ci.menu_item_id === item.id || ci.id === item.id);
        if (matching) {
          updateQuantity(matching.cartItemId, matching.quantity + 1);
        } else {
          addItem(item, restaurant, 1, {});
        }
      }
    } catch (err) {
      console.error('Failed to increase quantity:', err);
    }
  };

  const handleDecreaseQuantity = (item) => {
    if (!item) return;
    try {
      const matching = (cartItems || []).filter((ci) => ci.menu_item_id === item.id || ci.id === item.id);
      if (matching.length > 0) {
        const target = matching[matching.length - 1];
        if (target.quantity > 1) {
          updateQuantity(target.cartItemId, target.quantity - 1);
        } else {
          removeItem(target.cartItemId);
        }
      }
    } catch (err) {
      console.error('Failed to decrease quantity:', err);
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-warm-canvas" style={{ minHeight: '90vh', paddingBottom: '7rem' }}>
      {/* Top Nav Header with Back & Breadcrumb */}
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        <PageNavHeader
          backLabel={backLabel}
          fallbackPath={fallbackPath}
          breadcrumbs={breadcrumbs}
        />
      </div>

      {/* Heritage Cover Banner */}
      <div style={{
        position: 'relative',
        height: '280px',
        width: '100%',
        background: '#0B352D',
        overflow: 'hidden',
        borderBottom: '2px solid #C49A52'
      }}>
        <img
          src={restaurant.cover_image}
          alt={restaurant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(11, 53, 45, 0.95) 0%, rgba(18, 63, 53, 0.4) 60%, transparent 100%)'
        }} />

        <div className="container" style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, color: '#F7F0E2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span className={`badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
              {isOpen ? '🟢 Open for Pre-Order' : '🔴 Closed'}
            </span>
            <span style={{
              background: 'rgba(11, 53, 45, 0.85)',
              color: '#C49A52',
              border: '1px solid #C49A52',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(6px)'
            }}>
              <Star size={13} fill="#C49A52" strokeWidth={0} />
              {restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.8'}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.7rem)',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            margin: '0.2rem 0',
            color: '#F7F0E2',
            fontFamily: 'var(--font-serif)'
          }}>
            {restaurant.name}
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.875rem',
            color: '#E9DDC7',
            flexWrap: 'wrap'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} style={{ color: '#C49A52' }} />
              {restaurant.address}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} style={{ color: '#C49A52' }} />
              Ready in ~{restaurant.prep_time_minutes || 15} mins
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ marginTop: '1.75rem' }}>
        {/* Live Queue & Preparation Indicator Box */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid #E8DDC8',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>
              Live Counter Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              {renderQueueBadge()}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Order ahead to skip standing in counter queues
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Wait</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--bg-deep-green)', fontFamily: 'var(--font-serif)' }}>
                ~{restaurant.prep_time_minutes || 15} mins
              </div>
            </div>
          </div>
        </div>

        {/* Menu Search & Category Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Categories */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '4px',
            maxWidth: '100%'
          }}>
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                fontWeight: 700,
                border: '1px solid',
                borderColor: activeCategory === null ? 'var(--accent-gold)' : '#E8DDC8',
                background: activeCategory === null ? 'var(--bg-deep-green)' : 'white',
                color: activeCategory === null ? '#F7F1E5' : 'var(--text-charcoal)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                fontFamily: 'var(--font-serif)'
              }}
            >
              All Items ({allItems.length})
            </button>
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '0.45rem 1.1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent-gold)' : '#E8DDC8',
                    background: isSelected ? 'var(--bg-deep-green)' : 'white',
                    color: isSelected ? '#F7F1E5' : 'var(--text-charcoal)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-serif)'
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Search menu items & Veg toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search dish..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.8rem 0.45rem 2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E8DDC8',
                  background: 'white',
                  fontSize: '0.825rem'
                }}
              />
            </div>

            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--text-charcoal)',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={(e) => setVegOnly(e.target.checked)}
                style={{ accentColor: '#123C32', width: '15px', height: '15px' }}
              />
              <span>Pure Veg Only</span>
            </label>
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid #E8DDC8'
          }}>
            <Utensils size={36} style={{ color: 'var(--accent-gold)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
              No dishes found matching your filter
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
              Try clearing search or toggling veg/non-veg filter.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredItems.map((item) => {
              const itemCartQty = (cartItems || [])
                .filter((ci) => ci.menu_item_id === item.id || ci.id === item.id)
                .reduce((sum, ci) => sum + (Number(ci.quantity) || 0), 0);

              return (
                <div
                  key={item.id}
                  className="heritage-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.25rem',
                    position: 'relative',
                    background: 'white',
                    border: '1px solid #E9DDC7',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div style={{ flex: 1 }}>
                      {/* Veg / Non-veg Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '14px',
                          height: '14px',
                          border: item.is_veg ? '1.5px solid #15803d' : '1.5px solid #b91c1c',
                          padding: '2px',
                          borderRadius: '2px',
                          textAlign: 'center',
                          lineHeight: 0
                        }}>
                          <span style={{
                            display: 'inline-block',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: item.is_veg ? '#15803d' : '#b91c1c'
                          }} />
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.is_veg ? '#15803d' : '#b91c1c' }}>
                          {item.is_veg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </div>

                      <h3 style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: 'var(--text-charcoal)',
                        margin: '2px 0 4px 0',
                        fontFamily: 'var(--font-serif)'
                      }}>
                        {item.name}
                      </h3>

                      <div style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: 'var(--bg-deep-green)',
                        marginBottom: '0.4rem',
                        fontFamily: 'var(--font-serif)'
                      }}>
                        ₹{item.price}
                      </div>

                      <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.description}
                      </p>
                    </div>

                    {/* Item Image & Add / Quantity Button */}
                    <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300'}
                        alt={item.name}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #E9DDC7'
                        }}
                      />
                      {!item.is_available ? (
                        <button
                          type="button"
                          disabled
                          style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#E9DDC7',
                            border: '1.5px solid #C49A52',
                            color: 'var(--text-secondary)',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                            whiteSpace: 'nowrap',
                            cursor: 'not-allowed',
                            opacity: 0.75
                          }}
                        >
                          SOLD OUT
                        </button>
                      ) : itemCartQty > 0 ? (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'white',
                            border: '1.5px solid var(--bg-deep-green)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '2px 6px',
                            boxShadow: '0 2px 8px rgba(11, 53, 45, 0.2)',
                            width: '88px',
                            height: '28px',
                            userSelect: 'none'
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecreaseQuantity(item);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0 4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--bg-deep-green)',
                              fontWeight: 800,
                              fontSize: '1rem',
                              lineHeight: 1
                            }}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            −
                          </button>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: 'var(--bg-deep-green)',
                              minWidth: '20px',
                              textAlign: 'center',
                              fontFamily: 'var(--font-serif)'
                            }}
                          >
                            {itemCartQty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIncreaseQuantity(item);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0 4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--bg-deep-green)',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              lineHeight: 1
                            }}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'white',
                            border: '1.5px solid var(--bg-deep-green)',
                            color: 'var(--bg-deep-green)',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            padding: '4px 14px',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Modal for customizations if any */}
      {selectedItemForModal && (
        <ItemModal
          item={selectedItemForModal}
          restaurant={restaurant}
          isOpen={Boolean(selectedItemForModal)}
          onClose={() => setSelectedItemForModal(null)}
          onAddToCart={(item, rest, quantity, selections) => {
            addItem(item, rest, quantity, selections);
            setSelectedItemForModal(null);
          }}
        />
      )}

      {/* Floating Sticky Cart Summary Bar */}
      {totalItemCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)',
          maxWidth: '680px',
          background: 'linear-gradient(135deg, #0B352D 0%, #123F35 100%)',
          color: '#F7F0E2',
          padding: '1rem 1.4rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: '1px solid #C49A52',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#C49A52', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>
              {cartRestaurant?.name || restaurant.name}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} • ₹{(Number(cartTotal || total) || 0).toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="btn btn-sm btn-outline"
              style={{
                borderColor: '#C49A52',
                color: '#F7F0E2',
                padding: '0.5rem 1rem'
              }}
            >
              View Tray
            </button>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="btn btn-sm btn-gold"
              style={{
                padding: '0.5rem 1.2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Pre-Order</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
