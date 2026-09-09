import React, { useState, useEffect } from 'react';
import { restaurantAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import ItemModal from '../components/ItemModal';
import { Star, Clock, MapPin, ArrowLeft, ShoppingBag, AlertCircle, Plus, Info } from 'lucide-react';

export default function RestaurantPage({ restaurantId, setActivePage, onOpenCart }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const { addItem, totalItemCount } = useCart();

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    restaurantAPI.getById(restaurantId)
      .then((res) => {
        setData(res);
        if (res.categories && res.categories.length > 0) {
          setActiveCategory(res.categories[0].id);
        }
      })
      .catch((err) => console.error('Failed to load restaurant:', err))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading live menu...</p>
      </div>
    );
  }

  if (!data || !data.restaurant) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Restaurant not found or currently unavailable.</p>
        <button className="btn btn-secondary" onClick={() => setActivePage('home')}>
          <ArrowLeft size={16} /> Back to Restaurants
        </button>
      </div>
    );
  }

  const { restaurant, categories, allItems } = data;

  const handleAddToCart = (item, rest, quantity, selections) => {
    addItem(item, rest, quantity, selections);
  };

  return (
    <div style={{ paddingBottom: '6rem' }}>
      {/* Cover Banner */}
      <div style={{ position: 'relative', height: '280px', width: '100%', background: '#0f172a' }}>
        <img
          src={restaurant.cover_image}
          alt={restaurant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 60%)'
        }} />

        <div className="container" style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, color: 'white' }}>
          <button
            onClick={() => setActivePage('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '1rem',
              backdropFilter: 'blur(6px)'
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                  {restaurant.name}
                </h1>
                <span className={`badge ${restaurant.is_open ? 'badge-open' : 'badge-closed'}`}>
                  {restaurant.is_open ? '🟢 Open Now' : '🔴 Currently Closed'}
                </span>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>
                {restaurant.cuisine} • {restaurant.address}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                padding: '8px 14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Clock size={18} style={{ color: '#34d399' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}>Prep Time</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{restaurant.prep_time_minutes || 15}–{(restaurant.prep_time_minutes || 15) + 5} min</div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                padding: '8px 14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Star size={18} style={{ color: '#fbbf24' }} fill="#fbbf24" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}>Rating</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{restaurant.rating || 4.5} / 5.0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Closed Warning Banner if restaurant is closed */}
      {!restaurant.is_open && (
        <div style={{ background: '#fff1f2', borderBottom: '1px solid #fecdd3', padding: '0.85rem 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#be123c', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>
              <strong>This kitchen is currently closed.</strong> You can still browse the menu or schedule a pickup order in advance.
            </span>
          </div>
        </div>
      )}

      {/* Category Tabs Navigation */}
      <div style={{
        position: 'sticky',
        top: '68px',
        zIndex: 40,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.75rem 0'
      }}>
        <div className="container" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '2px' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 700,
                border: 'none',
                background: activeCategory === cat.id ? 'var(--primary)' : 'var(--bg-subtle)',
                color: activeCategory === cat.id ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items List */}
      <div className="container" style={{ marginTop: '2rem' }}>
        {categories
          .filter((cat) => !activeCategory || cat.id === activeCategory)
          .map((category) => (
            <div key={category.id} style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                {category.name}
              </h2>

              {category.items.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No items in this category yet.</p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem'
                }}>
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        opacity: item.is_available ? 1 : 0.6
                      }}
                    >
                      {/* Left: Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className={item.is_veg ? 'veg-indicator' : 'non-veg-indicator'}>
                            {item.is_veg ? <span className="veg-indicator-dot" /> : <span className="non-veg-indicator-triangle" />}
                          </span>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.name}
                          </h4>
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                          ₹{item.price}
                        </div>

                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 0.5rem 0' }}>
                          {item.description}
                        </p>

                        {item.customizations && item.customizations.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                            Customizable Options
                          </span>
                        )}
                      </div>

                      {/* Right: Image + Action */}
                      <div style={{ position: 'relative', width: '105px', height: '105px', flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 'calc(100% - 12px)'
                        }}>
                          {item.is_available ? (
                            <button
                              className="btn btn-sm btn-primary"
                              style={{
                                width: '100%',
                                padding: '0.35rem 0.5rem',
                                fontSize: '0.8rem',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                              }}
                              onClick={() => setSelectedItemForModal(item)}
                            >
                              <Plus size={14} /> Add
                            </button>
                          ) : (
                            <span style={{
                              display: 'block',
                              background: '#334155',
                              color: '#ffffff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              padding: '2px 4px',
                              borderRadius: '4px'
                            }}>
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Item Customization Modal */}
      {selectedItemForModal && (
        <ItemModal
          item={selectedItemForModal}
          restaurant={restaurant}
          isOpen={!!selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Floating Bottom Sticky Cart Bar if cart has items */}
      {totalItemCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 45,
          width: 'calc(100% - 40px)',
          maxWidth: '560px'
        }}>
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 10px 25px rgba(5, 150, 105, 0.45)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '1rem',
              fontWeight: 700
            }}
            onClick={onOpenCart}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} />
              <span>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in your tray</span>
            </div>
            <span>Proceed to Checkout &rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
}
