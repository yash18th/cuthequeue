import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotification } from '../context/NotificationContext';
import { orderAPI, analyticsAPI } from '../utils/api';
import QRScannerModal from '../components/QRScannerModal';
import StatusBadge from '../components/StatusBadge';
import { QrCode, Bell, Flame, CheckCircle2, XCircle, ArrowRight, RefreshCw, Volume2, Clock, Phone, AlertCircle } from 'lucide-react';

export default function RestaurantDashboard({ setActivePage }) {
  const { user, restaurant } = useAuth();
  const { socket } = useSocket();
  const { notify } = useNotification();

  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    pending: 0,
    preparing: 0,
    completed: 0,
    todayRevenue: 0
  });
  const [activeColumn, setActiveColumn] = useState('all'); // 'all', 'pending', 'preparing', 'ready', 'completed'
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const loadDashboardData = async () => {
    if (!restaurant?.id) return;
    try {
      const [ordersData, analyticsData] = await Promise.all([
        orderAPI.getRestaurantOrders(restaurant.id),
        analyticsAPI.getRestaurantAnalytics(restaurant.id)
      ]);
      setOrders(ordersData);
      if (analyticsData.metrics) {
        setMetrics(analyticsData.metrics);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [restaurant?.id]);

  // Real-time socket events for kitchen orders
  useEffect(() => {
    if (!socket || !restaurant?.id) return;

    const handleNewOrder = (data) => {
      if (data.order?.restaurant_id === restaurant.id) {
        setOrders((prev) => [data.order, ...prev.filter((o) => o.id !== data.order.id)]);
        setMetrics((m) => ({
          ...m,
          todayOrders: m.todayOrders + 1,
          pending: m.pending + 1
        }));
      }
    };

    const handleStatusSync = (data) => {
      if (data.restaurant_id === restaurant.id) {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.order_id ? { ...o, status: data.status } : o))
        );
      }
    };

    socket.on('order:created', handleNewOrder);
    socket.on('order:restaurant_status_updated', handleStatusSync);

    return () => {
      socket.off('order:created', handleNewOrder);
      socket.off('order:restaurant_status_updated', handleStatusSync);
    };
  }, [socket, restaurant?.id]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      // Reload metrics in background
      if (restaurant?.id) {
        analyticsAPI.getRestaurantAnalytics(restaurant.id).then((res) => {
          if (res.metrics) setMetrics(res.metrics);
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  if (!restaurant) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p>No restaurant profile linked with this administrator account.</p>
      </div>
    );
  }

  // Filter orders by active column tab
  const filteredOrders = activeColumn === 'all'
    ? orders
    : orders.filter((o) => o.status === activeColumn);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  // Prioritize Kitchen Queue
  const activeQueueOrders = orders
    .filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status))
    .sort((a, b) => {
      const priority = { preparing: 1, accepted: 2, pending: 3 };
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container">
        {/* Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                {restaurant.name} {restaurant.branch_name ? `(${restaurant.branch_name})` : ''} Kitchen
              </h1>
              <span className={`badge ${restaurant.is_open ? 'badge-open' : 'badge-closed'}`}>
                {restaurant.is_open ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Live Order Management & Real-Time Queue Operations • Order Before You Arrive
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadDashboardData}
              title="Refresh tickets"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
              onClick={() => setIsQRModalOpen(true)}
            >
              <QrCode size={18} /> Verify Pickup QR
            </button>
          </div>
        </div>

        {/* Top Statistic KPI Tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Today's Orders
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
              {orders.length}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
              New / Pending
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
              {pendingCount}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase' }}>
              In Kitchen (Prep)
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6d28d9', marginTop: '4px' }}>
              {preparingCount}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
              Ready for Pickup
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
              {readyCount}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
              Today's Revenue
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              ₹{metrics.todayRevenue || 0}
            </div>
          </div>
        </div>

        {/* CURRENT KITCHEN QUEUE */}
        {activeQueueOrders.length > 0 && (
          <div className="card" style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} style={{ color: '#ef4444' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  CURRENT KITCHEN QUEUE
                </h2>
                <span style={{
                  background: '#e2e8f0',
                  color: '#334155',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  {activeQueueOrders.length} in queue
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Prioritized: Order Time • Requested Pickup Time • Kitchen Prep Duration
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '0.75rem'
            }}>
              {activeQueueOrders.map((qOrder) => (
                <div
                  key={qOrder.id}
                  style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    border: qOrder.status === 'pending' ? '1.5px solid #f59e0b' : qOrder.status === 'preparing' ? '1.5px solid #8b5cf6' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      #{qOrder.order_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {qOrder.pickup_type === 'scheduled' ? `Scheduled: ${qOrder.scheduled_time}` : 'Ready ASAP'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: qOrder.status === 'preparing' ? '#f5f3ff' : qOrder.status === 'accepted' ? '#eff6ff' : '#fef3c7',
                      color: qOrder.status === 'preparing' ? '#7c3aed' : qOrder.status === 'accepted' ? '#2563eb' : '#b45309'
                    }}>
                      {qOrder.status}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ~{qOrder.prep_time_minutes || 15}m prep
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'all', label: `All Orders (${orders.length})` },
            { id: 'pending', label: `New Incoming (${pendingCount})` },
            { id: 'preparing', label: `Preparing (${preparingCount})` },
            { id: 'ready', label: `Ready for Pickup (${readyCount})` },
            { id: 'completed', label: `Completed (${completedCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveColumn(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeColumn === tab.id ? 'var(--primary)' : 'var(--bg-subtle)',
                color: activeColumn === tab.id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Feed Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading kitchen queue...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'white' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              No orders in this column right now.
            </p>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Incoming orders from customers will appear here in real time.
            </span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredOrders.map((order) => {
              const isPending = order.status === 'pending';
              const isAccepted = order.status === 'accepted';
              const isPreparing = order.status === 'preparing';
              const isReady = order.status === 'ready';

              return (
                <div
                  key={order.id}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    border: isPending ? '2px solid #f59e0b' : isReady ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                    boxShadow: isPending ? '0 4px 15px rgba(245, 158, 11, 0.15)' : 'var(--shadow-card)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          #{order.order_number}
                        </h3>
                        <StatusBadge status={order.status} />
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Order Time: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Customer: <strong>{order.customer_name}</strong>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                        ₹{order.total}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                        {order.pickup_type === 'scheduled' ? `Scheduled: ${order.scheduled_time}` : 'Ready ASAP'}
                      </span>
                    </div>
                  </div>

                  {/* Preparation time indicator */}
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Clock size={14} style={{ color: 'var(--primary)' }} />
                    <span>Prep Time: <strong>~{order.prep_time_minutes || 15} min</strong></span>
                  </div>

                  {/* Customer Notes */}
                  {order.notes && (
                    <div style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      marginBottom: '0.85rem'
                    }}>
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}

                  {/* Item Rows */}
                  <div style={{
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    marginBottom: '1.25rem',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {(order.items || []).map((itm, iIdx) => (
                      <div key={iIdx} style={{ fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span>{itm.quantity} × {itm.item_name}</span>
                          <span>₹{itm.total_price}</span>
                        </div>
                        {Object.entries(itm.customizations || {}).length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                            {Object.entries(itm.customizations).map(([k, v]) => (
                              <span key={k} style={{ marginRight: '6px' }}>
                                + {Array.isArray(v) ? v.join(', ') : v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Operational Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                    {isPending && (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ flex: 1 }}
                          disabled={actionLoading === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'accepted')}
                        >
                          Accept Order
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ flex: 1, background: '#7c3aed' }}
                          disabled={actionLoading === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        >
                          Start Preparing
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ color: 'var(--accent-rose)' }}
                          disabled={actionLoading === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', background: '#7c3aed' }}
                        disabled={actionLoading === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      >
                        Start Preparing
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', background: '#059669' }}
                        disabled={actionLoading === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                      >
                        <Bell size={16} /> Mark Ready
                      </button>
                    )}

                    {isReady && (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ flex: 1, border: '1.5px solid var(--primary)', color: 'var(--primary)' }}
                          onClick={() => setIsQRModalOpen(true)}
                        >
                          <QrCode size={14} /> Verify Pickup
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ flex: 1, background: '#059669' }}
                          disabled={actionLoading === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                        >
                          <CheckCircle2 size={14} /> Hand Over
                        </button>
                      </div>
                    )}

                    {order.status === 'completed' && (
                      <div style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        ✓ Order Picked Up Successfully
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QR Verification Modal */}
        <QRScannerModal
          restaurantId={restaurant.id}
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          onOrderVerified={(verifiedOrder) => {
            loadDashboardData();
          }}
        />
      </div>
    </div>
  );
}
