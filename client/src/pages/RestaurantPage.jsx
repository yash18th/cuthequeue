import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import ItemModal from '../components/ItemModal';
import PageNavHeader from '../components/PageNavHeader';
import {
  Star,
  Clock,
  MapPin,
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  Plus,
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

  const { addItem, totalItemCount, cartTotal, restaurant: cartRestaurant } = useCart();

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

  const handleAddToCart = (item) => {
    const customizations = item.customizations || JSON.parse(item.customizations_json || '[]');
    if (customizations.length > 0) {
      setSelectedItemForModal(item);
    } else {
      addItem(item, restaurant, 1, {});
    }
  };

  return (
    <div style={{ background: 'var(--bg-heritage)', minHeight: '90vh', paddingBottom: '7rem' }}>
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
        background: '#1c1917',
        overflow: 'hidden'
      }}>
        <img
          src={restaurant.cover_image}
          alt={restaurant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.82 }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(28, 25, 23, 0.92) 0%, rgba(28, 25, 23, 0.3) 60%, transparent 100%)'
        }} />

        <div className="container" style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span className={`badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
              {isOpen ? '🟢 Open for Pre-Order' : '🔴 Closed'}
            </span>
            <span style={{
              background: 'rgba(28, 25, 23, 0.85)',
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
              {restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.8'}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            margin: '0.2rem 0',
            color: 'white'
          }}>
            {restaurant.name}
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.875rem',
            color: '#e7e5e4',
            flexWrap: 'wrap'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} style={{ color: '#fbbf24' }} />
              {restaurant.address}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} style={{ color: '#fbbf24' }} />
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
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-heritage)',
          border: '1px solid var(--border-heritage)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-brass)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Counter Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              {renderQueueBadge()}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-heritage-secondary)' }}>
                Order ahead to skip standing in counter queues
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-heritage-muted)' }}>Estimated Wait</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heritage-dark)' }}>
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
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: 700,
                border: '1px solid',
                borderColor: activeCategory === null ? 'var(--accent-brass)' : 'var(--border-heritage)',
                background: activeCategory === null ? 'var(--accent-brass)' : 'white',
                color: activeCategory === null ? 'white' : 'var(--text-heritage-secondary)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              All Items ({allItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  border: '1px solid',
                  borderColor: activeCategory === cat.id ? 'var(--accent-brass)' : 'var(--border-heritage)',
                  background: activeCategory === cat.id ? 'var(--accent-brass)' : 'white',
                  color: activeCategory === cat.id ? 'white' : 'var(--text-heritage-secondary)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.name}
              </button>
            ))}
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
                  padding: '0.4rem 0.8rem 0.4rem 2rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-heritage)',
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
              color: 'var(--text-heritage-dark)',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={(e) => setVegOnly(e.target.checked)}
                style={{ accentColor: '#059669', width: '15px', height: '15px' }}
              />
              <span>Pure Veg</span>
            </label>
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid var(--border-heritage)'
          }}>
            <Utensils size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-heritage-dark)' }}>
              No dishes found matching your filter
            </h3>
            <p style={{ color: 'var(--text-heritage-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
              Try clearing search or toggling veg/non-veg filter.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="heritage-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.25rem',
                  position: 'relative'
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
                        border: item.is_veg ? '1.5px solid #059669' : '1.5px solid #dc2626',
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
                          background: item.is_veg ? '#059669' : '#dc2626'
                        }} />
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.is_veg ? '#059669' : '#dc2626' }}>
                        {item.is_veg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: 'var(--text-heritage-dark)',
                      margin: '2px 0 4px 0'
                    }}>
                      {item.name}
                    </h3>

                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: 'var(--accent-brass)',
                      marginBottom: '0.4rem'
                    }}>
                      ₹{item.price}
                    </div>

                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-heritage-secondary)',
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

                  {/* Item Image & Add Button */}
                  <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300'}
                      alt={item.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.is_available}
                      style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        border: '1.5px solid var(--accent-brass)',
                        color: 'var(--accent-brass)',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '3px 12px',
                        borderRadius: 'var(--radius-full)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                        whiteSpace: 'nowrap',
                        cursor: item.is_available ? 'pointer' : 'not-allowed',
                        opacity: item.is_available ? 1 : 0.6
                      }}
                    >
                      {item.is_available ? '+ ADD' : 'SOLD OUT'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Modal for customizations if any */}
      {selectedItemForModal && (
        <ItemModal
          item={selectedItemForModal}
          restaurant={restaurant}
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
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
          color: 'white',
          padding: '1rem 1.4rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          border: '1px solid rgba(217, 119, 6, 0.4)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>
              {cartRestaurant?.name || restaurant.name}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} • ₹{cartTotal.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="btn btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '0.5rem 0.9rem'
              }}
            >
              View Tray
            </button>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="btn btn-sm btn-primary"
              style={{
                background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                border: 'none',
                color: 'white',
                fontWeight: 800,
                padding: '0.5rem 1.1rem',
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
  );
}
