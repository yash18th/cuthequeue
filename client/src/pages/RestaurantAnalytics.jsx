import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../utils/api';
import PageNavHeader from '../components/PageNavHeader';
import { TrendingUp, DollarSign, ShoppingBag, Clock, Award, BarChart3 } from 'lucide-react';

export default function RestaurantAnalytics() {
  const { restaurant } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurant?.id) return;
    analyticsAPI.getRestaurantAnalytics(restaurant.id)
      .then(setData)
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  }, [restaurant?.id]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading restaurant analytics...</div>;
  }

  if (!data) {
    return <div className="container" style={{ padding: '4rem 0' }}>No analytics available.</div>;
  }

  const { metrics, popularItems = [], dailyTrend = [], peakHours = [] } = data;

  // Max calculations for chart scaling
  const maxDailyRevenue = Math.max(...dailyTrend.map((d) => d.revenue), 100);
  const maxPeakOrders = Math.max(...peakHours.map((p) => p.order_count), 5);

  return (
    <div style={{ padding: '2rem 0 6rem 0' }}>
      <div className="container">
        <PageNavHeader
          backLabel="Back to Kitchen"
          fallbackPath="/kitchen"
          breadcrumbs={[
            { label: 'Kitchen Dashboard', path: '/kitchen' },
            { label: 'Analytics' }
          ]}
        />

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Restaurant Analytics & Revenue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Performance insights for {restaurant.name}
          </p>
        </div>

        {/* Revenue Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Today's Gross Sales
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
              ₹{metrics.todayRevenue || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Completed orders</span>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Last 7 Days Revenue
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              ₹{metrics.weekRevenue || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Weekly turnaround</span>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              This Month's Revenue
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              ₹{metrics.monthRevenue || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>30-day cumulative</span>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Order Fulfillment Rate
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
              {metrics.todayOrders > 0 ? Math.round((metrics.completed / metrics.todayOrders) * 100) : 100}%
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed vs cancelled</span>
          </div>
        </div>

        {/* Charts & Popular Items Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* Top Selling Food Items */}
          <div className="card" style={{ padding: '1.75rem', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <Award size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Popular Items Sold</h3>
            </div>

            {popularItems.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sales data recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {popularItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.85rem',
                      background: idx === 0 ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--primary)' : '#cbd5e1',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        {item.item_name}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {item.total_sold} sold
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        ₹{item.total_revenue} gross
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peak Ordering Hours Visual Bar Chart */}
          <div className="card" style={{ padding: '1.75rem', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <Clock size={20} style={{ color: '#2563eb' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Peak Queue Hours</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Order rush breakdown across the day.
            </p>

            {peakHours.length === 0 ? (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Orders will map hourly trends here
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', paddingTop: '1rem' }}>
                {peakHours.map((slot, idx) => {
                  const heightPercent = Math.max(15, (slot.order_count / maxPeakOrders) * 100);

                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {slot.order_count}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '36px',
                          height: `${heightPercent}%`,
                          background: 'linear-gradient(to top, #059669 0%, #34d399 100%)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.4s ease'
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {slot.hour_slot}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Revenue Trend */}
        <div className="card" style={{ padding: '1.75rem', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <BarChart3 size={20} style={{ color: '#059669' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Daily Sales Trend (Last 7 Days)</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Orders Count</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dailyTrend.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Completed orders will populate historical charts.
                    </td>
                  </tr>
                ) : (
                  dailyTrend.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{d.day_label}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{d.order_count} orders</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--primary)' }}>₹{d.revenue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
