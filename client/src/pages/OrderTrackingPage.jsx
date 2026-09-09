import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { orderAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useNotification } from '../context/NotificationContext';
import StatusBadge from '../components/StatusBadge';
import PageNavHeader from '../components/PageNavHeader';
import { Clock, MapPin, Phone, Bell, CheckCircle2, ArrowLeft, Sparkles, QrCode, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function OrderTrackingPage({ orderId, setActivePage }) {
  const params = useParams();
  const navigate = useNavigate();
  const effectiveOrderId = orderId || params.orderId || params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket, joinOrderRoom, leaveOrderRoom } = useSocket();
  const { notify } = useNotification();

  const loadOrder = async () => {
    if (!effectiveOrderId) return;
    try {
      const res = await orderAPI.getOrder(effectiveOrderId);
      setOrder(res);
    } catch (err) {
      console.error('Failed to load order:', err);
      setError(err.message || 'Order could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [effectiveOrderId]);

  // Real-Time Socket Connection for Order Status
  useEffect(() => {
    if (!orderId || !socket) return;

    joinOrderRoom(orderId);

    const handleStatusUpdate = (data) => {
      if (data.order_id === Number(orderId) || data.order_number === order?.order_number) {
        setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));

        if (data.status === 'accepted') {
          notify({
            title: 'Your order has been accepted 👨‍🍳',
            message: `${data.restaurant_name || 'Restaurant'} accepted your order. Kitchen prep starting soon!`,
            type: 'info'
          });
        } else if (data.status === 'preparing') {
          notify({
            title: 'Your food is being prepared 🍳',
            message: 'Kitchen is preparing your order now while you travel. Head over when ready!',
            type: 'info'
          });
        } else if (data.status === 'ready') {
          notify({
            title: 'Your food is ready! 🎉',
            message: `Order ${data.order_number} is ready. Head to ${data.restaurant_name || 'the restaurant'} and skip the queue!`,
            type: 'ready',
            sound: true,
            vibrate: true,
            soundType: 'ready',
            duration: 9000
          });
        } else if (data.status === 'completed') {
          notify({
            title: 'Order picked up successfully! ✅',
            message: 'Nice! You skipped the queue and saved time.',
            type: 'success'
          });
        }
      }
    };

    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      socket.off('order:status_updated', handleStatusUpdate);
      leaveOrderRoom(orderId);
    };
  }, [orderId, socket, order?.order_number, notify]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading real-time order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-rose)', fontSize: '1.1rem', marginBottom: '1rem' }}>{error || 'Order not found.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} /> View All Orders
        </button>
      </div>
    );
  }

  // Stepper Calculation
  const steps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'completed', label: 'Picked Up' }
  ];

  const statusOrder = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
  const currentIndex = statusOrder.indexOf(order.status);
  const isRejectedOrCancelled = ['rejected', 'cancelled'].includes(order.status);

  const prepTime = order.prep_time_minutes || 15;
  const timeSaved = prepTime + 3;
  const orderDate = new Date(order.created_at);
  const readyDate = new Date(orderDate.getTime() + prepTime * 60000);
  const readyTimeFormatted = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        {/* Contextual Back Navigation & Breadcrumb Header */}
        <PageNavHeader
          backLabel="Back to My Orders"
          fallbackPath="/orders"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'My Orders', path: '/orders' },
            { label: `Order ${order.order_number}` }
          ]}
          extraAction={
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />
              Live Kitchen Tracking
            </span>
          }
        />

        {/* HERO TIME-SAVING BADGE */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.14) 100%)',
          border: '1.5px solid rgba(16,185,129,0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.1rem 1.4rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#10b981',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
            }}>
              ⏱️
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1rem', letterSpacing: '-0.01em' }}>
                {order.status === 'completed'
                  ? `Nice! You skipped the queue and saved ~${timeSaved} minutes.`
                  : `You saved approximately ${timeSaved} minutes.`}
              </div>
              <div style={{ fontSize: '0.825rem', color: '#047857', marginTop: '2px' }}>
                {order.status === 'completed'
                  ? 'Your order was prepared before you arrived. Walked in, picked up, done!'
                  : 'Food prepares while you travel. Walk in and collect immediately when ready.'}
              </div>
            </div>
          </div>
          <div style={{
            background: '#047857',
            color: 'white',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            ~{timeSaved} MIN SAVED
          </div>
        </div>

        {/* Big Ready Notification Banner when status is 'ready' */}
        {order.status === 'ready' && (
          <div
            className="pulse-ready"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: 'white',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem',
              flexWrap: 'wrap',
              boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Your food is ready! 🎉</h2>
                <p style={{ fontSize: '1rem', color: '#ecfdf5', margin: '4px 0 0 0', fontWeight: 600 }}>
                  Head to the restaurant and skip the queue. Order {order.order_number} is waiting at the counter.
                </p>
              </div>
            </div>
            <a
              href="#qr-section"
              className="btn btn-sm"
              style={{ background: 'white', color: '#047857', fontWeight: 800, padding: '0.65rem 1.25rem' }}
            >
              Show Pickup Pass &darr;
            </a>
          </div>
        )}

        {/* Order Header Card */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                  Order {order.order_number}
                </h1>
                <StatusBadge status={order.status} size="large" />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                Placed at {order.restaurant_name} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹{order.total}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                Payment {order.payment_status?.toUpperCase() || 'SUCCESSFUL'}
              </span>
            </div>
          </div>

          {/* Stepper Timeline Tracker */}
          {!isRejectedOrCancelled ? (
            <div className="stepper-container">
              <div className="stepper-line">
                <div
                  className="stepper-line-progress"
                  style={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {steps.map((step, idx) => {
                const isPassed = currentIndex >= idx;
                const isCurrent = currentIndex === idx;

                return (
                  <div key={step.key} className="stepper-step">
                    <div
                      className={`step-circle ${isPassed ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 size={20} /> : idx + 1}
                    </div>
                    <span className={`step-label ${isCurrent ? 'active' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              background: '#ffe4e6',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              color: '#be123c',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={20} />
              <span>
                <strong>Order {order.status.toUpperCase()}:</strong> This order was not completed. If debited, your refund has been processed.
              </span>
            </div>
          )}

          {/* Estimated Ready Time & Queue Progress Info */}
          {order.status !== 'completed' && !isRejectedOrCancelled && (
            <div style={{
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Clock size={16} style={{ color: 'var(--primary)' }} />
                  <span>Estimated Ready Time:</span>
                </div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                  {readyTimeFormatted} (~{order.prep_time_minutes || 15} min prep)
                </strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                We'll notify you the moment your food is ready so you can pick it up hot with zero queue wait.
              </div>
            </div>
          )}
        </div>

        {/* QR Code Pickup Section */}
        <div id="qr-section" className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', background: 'white' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            <QrCode size={16} /> Pickup Counter Pass
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            {order.status === 'ready' ? 'Ready for Pickup!' : 'Pickup Pass for Counter'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.25rem auto', lineHeight: 1.5 }}>
            Show this QR code at the <strong>{order.restaurant_name}</strong> pickup counter. The kitchen staff will verify and hand over your fresh order.
          </p>

          <div style={{
            background: '#ffffff',
            display: 'inline-block',
            padding: '1.25rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid var(--border-subtle)',
            marginBottom: '1rem'
          }}>
            <QRCodeSVG
              value={order.qr_code_token}
              size={210}
              level="H"
              includeMargin={true}
            />
          </div>

          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Order {order.order_number}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
            Pickup Code: <strong>{order.qr_code_token?.substring(0, 8).toUpperCase()}</strong>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Counter: {order.restaurant_name}
          </div>

          {order.status === 'completed' && (
            <div style={{
              marginTop: '1.5rem',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: '#ecfdf5',
              color: '#047857',
              padding: '0.85rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(16,185,129,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 800 }}>
                <CheckCircle2 size={18} /> Order Picked Up Successfully
              </div>
              <div style={{ fontSize: '0.8rem', color: '#065f46' }}>
                Nice! You skipped the queue and saved ~{timeSaved} minutes.
              </div>
            </div>
          )}
        </div>

        {/* Order Details & Summary */}
        <div className="card" style={{ padding: '1.75rem', background: 'white' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {(order.items || []).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                    {item.item_name} × {item.quantity}
                  </div>
                  {Object.entries(item.customizations || {}).length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {Object.entries(item.customizations).map(([k, v]) => (
                        <span key={k} style={{ marginRight: '6px' }}>
                          {k}: {Array.isArray(v) ? v.join(', ') : v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  ₹{item.total_price}
                </div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '1rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Taxes</span>
              <span>₹{order.tax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Convenience Fee</span>
              <span>₹{order.fee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              <span>Total Paid</span>
              <span>₹{order.total}</span>
            </div>
          </div>

          {/* Restaurant Contact Box */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem'
          }}>
            <div>
              <div style={{ fontWeight: 700 }}>{order.restaurant_name}</div>
              <div style={{ color: 'var(--text-muted)' }}>{order.restaurant_address}</div>
            </div>
            {order.restaurant_phone && (
              <a
                href={`tel:${order.restaurant_phone}`}
                className="btn btn-sm btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Phone size={14} /> Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
