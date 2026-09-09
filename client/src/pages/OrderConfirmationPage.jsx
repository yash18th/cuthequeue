import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import PageNavHeader from '../components/PageNavHeader';
import { CheckCircle2, Clock, MapPin, ArrowRight, Store, QrCode, ShoppingBag } from 'lucide-react';

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
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Confirming your pre-order with the kitchen...</p>
      </div>
    );
  }

  const prepMinutes = order?.prep_time_minutes || 15;
  const readyDate = order ? new Date(new Date(order.created_at).getTime() + prepMinutes * 60000) : new Date();
  const readyTimeStr = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        <PageNavHeader
          backLabel="Back to Home"
          fallbackPath="/"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'My Orders', path: '/orders' },
            { label: 'Order Confirmation' }
          ]}
        />

        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'white' }}>
          {/* Green Success Icon */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            border: '2px solid var(--primary-border)'
          }}>
            <CheckCircle2 size={40} />
          </div>

          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ✓ PRE-ORDER CONFIRMED
          </span>

          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.2rem)', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '0.75rem' }}>
            Kitchen is Preparing Your Food!
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, maxWidth: '500px', margin: '0 auto 1.75rem auto' }}>
            Your order <strong>{order?.order_number || `#CQ${orderId}`}</strong> has been successfully received by <strong>{order?.restaurant_name || 'the kitchen'}</strong>.
            Head to the restaurant counter when ready to pick up without standing in any line.
          </p>

          {/* Time and Pickup Card */}
          <div style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            textAlign: 'left',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <Clock size={14} /> Estimated Ready Time
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                ~{readyTimeStr} ({prepMinutes} mins)
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <MapPin size={14} /> Pickup Counter
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {order?.restaurant_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {order?.restaurant_location || order?.restaurant_address || 'Counter Pickup'}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '420px', margin: '0 auto' }}>
            <Link
              to={`/orders/${orderId}`}
              className="btn btn-primary"
              style={{ padding: '0.85rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <QrCode size={18} /> Track Live Preparation & View QR Pass
            </Link>

            <Link
              to="/orders"
              className="btn btn-secondary"
              style={{ padding: '0.85rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <ShoppingBag size={18} /> View All My Orders
            </Link>

            <Link
              to="/"
              style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', textDecoration: 'none' }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
