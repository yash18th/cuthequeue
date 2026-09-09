import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { Shield, Users, Store, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Filter } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'restaurants', 'users', 'orders'
  const [overview, setOverview] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, rests, us, ords] = await Promise.all([
        superAdminAPI.getOverview(),
        superAdminAPI.getRestaurants(),
        superAdminAPI.getUsers(),
        superAdminAPI.getAllOrders()
      ]);
      setOverview(ov);
      setRestaurants(rests);
      setUsers(us);
      setOrders(ords);
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRestaurantStatus = async (restaurant) => {
    try {
      const newSuspended = restaurant.is_suspended ? 0 : 1;
      await superAdminAPI.updateRestaurantStatus(restaurant.id, { is_suspended: newSuspended });
      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurant.id ? { ...r, is_suspended: newSuspended } : r))
      );
    } catch (err) {
      alert('Failed to update restaurant status');
    }
  };

  const handleToggleUserSuspend = async (user) => {
    try {
      const res = await superAdminAPI.toggleUserSuspend(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_suspended: res.is_suspended } : u))
      );
    } catch (err) {
      alert('Failed to toggle user status');
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading Platform Super Admin...</div>;
  }

  const metrics = overview?.metrics || {};

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={24} style={{ color: '#2563eb' }} />
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                Platform Super Admin
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Global platform supervision, restaurant partners, user authorization, and financial volume.
            </p>
          </div>

          {/* Navigation Sub-tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'restaurants', label: `Restaurants (${restaurants.length})` },
              { id: 'users', label: `Users (${users.length})` },
              { id: 'orders', label: `Global Orders (${orders.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                style={{
                  padding: '0.5rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: 'none',
                  background: activeView === tab.id ? 'white' : 'transparent',
                  color: activeView === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: activeView === tab.id ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW 1: OVERVIEW */}
        {activeView === 'overview' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem'
            }}>
              <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Platform Gross Volume
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  ₹{metrics.grossVolume || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Total GMV across restaurants</span>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Platform Convenience Fees
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                  ₹{metrics.platformFees || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cut the Queue platform revenue</span>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Completed Orders
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  {metrics.completedOrders || 0} / {metrics.totalOrders || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Successful pickups</span>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Active Restaurants
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  {metrics.activeRestaurants || 0} / {metrics.totalRestaurants || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved campus kitchens</span>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="card" style={{ padding: '1.75rem', background: 'white' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>
                Latest Platform Activity
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Order</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Restaurant</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Total</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.recentOrders || []).map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>{ord.order_number}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{ord.restaurant_name}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{ord.customer_name}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>₹{ord.total}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <StatusBadge status={ord.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: RESTAURANTS */}
        {activeView === 'restaurants' && (
          <div className="card" style={{ padding: '1.75rem', background: 'white' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Managed Restaurants
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Restaurant</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Owner</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Total Orders</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Revenue</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <strong>{r.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.cuisine}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div>{r.owner_name || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.owner_email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{r.total_orders}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--primary)' }}>₹{r.total_revenue}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className={`badge ${r.is_suspended ? 'badge-closed' : 'badge-open'}`}>
                          {r.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button
                          className={`btn btn-sm ${r.is_suspended ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => handleToggleRestaurantStatus(r)}
                        >
                          {r.is_suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: USERS */}
        {activeView === 'users' && (
          <div className="card" style={{ padding: '1.75rem', background: 'white' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              User Accounts
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>User</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Phone</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Orders Placed</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Account Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <strong>{u.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className="badge badge-amber" style={{ textTransform: 'capitalize' }}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{u.customer_orders_count || 0}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className={`badge ${u.is_suspended ? 'badge-closed' : 'badge-open'}`}>
                          {u.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button
                          className={`btn btn-sm ${u.is_suspended ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => handleToggleUserSuspend(u)}
                        >
                          {u.is_suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: GLOBAL ORDERS */}
        {activeView === 'orders' && (
          <div className="card" style={{ padding: '1.75rem', background: 'white' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              All Platform Orders
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Order Number</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Restaurant</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Customer</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {ord.order_number}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{ord.restaurant_name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{ord.customer_name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>₹{ord.total}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <StatusBadge status={ord.status} />
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(ord.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
