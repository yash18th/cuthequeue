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
    { key: 'pending', label: 'Order Received' },
    { key: 'accepted', label: 'Restaurant Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'completed', label: 'Completed' }
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
    <div className="bg-warm-canvas" style={{ padding: '2.5rem 0 6rem 0', minHeight: '90vh' }}>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--bg-deep-green)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-serif)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-gold)', animation: 'pulse 1.5s infinite' }} />
              Live Kitchen Concierge
            </span>
          }
        />

        {/* HERO TIME-SAVING BADGE */}
        <div style={{
          background: 'linear-gradient(135deg, #0B2923 0%, #123C32 100%)',
          border: '1px solid #C6A15B',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#F7F1E5',
              color: 'var(--bg-deep-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              border: '1.5px solid #C6A15B',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              ⏱️
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#F7F1E5', fontSize: '1.05rem', letterSpacing: '-0.01em', fontFamily: 'var(--font-serif)' }}>
                {order.status === 'completed'
                  ? `Order complete! You saved ~${timeSaved} minutes in line.`
                  : `You're saving approximately ${timeSaved} minutes today.`}
              </div>
              <div style={{ fontSize: '0.825rem', color: '#E8DDC8', marginTop: '2px' }}>
                {order.status === 'completed'
                  ? 'Your meal was ready the moment you arrived. Zero counter queue wait.'
                  : 'Food prepares while you travel. Walk in and collect immediately when ready.'}
              </div>
            </div>
          </div>
          <div style={{
            background: '#C6A15B',
            color: '#0B2923',
            padding: '0.4rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            fontFamily: 'var(--font-serif)'
          }}>
            ~{timeSaved} MIN SAVED
          </div>
        </div>

        {/* Big Ready Notification Banner when status is 'ready' */}
        {order.status === 'ready' && (
          <div
            className="pulse-ready"
            style={{
              background: 'linear-gradient(135deg, #123C32 0%, #1a5346 100%)',
              color: '#F7F1E5',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem',
              flexWrap: 'wrap',
              border: '2px solid #C6A15B',
              boxShadow: '0 10px 25px rgba(18, 60, 50, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(198, 161, 91, 0.2)',
                border: '1.5px solid #C6A15B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C6A15B'
              }}>
                <Bell size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-serif)', color: '#F7F1E5' }}>Your food is ready! 🎉</h2>
                <p style={{ fontSize: '0.95rem', color: '#E8DDC8', margin: '4px 0 0 0', fontWeight: 600 }}>
                  Head to the counter and skip the queue. Order {order.order_number} is hot and ready for collection.
                </p>
              </div>
            </div>
            <a
              href="#qr-section"
              className="btn btn-gold btn-sm"
              style={{ fontWeight: 800, padding: '0.65rem 1.25rem' }}
            >
              Show Pickup Pass &darr;
            </a>
          </div>
        )}

        {/* Order Header Card */}
        <div className="heritage-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--text-charcoal)' }}>
                  Order {order.order_number}
                </h1>
                <StatusBadge status={order.status} size="large" />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                Placed at <strong style={{ color: 'var(--text-charcoal)' }}>{order.restaurant_name}</strong> • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--bg-deep-green)', fontFamily: 'var(--font-serif)' }}>
                ₹{order.total}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-serif)' }}>
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
                  style={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%`, background: 'var(--bg-deep-green)' }}
                />
              </div>

              {steps.map((step, idx) => {
                const isPassed = currentIndex >= idx;
                const isCurrent = currentIndex === idx;

                return (
                  <div key={step.key} className="stepper-step">
                    <div
                      className={`step-circle ${isPassed ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                      style={{
                        background: isPassed ? '#123F35' : '#F7F0E2',
                        borderColor: isCurrent ? '#C49A52' : (isPassed ? '#123F35' : '#E9DDC7'),
                        color: isPassed ? '#F7F0E2' : '#57534E',
                        boxShadow: isCurrent ? '0 0 14px rgba(196, 154, 82, 0.8)' : 'none',
                        animation: isCurrent ? 'queuePulseGlow 2s infinite ease-in-out' : 'none'
                      }}
                    >
                      {isPassed ? <CheckCircle2 size={20} /> : idx + 1}
                    </div>
                    <span className={`step-label ${isCurrent ? 'active' : ''}`} style={{ fontFamily: 'var(--font-serif)', color: isCurrent ? '#123F35' : '#57534E', fontWeight: isCurrent ? 800 : 600 }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              background: '#FEF2F2',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-maroon)',
              border: '1px solid #F87171',
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
              background: '#F7F1E5',
              borderRadius: 'var(--radius-md)',
              padding: '1.1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.9rem',
              border: '1px solid #E8DDC8',
              marginTop: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Clock size={16} style={{ color: 'var(--accent-gold)' }} />
                  <span style={{ fontWeight: 700 }}>Estimated Ready Time:</span>
                </div>
                <strong style={{ color: 'var(--text-charcoal)', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>
                  {readyTimeFormatted} (~{order.prep_time_minutes || 15} min prep)
                </strong>
              </div>

              {/* Live Kitchen Queue Counter */}
              <div style={{
                background: 'white',
                border: '1px solid #E8DDC8',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`queue-pill-${order.queue_status || 'moderate'}`}>
                    <span className="dot" />
                    {order.queue_status === 'low' ? 'Low Queue' :
                     order.queue_status === 'busy' ? 'Busy Queue' :
                     order.queue_status === 'very_busy' ? 'High Rush' : 'Moderate Queue'}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                    {order.orders_ahead !== undefined && order.orders_ahead > 0
                      ? `${order.orders_ahead} ${order.orders_ahead === 1 ? 'order' : 'orders'} ahead in kitchen queue`
                      : 'Priority: Preparing next at kitchen counter'}
                  </span>
                </div>
                {order.branch_name && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Branch: {order.branch_name}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bg-deep-green)' }} />
                We'll notify you the moment your food is ready so you can pick it up hot with zero queue wait.
              </div>
            </div>
          )}
        </div>

        {/* QR Code Pickup Section */}
        <div id="qr-section" className="heritage-card" style={{ padding: '2.25rem', textAlign: 'center', marginBottom: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-gold-muted)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
            <QrCode size={16} style={{ color: 'var(--accent-gold)' }} /> Pickup Counter Pass
          </div>

          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.01em', fontFamily: 'var(--font-serif)', color: 'var(--text-charcoal)' }}>
            {order.status === 'ready' ? 'Ready for Pickup!' : 'Pickup Pass for Counter'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Show this QR pass at the <strong>{order.restaurant_name}</strong> pickup counter. The kitchen staff will scan and hand over your hot meal.
          </p>

          <div style={{
            background: '#ffffff',
            display: 'inline-block',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 20px rgba(18, 60, 50, 0.08)',
            border: '2px solid #C6A15B',
            marginBottom: '1.25rem'
          }}>
            <QRCodeSVG
              value={order.qr_code_token}
              size={210}
              level="H"
              includeMargin={true}
            />
          </div>

          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
            Order {order.order_number}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
            Pickup Code: <strong style={{ color: 'var(--bg-deep-green)' }}>{order.qr_code_token?.substring(0, 8).toUpperCase()}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Counter: {order.restaurant_name}
          </div>

          {order.status === 'completed' && (
            <div style={{
              marginTop: '1.5rem',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: '#F7F1E5',
              color: 'var(--bg-deep-green)',
              padding: '0.85rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #C6A15B'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>
                <CheckCircle2 size={18} /> Order Picked Up Successfully
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Nice! You skipped the queue and saved ~{timeSaved} minutes.
              </div>
            </div>
          )}
        </div>

        {/* Order Details & Summary */}
        <div className="heritage-card" style={{ padding: '1.75rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E8DDC8', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {(order.items || []).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)' }}>
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
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--bg-deep-green)', fontFamily: 'var(--font-serif)' }}>
                  ₹{item.total_price}
                </div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E8DDC8', margin: '1rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 700 }}>₹{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Taxes</span>
              <span style={{ fontWeight: 700 }}>₹{order.tax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Convenience Fee</span>
              <span style={{ fontWeight: 700 }}>₹{order.fee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '0.5rem', fontFamily: 'var(--font-serif)' }}>
              <span>Total Paid</span>
              <span style={{ color: 'var(--bg-deep-green)' }}>₹{order.total}</span>
            </div>
          </div>

          {/* Restaurant Contact Box */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: '#F7F1E5',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #E8DDC8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem'
          }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-charcoal)', fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>{order.restaurant_name}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{order.restaurant_address}</div>
            </div>
            {order.restaurant_phone && (
              <a
                href={`tel:${order.restaurant_phone}`}
                className="btn btn-sm btn-forest"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.9rem' }}
              >
                <Phone size={14} style={{ color: '#C6A15B' }} /> Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
