import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { playReadyChime, playNewOrderChime } from '../utils/sound';
import { triggerVibration, isVibrationSupported } from '../utils/vibration';
import { User, Mail, Phone, Bell, Volume2, Vibrate, CheckCircle2, Shield, LogOut } from 'lucide-react';

export default function CustomerProfilePage({ setActivePage }) {
  const { user, updateProfile, logout } = useAuth();
  const { requestNotificationPermission, notificationPermission } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [preferences, setPreferences] = useState(() => {
    return user?.notification_preferences || { push: true, sound: true, vibration: true };
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState('');

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem' }}>Please sign in to view your profile.</p>
        <button className="btn btn-primary" onClick={() => setActivePage('auth')}>
          Sign In
        </button>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        name,
        phone,
        avatar,
        notification_preferences: preferences
      });
      setMessage('Profile and preferences updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSound = () => {
    playReadyChime();
    setTestResult('Played Order Ready melodic chime!');
    setTimeout(() => setTestResult(''), 3000);
  };

  const handleTestVibration = () => {
    const success = triggerVibration([200, 100, 200, 100, 300]);
    if (success) {
      setTestResult('Triggered device vibration pattern!');
    } else {
      setTestResult('Vibration API is not supported or was ignored on this desktop browser (mobile devices supported).');
    }
    setTimeout(() => setTestResult(''), 4000);
  };

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      setTestResult('Browser push notifications enabled!');
    } else {
      setTestResult(`Notification permission status: ${res}`);
    }
    setTimeout(() => setTestResult(''), 3000);
  };

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
          Profile & Preferences
        </h1>

        {message && (
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
            <span>{message}</span>
          </div>
        )}

        {testResult && (
          <div style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #bfdbfe',
            marginBottom: '1.5rem',
            fontSize: '0.85rem'
          }}>
            {testResult}
          </div>
        )}

        {/* Profile Card */}
        <form onSubmit={handleSave}>
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                border: '2px solid var(--primary-border)'
              }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{user.name}</h3>
                <span className="badge badge-amber" style={{ textTransform: 'capitalize' }}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-field"
                value={user.email}
                disabled
                style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Email cannot be changed directly for security.
              </span>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Notification & Vibration Preferences */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'white' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Notification Architecture & Alerts
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Control how Cut the Queue alerts you when your meal changes to Ready for pickup.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Push Notifications */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={20} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Browser / Push Notifications</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {notificationPermission}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={handleEnablePush}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Enable
                    </button>
                  )}
                  <input
                    type="checkbox"
                    checked={preferences.push}
                    onChange={(e) => setPreferences({ ...preferences, push: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Sound Alerts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Volume2 size={20} style={{ color: '#2563eb' }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Sound Chime Alerts</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Web Audio synthesized melodic chime</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleTestSound}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Test Chime
                  </button>
                  <input
                    type="checkbox"
                    checked={preferences.sound}
                    onChange={(e) => setPreferences({ ...preferences, sound: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Vibration Alerts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Vibrate size={20} style={{ color: '#d97706' }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Device Vibration Alerts</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isVibrationSupported() ? 'Supported on this device' : 'Active on mobile browser viewports'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleTestVibration}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Test Vibrate
                  </button>
                  <input
                    type="checkbox"
                    checked={preferences.vibration}
                    onChange={(e) => setPreferences({ ...preferences, vibration: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                logout();
                setActivePage('home');
              }}
              style={{ color: 'var(--accent-rose)' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
