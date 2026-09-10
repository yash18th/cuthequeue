import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { restaurantAPI } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import {
  Clock,
  Flame,
  PackageCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  QrCode,
  DollarSign,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';

export default function AdminDashboardPage({ onOpenScanner }) {
  const { restaurant } = useAuth();
  const { socket } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState('active'); // active, pending, preparing, ready, completed
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return;
    try {
      const res = await restaurantAPI.getOrders(restaurant.id);
      const list = res.orders || res || [];
      setOrders(list);
      setError('');
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load live orders');
    } finally {
      setLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (payload) => {
      const newOrder = payload?.order || payload;
      if (!newOrder || (!newOrder.id && !newOrder.order_number)) return;

      const normalized = {
        ...newOrder,
        total_amount: newOrder.total_amount !== undefined ? newOrder.total_amount : newOrder.total
      };

      setOrders((prev) => {
        const exists = prev.some((o) => (o.id && normalized.id && o.id === normalized.id) || (o.order_number && normalized.order_number && o.order_number === normalized.order_number));
        if (exists) {
          return prev.map((o) => ((o.id && normalized.id && o.id === normalized.id) || (o.order_number && normalized.order_number && o.order_number === normalized.order_number)) ? { ...o, ...normalized } : o);
        }
        return [normalized, ...prev];
      });

      // Background reconciliation with database
      fetchOrders();
    };

    const handleStatusChanged = (updated) => {
      if (!updated) return;
      const targetId = updated.orderId || updated.id || updated.order_id;
      const newStatus = updated.status;
      if (!newStatus) return;

      setOrders((prev) =>
        prev.map((o) => (o.id === targetId || (updated.order_number && o.order_number === updated.order_number) ? { ...o, status: newStatus } : o))
      );

      // Background reconciliation with database
      fetchOrders();
    };

    socket.on('order:created', handleNewOrder);
    socket.on('order:status_changed', handleStatusChanged);
    socket.on('order:restaurant_status_updated', handleStatusChanged);
    socket.on('order:status_updated', handleStatusChanged);

    return () => {
      socket.off('order:created', handleNewOrder);
      socket.off('order:status_changed', handleStatusChanged);
      socket.off('order:restaurant_status_updated', handleStatusChanged);
      socket.off('order:status_updated', handleStatusChanged);
    };
  }, [socket, fetchOrders]);

  // Update order status action
  const handleUpdateStatus = async (orderId, newStatus, prepMinutes) => {
    setUpdatingId(orderId);
    try {
      await restaurantAPI.updateOrderStatus(orderId, newStatus, prepMinutes);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter calculations
  const activeOrders = orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status?.toLowerCase()));
  const pendingOrders = orders.filter((o) => ['pending', 'confirmed'].includes(o.status?.toLowerCase()));
  const preparingOrders = orders.filter((o) => o.status?.toLowerCase() === 'preparing');
  const readyOrders = orders.filter((o) => o.status?.toLowerCase() === 'ready');
  const completedOrders = orders.filter((o) => o.status?.toLowerCase() === 'completed');

  const displayedOrders = orders.filter((o) => {
    // Tab filter
    if (filterTab === 'active' && !['pending', 'confirmed', 'preparing', 'ready'].includes(o.status?.toLowerCase())) {
      return false;
    }
    if (filterTab === 'pending' && !['pending', 'confirmed'].includes(o.status?.toLowerCase())) {
      return false;
    }
    if (filterTab === 'preparing' && o.status?.toLowerCase() !== 'preparing') {
      return false;
    }
    if (filterTab === 'ready' && o.status?.toLowerCase() !== 'ready') {
      return false;
    }
    if (filterTab === 'completed' && o.status?.toLowerCase() !== 'completed') {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o.id).includes(q) || String(o.order_number || '').includes(q);
      const matchCustomer = (o.customer_name || o.user_name || '').toLowerCase().includes(q);
      const matchCode = (o.pickup_code || '').toLowerCase().includes(q);
      const matchItem = o.items?.some((i) => (i.item_name || i.name || '').toLowerCase().includes(q));
      return matchId || matchCustomer || matchCode || matchItem;
    }

    return true;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0);

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        {/* Restaurant Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FCFAF6 100%)',
          border: '1px solid #C49A52',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C49A52', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Operational Kitchen Queue
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
            </div>
            <h1 className="font-royal" style={{ fontSize: '1.8rem', color: '#0B352D', marginTop: '2px' }}>
              {restaurant?.name || 'Restaurant Kitchen'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5C6E6A' }}>
              {restaurant?.branch_name ? `${restaurant.branch_name} • ` : ''}Bengaluru Heritage Dining • Live Ticket Dispatch
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={fetchOrders}
              className="btn-outline-gold"
              title="Refresh Orders"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onOpenScanner}
              className="btn-gold"
            >
              <QrCode size={16} />
              <span>Verify Pickup Code</span>
            </button>
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="admin-card" style={{ padding: '1.25rem', borderLeft: '4px solid #C49A52' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5C6E6A', fontSize: '0.82rem', fontWeight: 600 }}>
              <span>Active In Queue</span>
              <Flame size={18} style={{ color: '#C49A52' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0B352D', marginTop: '4px' }}>
              {activeOrders.length}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#5C6E6A' }}>Requires preparation or pickup</span>
          </div>

          <div className="admin-card" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5C6E6A', fontSize: '0.82rem', fontWeight: 600 }}>
              <span>In Kitchen Preparation</span>
              <Clock size={18} style={{ color: '#F59E0B' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0B352D', marginTop: '4px' }}>
              {preparingOrders.length}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#5C6E6A' }}>Cooking now</span>
          </div>

          <div className="admin-card" style={{ padding: '1.25rem', borderLeft: '4px solid #22C55E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5C6E6A', fontSize: '0.82rem', fontWeight: 600 }}>
              <span>Ready at Counter</span>
              <PackageCheck size={18} style={{ color: '#22C55E' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0B352D', marginTop: '4px' }}>
              {readyOrders.length}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#5C6E6A' }}>Awaiting pickup</span>
          </div>

          <div className="admin-card" style={{ padding: '1.25rem', borderLeft: '4px solid #123F35' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5C6E6A', fontSize: '0.82rem', fontWeight: 600 }}>
              <span>Today's Total Volume</span>
              <TrendingUp size={18} style={{ color: '#123F35' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0B352D', marginTop: '4px' }}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#5C6E6A' }}>{orders.length} total tickets today</span>
          </div>
        </div>

        {/* Filter Controls and Search */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#FFFFFF', padding: '4px', borderRadius: '8px', border: '1px solid #E8E0D2' }}>
            <button
              type="button"
              onClick={() => setFilterTab('active')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                background: filterTab === 'active' ? '#0B352D' : 'transparent',
                color: filterTab === 'active' ? '#F8F1DF' : '#5C6E6A',
                transition: 'all 0.15s'
              }}
            >
              Active Queue ({activeOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                background: filterTab === 'pending' ? '#0B352D' : 'transparent',
                color: filterTab === 'pending' ? '#F8F1DF' : '#5C6E6A',
                transition: 'all 0.15s'
              }}
            >
              Incoming ({pendingOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('preparing')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                background: filterTab === 'preparing' ? '#0B352D' : 'transparent',
                color: filterTab === 'preparing' ? '#F8F1DF' : '#5C6E6A',
                transition: 'all 0.15s'
              }}
            >
              In Kitchen ({preparingOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('ready')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                background: filterTab === 'ready' ? '#0B352D' : 'transparent',
                color: filterTab === 'ready' ? '#F8F1DF' : '#5C6E6A',
                transition: 'all 0.15s'
              }}
            >
              Ready ({readyOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('completed')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                background: filterTab === 'completed' ? '#0B352D' : 'transparent',
                color: filterTab === 'completed' ? '#F8F1DF' : '#5C6E6A',
                transition: 'all 0.15s'
              }}
            >
              Completed ({completedOrders.length})
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#5C6E6A' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, dish, customer..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #E8E0D2',
                fontSize: '0.88rem',
                outline: 'none',
                background: '#FFFFFF'
              }}
            />
          </div>
        </div>

        {/* Live Orders Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #E8E0D2',
              borderTopColor: '#C49A52',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ color: '#5C6E6A', fontWeight: 600 }}>Syncing Live Tickets...</span>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="admin-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#F8F4EC',
              color: '#C49A52',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <ShoppingBag size={28} />
            </div>
            <h3 className="font-royal" style={{ fontSize: '1.3rem', color: '#0B352D', marginBottom: '4px' }}>
              No Tickets In This View
            </h3>
            <p style={{ color: '#5C6E6A', fontSize: '0.88rem' }}>
              {searchQuery ? 'No orders match your search criteria.' : 'When new pre-orders arrive, they will appear here instantly with live sound alerts.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.25rem'
          }}>
            {displayedOrders.map((order) => {
              const isUpdating = updatingId === order.id;
              return (
                <div
                  key={order.id}
                  className="admin-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderTop: `4px solid ${
                      order.status === 'ready' ? '#22C55E' : order.status === 'preparing' ? '#F59E0B' : '#C49A52'
                    }`
                  }}
                >
                  <div style={{ padding: '1.25rem' }}>
                    {/* Header: Order Number, Time, Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B352D', fontFamily: 'var(--font-heading)' }}>
                            #{order.order_number || order.id}
                          </span>
                          {order.pickup_code && (
                            <span style={{
                              background: '#F8F4EC',
                              border: '1px dashed #C49A52',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: '#78252F'
                            }}>
                              CODE: {order.pickup_code}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#5C6E6A' }}>
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          {order.customer_name ? ` • ${order.customer_name}` : ''}
                        </span>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Order Items List */}
                    <div style={{
                      background: '#FCFAF6',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '12px',
                      border: '1px solid #E8E0D2'
                    }}>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.85rem',
                              padding: '4px 0',
                              borderBottom: idx < order.items.length - 1 ? '1px dashed #E8E0D2' : 'none'
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#1E2927' }}>
                              <strong style={{ color: '#C49A52', marginRight: '6px' }}>{item.quantity}x</strong>
                              {item.item_name || item.name || 'Dish'}
                            </span>
                            <span style={{ color: '#5C6E6A', fontWeight: 600 }}>
                              ₹{Number(item.subtotal || (item.price * item.quantity) || 0)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: '#5C6E6A' }}>
                          Pre-ordered items ({order.total_amount || order.total ? `Total: ₹${order.total_amount || order.total}` : 'Custom items'})
                        </div>
                      )}
                    </div>

                    {/* Customer Notes */}
                    {order.notes && (
                      <div style={{
                        fontSize: '0.78rem',
                        color: '#78252F',
                        background: '#FFF5F5',
                        border: '1px solid #FED7D7',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        marginBottom: '10px'
                      }}>
                        <strong>Note:</strong> {order.notes}
                      </div>
                    )}

                    {/* Order Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#0B352D' }}>
                      <span>Amount Payable</span>
                      <span style={{ color: '#C49A52', fontSize: '1rem' }}>₹{Number(order.total_amount || order.total || 0)}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div style={{
                    padding: '12px 1.25rem',
                    background: '#F8F4EC',
                    borderTop: '1px solid #E8E0D2',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {['pending', 'confirmed'].includes(order.status?.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'preparing', 15)}
                        disabled={isUpdating}
                        className="btn-gold"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.84rem' }}
                      >
                        <Flame size={14} />
                        <span>Start Preparation (15m)</span>
                      </button>
                    )}

                    {order.status?.toLowerCase() === 'preparing' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        disabled={isUpdating}
                        className="btn-gold"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.84rem' }}
                      >
                        <PackageCheck size={14} />
                        <span>Mark Ready for Pickup</span>
                      </button>
                    )}

                    {order.status?.toLowerCase() === 'ready' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        disabled={isUpdating}
                        className="btn-forest"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.84rem' }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Hand Over & Complete</span>
                      </button>
                    )}

                    {order.status?.toLowerCase() === 'completed' && (
                      <div style={{ width: '100%', textAlign: 'center', fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>
                        ✓ Completed & Handed Over
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
