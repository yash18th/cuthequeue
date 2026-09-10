import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { restaurantAPI } from '../utils/api';
import {
  Settings,
  Store,
  Clock,
  Volume2,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { restaurant, refreshRestaurant } = useAuth();
  const { soundEnabled, setSoundEnabled } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    branch_name: '',
    phone: '',
    address: '',
    opening_time: '07:00',
    closing_time: '23:00',
    avg_prep_time: 15,
    auto_accept_orders: true
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        branch_name: restaurant.branch_name || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        opening_time: restaurant.opening_time || '07:00',
        closing_time: restaurant.closing_time || '23:00',
        avg_prep_time: restaurant.avg_prep_time || 15,
        auto_accept_orders: restaurant.auto_accept_orders !== false
      });
    }
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await restaurantAPI.update(restaurant.id, formData);
      await refreshRestaurant();
      setSuccess('Restaurant settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="font-royal" style={{ fontSize: '1.8rem', color: '#0B352D' }}>
            Restaurant Configuration
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#5C6E6A' }}>
            Operational branch timings, kitchen preparation defaults, and ticket notifications
          </p>
        </div>

        {success && (
          <div style={{
            background: '#DCFCE7',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #86EFAC',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: '#FFF1F2',
            color: '#BE123C',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #FECDD3',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid #E8E0D2', paddingBottom: '1rem' }}>
            <Store size={20} style={{ color: '#C49A52' }} />
            <h2 className="font-royal" style={{ fontSize: '1.25rem', color: '#0B352D' }}>
              Branch Profile & Identity
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Restaurant Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E0D2', background: '#FCFAF6' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Branch / Location
              </label>
              <input
                type="text"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                placeholder="e.g. Indiranagar, Church Street"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E0D2', background: '#FCFAF6' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 80 4123 4567"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E0D2', background: '#FCFAF6' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Full Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="100 Feet Road, HAL 2nd Stage, Bengaluru"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E0D2', background: '#FCFAF6' }}
              />
            </div>
          </div>

          {/* Kitchen Hours & Prep Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2rem 0 1.25rem', borderBottom: '1px solid #E8E0D2', paddingBottom: '0.75rem' }}>
            <Clock size={20} style={{ color: '#C49A52' }} />
            <h2 className="font-royal" style={{ fontSize: '1.25rem', color: '#0B352D' }}>
              Kitchen Timings & Velocity
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Opening Time
              </label>
              <input
                type="time"
                value={formData.opening_time}
                onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E0D2', background: '#FCFAF6' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Closing Time
              </label>
              <input
                type="time"
                value={formData.closing_time}
                onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E0D2', background: '#FCFAF6' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Default Prep (mins)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={formData.avg_prep_time}
                onChange={(e) => setFormData({ ...formData, avg_prep_time: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E0D2', background: '#FCFAF6' }}
              />
            </div>
          </div>

          {/* Sound Notification Preferences */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2rem 0 1.25rem', borderBottom: '1px solid #E8E0D2', paddingBottom: '0.75rem' }}>
            <Volume2 size={20} style={{ color: '#C49A52' }} />
            <h2 className="font-royal" style={{ fontSize: '1.25rem', color: '#0B352D' }}>
              Sound & Real-Time Alerts
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#FCFAF6', borderRadius: '8px', border: '1px solid #E8E0D2', marginBottom: '2rem' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0B352D', display: 'block' }}>Audio Chime on New Ticket</strong>
              <span style={{ fontSize: '0.78rem', color: '#5C6E6A' }}>Play acoustic brass gong chime when a customer places an order</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#C49A52' }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-gold"
              style={{ padding: '10px 24px', fontSize: '0.95rem' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
