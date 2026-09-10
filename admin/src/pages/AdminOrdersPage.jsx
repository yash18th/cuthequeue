import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { restaurantAPI } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AdminOrdersPage() {
  const { restaurant } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return;
    try {
      const res = await restaurantAPI.getOrders(restaurant.id);
      const list = res.orders || res || [];
      setOrders(list);
    } catch (err) {
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o.id).includes(q) || String(o.order_number || '').includes(q);
      const matchCustomer = (o.customer_name || o.user_name || '').toLowerCase().includes(q);
      const matchCode = (o.pickup_code || '').toLowerCase().includes(q);
      return matchId || matchCustomer || matchCode;
    }
    return true;
  });

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="font-royal" style={{ fontSize: '1.8rem', color: '#0B352D' }}>
              Order Records & Archival
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5C6E6A' }}>
              Complete chronological audit trail for {restaurant?.name || 'Restaurant'}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="btn-outline-gold"
          >
            <RefreshCw size={15} />
            <span>Refresh Records</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="admin-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#5C6E6A', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filter Status:
            </span>
            {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: statusFilter === st ? '#C49A52' : '#E8E0D2',
                  background: statusFilter === st ? '#0B352D' : '#FFFFFF',
                  color: statusFilter === st ? '#F8F1DF' : '#1E2927',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#5C6E6A' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, code..."
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                borderRadius: '6px',
                border: '1px solid #E8E0D2',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Table View */}
        <div className="admin-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#0B352D', color: '#F8F1DF', borderBottom: '2px solid #C49A52' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Ticket #</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date & Time</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Pickup Code</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Items</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                      <span style={{ color: '#5C6E6A' }}>Loading records...</span>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                      <span style={{ color: '#5C6E6A' }}>No matching order records found.</span>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const isExpanded = expandedOrderId === o.id;
                    return (
                      <React.Fragment key={o.id}>
                        <tr
                          style={{
                            borderBottom: '1px solid #E8E0D2',
                            background: isExpanded ? '#FCFAF6' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0B352D' }}>
                            #{o.order_number || o.id}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#5C6E6A', fontSize: '0.82rem' }}>
                            {o.created_at ? new Date(o.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E2927' }}>
                            {o.customer_name || o.user_name || 'Walk-in / App User'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {o.pickup_code ? (
                              <span style={{
                                background: '#F8F4EC',
                                border: '1px solid #C49A52',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                color: '#78252F'
                              }}>
                                {o.pickup_code}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#5C6E6A' }}>
                            {o.items?.length || 1} items
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0B352D' }}>
                            ₹{Number(o.total_amount || 0)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <StatusBadge status={o.status} />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#C49A52',
                                padding: '4px'
                              }}
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: '#FCFAF6', borderBottom: '2px solid #C49A52' }}>
                            <td colSpan="8" style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                                <div>
                                  <strong style={{ fontSize: '0.82rem', color: '#C49A52', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                                    Ordered Dishes:
                                  </strong>
                                  <div style={{ background: '#FFFFFF', border: '1px solid #E8E0D2', borderRadius: '8px', padding: '12px' }}>
                                    {o.items && o.items.length > 0 ? (
                                      o.items.map((it, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < o.items.length - 1 ? '1px dashed #E8E0D2' : 'none' }}>
                                          <span><strong>{it.quantity}x</strong> {it.item_name || it.name}</span>
                                          <span style={{ fontWeight: 600 }}>₹{it.subtotal || (it.price * it.quantity) || 0}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <p style={{ color: '#5C6E6A', fontSize: '0.82rem' }}>No individual item details available.</p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <strong style={{ fontSize: '0.82rem', color: '#C49A52', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                                    Order Summary & Audit:
                                  </strong>
                                  <div style={{ background: '#FFFFFF', border: '1px solid #E8E0D2', borderRadius: '8px', padding: '12px', fontSize: '0.84rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                      <span style={{ color: '#5C6E6A' }}>Payment Status:</span>
                                      <span style={{ fontWeight: 700, color: '#166534' }}>{o.payment_status || 'Paid (Online)'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                      <span style={{ color: '#5C6E6A' }}>Channel:</span>
                                      <span>Pre-Order (CutTheQueue Web)</span>
                                    </div>
                                    {o.notes && (
                                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #E8E0D2' }}>
                                        <span style={{ color: '#78252F', fontWeight: 600 }}>Special Notes:</span>
                                        <p style={{ color: '#1E2927' }}>{o.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
