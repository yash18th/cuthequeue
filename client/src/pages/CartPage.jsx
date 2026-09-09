import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PageNavHeader from '../components/PageNavHeader';
import CheckoutProgress from '../components/CheckoutProgress';
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

  const brandSlug = restaurant?.brand_slug || restaurant?.brand_id;
  const fallbackPath = restaurant
    ? (brandSlug ? `/restaurants/${brandSlug}/branches/${restaurant.id}` : `/restaurants`)
    : '/restaurants';

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Restaurants', path: '/restaurants' },
    ...(restaurant ? [{ label: restaurant.name, path: fallbackPath }] : []),
    { label: 'Your Tray' }
  ];

  if (cartItems.length === 0) {
    return (
      <div className="bg-warm-canvas" style={{ padding: '2.5rem 0 6rem 0', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <PageNavHeader
            backLabel="Back to Restaurants"
            fallbackPath="/restaurants"
            breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Restaurants', path: '/restaurants' }, { label: 'Tray' }]}
          />

          <div className="heritage-card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#F7F1E5',
              border: '1px solid #E8DDC8',
              color: 'var(--accent-gold)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <ShoppingBag size={32} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
              Your tray is currently empty
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', maxWidth: '440px', margin: '0 auto 1.75rem auto' }}>
              Pre-order ahead from Bengaluru's legendary kitchens before travelling. Arrive to hot food with zero counter queue!
            </p>
            <Link to="/restaurants" className="btn btn-forest" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.6rem' }}>
              <Store size={16} /> Explore Bengaluru Restaurants
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
    <div className="bg-warm-canvas" style={{ padding: '2.5rem 0 6rem 0', minHeight: '90vh' }}>
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
              style={{ color: 'var(--accent-maroon)', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Clear Tray
            </button>
          }
        />

        {/* Visual Ordering Progress Steps */}
        <CheckoutProgress currentStep={3} />

        {/* Restaurant Header Banner */}
        {restaurant && (
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #E8DDC8',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-gold-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-serif)' }}>
                ✦ PREPARING AT BENGALURU BRANCH
              </span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px', fontFamily: 'var(--font-serif)' }}>
                {restaurant.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '2px' }}>
                <MapPin size={13} style={{ color: 'var(--accent-gold)' }} />
                <span>{restaurant.location || restaurant.address}</span>
              </div>
            </div>

            <div style={{
              background: '#F7F1E5',
              border: '1px solid #E8DDC8',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={16} style={{ color: 'var(--bg-deep-green)' }} />
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--bg-deep-green)', textTransform: 'uppercase' }}>
                  Prep Time ~{prepMinutes} min
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
                  Ready around ~{readyByTime}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Cart Items List */}
          <div className="heritage-card" style={{ padding: '1.75rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
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
                    borderBottom: '1px solid #E8DDC8',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E8DDC8' }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        background: '#F7F1E5',
                        border: '1px solid #E8DDC8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ShoppingBag size={22} color="var(--accent-gold)" />
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
                        {item.name}
                      </h4>
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          {Object.entries(item.customizations)
                            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                            .join(' • ')}
                        </p>
                      )}
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--bg-deep-green)', marginTop: '4px', fontFamily: 'var(--font-serif)' }}>
                        ₹{item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #E8DDC8', background: '#F7F1E5' }}
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      {item.quantity === 1 ? <Trash2 size={13} color="var(--accent-maroon)" /> : <Minus size={13} />}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '24px', textAlign: 'center', fontFamily: 'var(--font-serif)' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #E8DDC8', background: '#F7F1E5' }}
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
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '2px dashed #E8DDC8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <span>Taxes & GST (5%)</span>
                <span style={{ fontWeight: 700 }}>₹{tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                <span>Convenience & Queue Skip Fee</span>
                <span style={{ fontWeight: 700 }}>₹{convenienceFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-charcoal)', borderTop: '1px solid #E8DDC8', paddingTop: '0.85rem', fontFamily: 'var(--font-serif)' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--bg-deep-green)' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Primary CTA */}
            <div style={{ marginTop: '1.75rem' }}>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>Continue to Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
