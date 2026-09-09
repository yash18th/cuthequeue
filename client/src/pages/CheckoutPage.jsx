import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { orderAPI, paymentAPI } from '../utils/api';
import PageNavHeader from '../components/PageNavHeader';
import CheckoutProgress from '../components/CheckoutProgress';
import { ArrowLeft, Clock, Calendar, ShieldCheck, CreditCard, Smartphone, Banknote, AlertTriangle, Plus, Minus, Trash2 } from 'lucide-react';

export default function CheckoutPage({ setActivePage, setTrackedOrderId }) {
  const navigate = useNavigate();
  const { cartItems, restaurant, updateQuantity, removeItem, clearCart, subtotal, tax, convenienceFee, discount, total } = useCart();
  const { user } = useAuth();
  const { notify } = useNotification();

  const [pickupType, setPickupType] = useState('asap'); // 'asap' | 'scheduled'
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'counter'
  const [notes, setNotes] = useState('');
  const [simulateFail, setSimulateFail] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!restaurant || cartItems.length === 0) {
    return (
      <div className="bg-warm-canvas" style={{ minHeight: '80vh', padding: '4rem 0' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <PageNavHeader
            backLabel="Back to Tray"
            fallbackPath="/cart"
            breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Tray', path: '/cart' }, { label: 'Checkout' }]}
          />
          <div className="heritage-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-charcoal)' }}>Your tray is empty</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Choose a Bengaluru dining institution to pre-order delicious meals.
            </p>
            <button className="btn btn-forest" onClick={() => navigate('/restaurants')}>
              Explore Restaurants
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/signin?redirect=/checkout');
      return;
    }

    if (pickupType === 'scheduled' && !scheduledTime) {
      setError('Please select a scheduled pickup time.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Prepare server payload with selected customizations
      const orderPayload = {
        restaurant_id: restaurant.id,
        items: cartItems.map((item) => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          customizations_selected: item.customizations
        })),
        pickup_type: pickupType,
        scheduled_time: pickupType === 'scheduled' ? scheduledTime : null,
        payment_method: paymentMethod,
        notes: notes.trim()
      };

      // 2. Submit order to server
      const orderRes = await orderAPI.createOrder(orderPayload);
      const newOrder = orderRes.order;

      // 3. Process payment simulation
      if (simulateFail) {
        try {
          await paymentAPI.process({ order_id: newOrder.id, method: paymentMethod, simulate_failure: true });
        } catch (payErr) {
          setError('Simulated payment decline: Bank rejected transaction. Order placed as Pending Payment.');
          setSubmitting(false);
          return;
        }
      }

      // 4. Success: Clear cart & play success sound
      notify({
        title: 'Your order is being prepared! 🎉',
        message: `Order #${newOrder.order_number} is in the kitchen at ${restaurant.name}. Head to the restaurant when you're ready!`,
        type: 'info',
        sound: true,
        soundType: 'success'
      });

      clearCart();
      if (setTrackedOrderId) setTrackedOrderId(newOrder.id);
      navigate(`/order-confirmation/${newOrder.id}`);
      if (setActivePage) setActivePage('order-confirmation');
    } catch (err) {
      console.error('Place order error:', err);
      setError(err.message || 'We couldn’t place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const prepMinutes = restaurant?.prep_time_minutes || 15;
  const readyDate = new Date(Date.now() + prepMinutes * 60000);
  const estimatedReadyTime = pickupType === 'scheduled' && scheduledTime
    ? scheduledTime
    : readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const estimatedTimeSaved = Math.max(15, prepMinutes + 5);

  const brandSlug = restaurant?.brand_slug || restaurant?.brand_id;
  const restaurantPath = brandSlug ? `/restaurants/${brandSlug}/branches/${restaurant.id}` : '/restaurants';

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Restaurants', path: '/restaurants' },
    { label: restaurant.name, path: restaurantPath },
    { label: 'Tray', path: '/cart' },
    { label: 'Checkout' }
  ];

  return (
    <div className="bg-warm-canvas" style={{ padding: '2.5rem 0 6rem 0', minHeight: '90vh' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        <PageNavHeader
          title="Pre-Order Checkout"
          backLabel="Back to Tray"
          fallbackPath="/cart"
          breadcrumbs={breadcrumbs}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Arrive to a counter that's already preparing your feast. Zero waiting in line.
        </p>

        {/* Visual Progress Steps */}
        <CheckoutProgress currentStep={4} />

        {/* Time-Saving Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0B352D 0%, #123F35 100%)',
          border: '1px solid #C49A52',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          color: '#F7F0E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#C49A52', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-serif)' }}>
              <Clock size={16} /> Skip the Counter Queue
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F7F0E2', marginTop: '3px', fontFamily: 'var(--font-serif)' }}>
              Pickup Method: <strong>Self Pickup at Branch Counter</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#E9DDC7', marginTop: '2px', maxWidth: '480px' }}>
              The kitchen begins preparation immediately. Walk in, show your digital token, and collect fresh hot food.
            </p>
          </div>
          <div style={{
            background: 'rgba(247, 240, 226, 0.1)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            textAlign: 'center',
            border: '1px solid #C49A52'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#C49A52', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimated Ready Time
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F7F0E2', fontFamily: 'var(--font-serif)' }}>
              {estimatedReadyTime}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#C49A52', fontWeight: 700, marginTop: '2px' }}>
              ⏱️ ~{estimatedTimeSaved} min queue time saved
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #F87171',
            color: 'var(--accent-maroon)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Left Column: Pickup Preference & Payment Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Pickup Preference */}
            <div className="heritage-card" style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
                Pickup Preference
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  onClick={() => setPickupType('asap')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${pickupType === 'asap' ? 'var(--bg-deep-green)' : '#E8DDC8'}`,
                    background: pickupType === 'asap' ? '#F7F1E5' : 'white',
                    boxShadow: pickupType === 'asap' ? '0 2px 8px rgba(18, 60, 50, 0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pickupType === 'asap' ? 'var(--bg-deep-green)' : 'var(--text-charcoal)', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>
                    <Clock size={18} style={{ color: pickupType === 'asap' ? 'var(--bg-deep-green)' : 'var(--accent-gold)' }} /> ASAP
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Ready in ~{restaurant.prep_time_minutes || 15} mins
                  </p>
                </div>

                <div
                  onClick={() => setPickupType('scheduled')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${pickupType === 'scheduled' ? 'var(--bg-deep-green)' : '#E8DDC8'}`,
                    background: pickupType === 'scheduled' ? '#F7F1E5' : 'white',
                    boxShadow: pickupType === 'scheduled' ? '0 2px 8px rgba(18, 60, 50, 0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pickupType === 'scheduled' ? 'var(--bg-deep-green)' : 'var(--text-charcoal)', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>
                    <Calendar size={18} style={{ color: pickupType === 'scheduled' ? 'var(--bg-deep-green)' : 'var(--accent-gold)' }} /> Schedule
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Choose future time today
                  </p>
                </div>
              </div>

              {pickupType === 'scheduled' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label className="input-label" style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>Pick up time today</label>
                  <input
                    type="time"
                    className="input-field"
                    style={{ border: '1px solid #E8DDC8', borderRadius: 'var(--radius-md)' }}
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="heritage-card" style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
                Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { id: 'upi', label: 'Instant UPI (Google Pay, PhonePe, Paytm)', icon: <Smartphone size={18} /> },
                  { id: 'card', label: 'Debit / Credit Card', icon: <CreditCard size={18} /> },
                  { id: 'counter', label: 'Pay at Counter Upon Pickup', icon: <Banknote size={18} /> }
                ].map((m) => {
                  const isSelected = paymentMethod === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${isSelected ? 'var(--bg-deep-green)' : '#E8DDC8'}`,
                        background: isSelected ? '#F7F1E5' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 800 : 500,
                        color: 'var(--text-charcoal)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ color: isSelected ? 'var(--bg-deep-green)' : 'var(--accent-gold)' }}>{m.icon}</span>
                      <span style={{ flex: 1, fontFamily: isSelected ? 'var(--font-serif)' : 'inherit' }}>{m.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Dev Simulation Toggle */}
              <div style={{
                background: '#F7F1E5',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed #D9CBBA',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={simulateFail}
                    onChange={(e) => setSimulateFail(e.target.checked)}
                  />
                  <span>Simulate payment failure state (Dev/QA testing)</span>
                </label>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="heritage-card" style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8', boxShadow: 'var(--shadow-sm)' }}>
              <label className="input-label" style={{ fontWeight: 800, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
                Kitchen Notes / Special Requests (Optional)
              </label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="e.g., Extra spicy, crispier dosa, sambar on the side..."
                style={{ border: '1px solid #E8DDC8', borderRadius: 'var(--radius-md)' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Bill Details */}
          <div className="heritage-card" style={{ padding: '1.75rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--accent-gold-muted)', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>
                  Selected Restaurant
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>{restaurant.name}</h3>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E8DDC8', margin: '1rem 0' }} />

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {cartItems.map((item) => (
                <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
                      {item.name}
                    </div>

                    {/* Customizations tags */}
                    {Object.entries(item.customizations || {}).length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {Object.entries(item.customizations).map(([k, v]) => (
                          <span key={k} style={{ marginRight: '6px' }}>
                            {k}: {Array.isArray(v) ? v.join(', ') : v}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E8DDC8', borderRadius: '6px', padding: '1px 4px', background: '#F7F1E5' }}>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          style={{ padding: '2px 4px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, padding: '0 6px', fontFamily: 'var(--font-serif)' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          style={{ padding: '2px 4px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        style={{ color: 'var(--accent-maroon)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--bg-deep-green)', fontFamily: 'var(--font-serif)' }}>
                    ₹{item.totalPrice}
                  </div>
                </div>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E8DDC8', margin: '1rem 0' }} />

            {/* Bill Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700 }}>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Taxes & GST (5%)</span>
                <span style={{ fontWeight: 700 }}>₹{tax}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Convenience & Queue Skip Fee</span>
                <span style={{ fontWeight: 700 }}>₹{convenienceFee}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--bg-deep-green)', fontWeight: 700 }}>
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <hr style={{ border: 'none', borderTop: '1px dashed #E8DDC8', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--bg-deep-green)' }}>₹{total}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              className="btn btn-gold btn-lg"
              style={{ width: '100%', padding: '0.95rem', fontSize: '1rem' }}
              onClick={handlePlaceOrder}
              disabled={submitting}
            >
              {submitting ? 'Transmitting Pre-Order...' : `Place Pickup Order • ₹${total}`}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--bg-deep-green)' }} />
              <span>Instant direct transmission to Bengaluru kitchen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
