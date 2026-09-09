import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { orderAPI, paymentAPI } from '../utils/api';
import { ArrowLeft, Clock, Calendar, ShieldCheck, CreditCard, Smartphone, Banknote, AlertTriangle, Plus, Minus, Trash2 } from 'lucide-react';

export default function CheckoutPage({ setActivePage, setTrackedOrderId }) {
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
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Your tray is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Choose a campus restaurant to pre-order delicious meals.
          </p>
          <button className="btn btn-primary" onClick={() => setActivePage('home')}>
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      setActivePage('auth');
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
        title: 'Order Confirmed! 🎉',
        message: `Order ${newOrder.order_number} sent to ${restaurant.name}. Live queue tracking started.`,
        type: 'info',
        sound: true,
        soundType: 'success'
      });

      clearCart();
      setTrackedOrderId(newOrder.id);
      setActivePage('order-tracking');
    } catch (err) {
      console.error('Place order error:', err);
      setError(err.message || 'We couldn’t place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        {/* Back Link */}
        <button
          className="btn btn-sm btn-secondary"
          style={{ marginBottom: '1.5rem' }}
          onClick={() => setActivePage('restaurant-menu-view')}
        >
          <ArrowLeft size={16} /> Back to Menu
        </button>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
          Checkout & Pre-Order
        </h1>

        {error && (
          <div style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            color: '#be123c',
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
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Pickup Preference
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  onClick={() => setPickupType('asap')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${pickupType === 'asap' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: pickupType === 'asap' ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pickupType === 'asap' ? 'var(--primary)' : 'var(--text-primary)', fontWeight: 700 }}>
                    <Clock size={18} /> ASAP
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Ready in ~{restaurant.prep_time_minutes || 15} mins
                  </p>
                </div>

                <div
                  onClick={() => setPickupType('scheduled')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${pickupType === 'scheduled' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: pickupType === 'scheduled' ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pickupType === 'scheduled' ? 'var(--primary)' : 'var(--text-primary)', fontWeight: 700 }}>
                    <Calendar size={18} /> Schedule
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Choose future time today
                  </p>
                </div>
              </div>

              {pickupType === 'scheduled' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label className="input-label">Pick up time today</label>
                  <input
                    type="time"
                    className="input-field"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { id: 'upi', label: 'Instant UPI (Google Pay, PhonePe, Paytm)', icon: <Smartphone size={18} /> },
                  { id: 'card', label: 'Debit / Credit Card', icon: <CreditCard size={18} /> },
                  { id: 'counter', label: 'Pay at Counter Upon Pickup', icon: <Banknote size={18} /> }
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${paymentMethod === m.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      background: paymentMethod === m.id ? 'var(--primary-light)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: paymentMethod === m.id ? 700 : 500
                    }}
                  >
                    <span style={{ color: paymentMethod === m.id ? 'var(--primary)' : 'var(--text-muted)' }}>{m.icon}</span>
                    <span style={{ flex: 1 }}>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Dev Simulation Toggle */}
              <div style={{
                background: '#f8fafc',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-medium)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
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
            <div className="card" style={{ padding: '1.5rem' }}>
              <label className="input-label" style={{ fontWeight: 700 }}>Kitchen Notes / Allergies (Optional)</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="e.g., Less spicy, no mayo on side..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Bill Details */}
          <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Restaurant</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{restaurant.name}</h3>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '1rem 0' }} />

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {cartItems.map((item) => (
                <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: '6px', padding: '1px 4px' }}>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          style={{ padding: '2px 4px', color: 'var(--text-secondary)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 6px' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          style={{ padding: '2px 4px', color: 'var(--text-secondary)' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{item.totalPrice}
                  </div>
                </div>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '1rem 0' }} />

            {/* Bill Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Taxes & GST (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Convenience & Queue Skip Fee</span>
                <span>₹{convenienceFee}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: 600 }}>
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border-subtle)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '0.9rem' }}
              onClick={handlePlaceOrder}
              disabled={submitting}
            >
              {submitting ? 'Placing Pre-Order...' : `Place Order • ₹${total}`}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
              <span>Instant order transmission to kitchen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
