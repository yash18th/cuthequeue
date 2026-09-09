import React, { useState, useEffect } from 'react';
import { orderAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import StatusBadge from '../components/StatusBadge';
import { Clock, RotateCcw, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OrderHistoryPage({ setActivePage, setTrackedOrderId, setSelectedRestaurantId }) {
  const [orders, setOrders] = useState({ active: [], previous: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'previous'
  const { addItem } = useCart();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderAPI.getMyOrders();
      setOrders(data);
      // If no active orders, default to previous tab
      if (data.active.length === 0 && data.previous.length > 0) {
        setActiveTab('previous');
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOrderAgain = (order) => {
    // Navigate to restaurant menu so user can review or customize
    setSelectedRestaurantId(order.restaurant_id);
    setActivePage('restaurant-menu-view');
  };

  const currentList = activeTab === 'active' ? orders.active : orders.previous;

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
          My Orders
        </h1>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px',
          marginBottom: '2rem',
          maxWidth: '380px'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'active' ? 'white' : 'transparent',
              color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'active' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            Active Pre-Orders ({orders.active.length})
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'previous' ? 'white' : 'transparent',
              color: activeTab === 'previous' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'previous' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            Previous Orders ({orders.previous.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading orders...
          </div>
        ) : currentList.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'white' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--bg-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              marginBottom: '1rem'
            }}>
              <ShoppingBag size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No {activeTab} orders
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {activeTab === 'active' ? 'You don’t have any food currently in the queue.' : 'You have not placed any completed orders yet.'}
            </p>
            <button className="btn btn-primary" onClick={() => setActivePage('home')}>
              Order from Campus Kitchens
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {currentList.map((order) => (
              <div
                key={order.id}
                className="card card-hover"
                style={{
                  padding: '1.5rem',
                  background: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setTrackedOrderId(order.id);
                  setActivePage('order-tracking');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                        {order.restaurant_name}
                      </h3>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {order.order_number}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <StatusBadge status={order.status} />
                </div>

                {/* Items preview */}
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {(order.items || []).map((i) => `${i.item_name} (×${i.quantity})`).join(', ')}
                </div>

                {/* Action footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    ₹{order.total}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {order.status === 'completed' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderAgain(order);
                        }}
                      >
                        <RotateCcw size={14} /> Order Again
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrackedOrderId(order.id);
                        setActivePage('order-tracking');
                      }}
                    >
                      View Order <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
