import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PageNavHeader from '../components/PageNavHeader';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Clock, MapPin, Store, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    restaurant,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    convenienceFee,
    total,
    totalItemCount
  } = useCart();

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Browse', path: '/browse' },
    ...(restaurant ? [{ label: restaurant.name, path: `/restaurant/${restaurant.id}` }] : []),
    { label: 'Your Tray' }
  ];

  const fallbackPath = restaurant ? `/restaurant/${restaurant.id}` : '/browse';

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '2.5rem 0 6rem 0' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <PageNavHeader
            backLabel="Back to Restaurants"
            fallbackPath="/browse"
            breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Browse', path: '/browse' }, { label: 'Cart' }]}
          />

          <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'white' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <ShoppingBag size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Your tray is currently empty
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', maxWidth: '420px', margin: '0 auto 1.75rem auto' }}>
              Pre-order food from campus restaurants before walking over. Skip the counter queue entirely!
            </p>
            <Link to="/browse" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Store size={16} /> Explore Available Kitchens
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const prepMinutes = restaurant?.prep_time_minutes || 15;
  const readyDate = new Date(Date.now() + prepMinutes * 60000);
  const readyByTime = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <PageNavHeader
          title="Your Pre-Order Tray"
          backLabel="Continue Browsing"
          fallbackPath={fallbackPath}
          breadcrumbs={breadcrumbs}
          extraAction={
            <button
              type="button"
              onClick={clearCart}
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}
            >
              Clear Tray
            </button>
          }
        />

        {/* Restaurant Header Banner */}
        {restaurant && (
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ⚡ PREPARING AT KITCHEN
              </span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {restaurant.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '2px' }}>
                <MapPin size={13} />
                <span>{restaurant.location || restaurant.address}</span>
              </div>
            </div>

            <div style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Prep Time ~{prepMinutes} min
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Ready by ~{readyByTime}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Cart Items List */}
          <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Selected Food Items ({totalItemCount})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        background: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ShoppingBag size={20} color="var(--text-muted)" />
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {item.name}
                      </h4>
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          {Object.entries(item.customizations)
                            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                            .join(' • ')}
                        </p>
                      )}
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                        ₹{item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', borderRadius: '6px' }}
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      {item.quantity === 1 ? <Trash2 size={13} color="var(--accent-rose)" /> : <Minus size={13} />}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', borderRadius: '6px' }}
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '2px dashed var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <span>Taxes & GST (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                <span>Convenience & Queue Skip Fee</span>
                <span>₹{convenienceFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--primary)' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Primary CTA */}
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Proceed to Pre-Order <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
