import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { restaurantAPI } from '../utils/api';
import { CheckCircle2, Clock, MapPin, Store, AlertTriangle } from 'lucide-react';

export default function RestaurantSettings() {
  const { restaurant, setRestaurant } = useAuth();

  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    cuisine: restaurant?.cuisine || '',
    address: restaurant?.address || '',
    contact_phone: restaurant?.contact_phone || '',
    opening_time: restaurant?.opening_time || '08:30',
    closing_time: restaurant?.closing_time || '23:00',
    prep_time_minutes: restaurant?.prep_time_minutes || 15,
    min_order_amount: restaurant?.min_order_amount || 0,
    tax_rate: restaurant?.tax_rate || 0.05,
    cover_image: restaurant?.cover_image || '',
    is_open: !!restaurant?.is_open
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  if (!restaurant) {
    return <div className="container" style={{ padding: '4rem 0' }}>No restaurant found.</div>;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      const res = await restaurantAPI.updateSettings(restaurant.id, {
        ...formData,
        is_open: formData.is_open ? 1 : 0
      });
      setRestaurant(res.restaurant);
      setSuccess('Restaurant settings updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOpenStatus = async () => {
    try {
      const res = await restaurantAPI.toggleStatus(restaurant.id);
      setFormData((prev) => ({ ...prev, is_open: !!res.is_open }));
      setRestaurant((prev) => ({ ...prev, is_open: res.is_open }));
      setSuccess(`Kitchen status changed: ${res.is_open ? 'OPEN for orders' : 'CLOSED'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
          Restaurant Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Configure live store availability, estimated prep time, and contact information.
        </p>

        {success && (
          <div style={{
            background: '#ecfdf5',
            color: '#047857',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #a7f3d0',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Master Open / Closed Toggle Card */}
        <div className="card" style={{
          padding: '1.5rem',
          marginBottom: '1.5rem',
          background: formData.is_open ? '#ecfdf5' : '#fff1f2',
          border: `1.5px solid ${formData.is_open ? '#a7f3d0' : '#fecdd3'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={20} style={{ color: formData.is_open ? '#047857' : '#be123c' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: formData.is_open ? '#047857' : '#be123c' }}>
                  Kitchen Order Status: {formData.is_open ? 'OPEN' : 'CLOSED'}
                </h3>
              </div>
              <p style={{ fontSize: '0.825rem', color: formData.is_open ? '#065f46' : '#9f1239', marginTop: '4px' }}>
                {formData.is_open
                  ? 'Customers can place instant pre-orders from their phones.'
                  : 'Kitchen is currently closed. Customers will see "Currently Closed".'}
              </p>
            </div>

            <button
              type="button"
              className={`btn ${formData.is_open ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleToggleOpenStatus}
              style={{ fontWeight: 700 }}
            >
              {formData.is_open ? 'Close Kitchen' : 'Open Kitchen'}
            </button>
          </div>
        </div>

        {/* Form settings */}
        <form onSubmit={handleSave}>
          <div className="card" style={{ padding: '1.75rem', background: 'white', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              General Information
            </h3>

            <div className="input-group">
              <label className="input-label">Restaurant Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Cuisine Specialities</label>
              <input
                type="text"
                className="input-field"
                placeholder="Burgers • Fast Food • Beverages"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input-field"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Contact Phone</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Estimated Prep Time (Minutes)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.prep_time_minutes}
                  onChange={(e) => setFormData({ ...formData, prep_time_minutes: parseInt(e.target.value) || 15 })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Location / Address</label>
              <input
                type="text"
                className="input-field"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Opening Time</label>
                <input
                  type="time"
                  className="input-field"
                  value={formData.opening_time}
                  onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Closing Time</label>
                <input
                  type="time"
                  className="input-field"
                  value={formData.closing_time}
                  onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Cover Photo URL</label>
              <input
                type="url"
                className="input-field"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
