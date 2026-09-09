import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import PageNavHeader from '../components/PageNavHeader';
import CheckoutProgress from '../components/CheckoutProgress';
import HeritageDivider from '../components/HeritageDivider';
import { CheckCircle2, Clock, MapPin, ArrowRight, Store, QrCode, ShoppingBag, Sparkles } from 'lucide-react';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    orderAPI.getOrder(orderId)
      .then((res) => setOrder(res))
      .catch((err) => {
        console.error('Failed to load order confirmation:', err);
        setError('Order could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="bg-warm-canvas" style={{ minHeight: '80vh', padding: '5rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
          Confirming your pre-order with the Bengaluru kitchen...
        </p>
      </div>
    );
  }

  const prepMinutes = order?.prep_time_minutes || 15;
  const readyDate = order ? new Date(new Date(order.created_at).getTime() + prepMinutes * 60000) : new Date();
  const readyTimeStr = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-warm-canvas" style={{ padding: '2.5rem 0 6rem 0', minHeight: '90vh' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <PageNavHeader
          backLabel="Back to Home"
          fallbackPath="/"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'My Orders', path: '/orders' },
            { label: 'Order Confirmation' }
          ]}
        />

        {/* Visual Progress Steps */}
        <CheckoutProgress currentStep={6} />

        <div className="heritage-card" style={{
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #E8DDC8',
          boxShadow: 'var(--shadow-heritage)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Top Gold Accent Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #123C32 0%, #C6A15B 50%, #123C32 100%)'
          }} />

          {/* Royal Brass/Gold Success Emblem */}
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: '#F7F1E5',
            color: '#123C32',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            border: '2px solid #C6A15B',
            boxShadow: '0 4px 14px rgba(198, 161, 91, 0.25)'
          }}>
            <CheckCircle2 size={42} style={{ color: '#123C32' }} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--accent-gold-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-serif)',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>Pre-Order Successfully Transmitted</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.9rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: 'var(--text-charcoal)',
            marginTop: '2px',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-serif)'
          }}>
            Your order is in good hands.
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            maxWidth: '540px',
            margin: '0 auto 1.5rem auto'
          }}>
            Order <strong style={{ color: 'var(--text-charcoal)' }}>{order?.order_number || `#CQ${orderId}`}</strong> is currently preparing at <strong style={{ color: 'var(--bg-deep-green)' }}>{order?.restaurant_name || 'the restaurant'}</strong>.
            Arrive relaxed — your table and counter will have your order ready with zero wait.
          </p>

          <HeritageDivider />

          {/* Time and Pickup Card */}
          <div style={{
            background: '#F7F1E5',
            border: '1px solid #E8DDC8',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1.75rem',
            marginBottom: '2rem',
            textAlign: 'left',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--bg-deep-green)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>
                <Clock size={14} style={{ color: 'var(--accent-gold)' }} /> Estimated Ready Time
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '4px', fontFamily: 'var(--font-serif)' }}>
                {readyTimeStr}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ~{prepMinutes} mins preparation cycle
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--bg-deep-green)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>
                <MapPin size={14} style={{ color: 'var(--accent-gold)' }} /> Collection Counter
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '4px', fontFamily: 'var(--font-serif)' }}>
                {order?.restaurant_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {order?.restaurant_location || order?.restaurant_address || 'Bengaluru Counter Pickup'}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '440px', margin: '0 auto' }}>
            <Link
              to={`/orders/${orderId}`}
              className="btn btn-gold"
              style={{ padding: '0.9rem', fontSize: '0.98rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <QrCode size={18} /> Track Live Preparation & View QR Pass
            </Link>

            <Link
              to="/orders"
              className="btn btn-outline"
              style={{ padding: '0.85rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-charcoal)', borderColor: '#E8DDC8' }}
            >
              <ShoppingBag size={18} /> View All My Orders
            </Link>

            <Link
              to="/"
              style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', textDecoration: 'none', fontFamily: 'var(--font-serif)' }}
            >
              ← Back to Dining Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
