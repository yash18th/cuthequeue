import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotification } from '../context/NotificationContext';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  QrCode,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

export default function AdminNavbar({ onOpenScanner, activeOrderCount = 0 }) {
  const { user, restaurant, logout } = useAuth();
  const { connected } = useSocket();
  const { soundEnabled, setSoundEnabled } = useNotification();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="temple-frieze" />
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px' }}>
        {/* Left: Brand Identity & Restaurant Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
                border: '1.5px solid #C49A52',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C49A52',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20V9C4 5.5 7.5 3 12 3C16.5 3 20 5.5 20 9V20" stroke="#C49A52" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M8 20V12C8 9.8 9.8 8 12 8C14.2 8 16 9.8 16 12V20" stroke="#C49A52" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M15 13C14.5 11.5 13.5 10.8 12 10.8C10.2 10.8 9 12 9 13.8C9 15.6 10.2 16.8 12 16.8C13.5 16.8 14.5 16.1 15 14.6" stroke="#F7F0E2" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="4.5" r="1.2" fill="#C49A52" />
              </svg>
            </div>
            <div>
              <div className="font-royal" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8F1DF', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                CUT THE QUEUE
              </div>
              <div style={{ fontSize: '0.62rem', color: '#C49A52', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Restaurant Operations
              </div>
            </div>
          </div>

          {/* Restaurant identity pill */}
          {restaurant && (
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: 'rgba(248, 241, 223, 0.08)',
                border: '1px solid rgba(196, 154, 82, 0.35)',
                borderRadius: '9999px',
                color: '#F8F1DF',
                fontSize: '0.8rem',
                marginLeft: '8px'
              }}
              className="restaurant-pill"
            >
              <strong style={{ color: '#C49A52' }}>{restaurant.name}</strong>
              {restaurant.branch_name && <span style={{ opacity: 0.7 }}>• {restaurant.branch_name}</span>}
            </div>
          )}
        </div>

        {/* Center: Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} />
            <span>Kitchen Queue</span>
            {activeOrderCount > 0 && (
              <span style={{
                background: '#C49A52',
                color: '#0B352D',
                fontSize: '0.7rem',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {activeOrderCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={16} />
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/menu"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <UtensilsCrossed size={16} />
            <span>Menu</span>
          </NavLink>

          <NavLink
            to="/showcase"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Sparkles size={16} />
            <span>Showcase</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={16} />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Right: Actions, Sound, Live Status, Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Real-Time Socket Connection Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: connected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${connected ? '#22C55E' : '#EF4444'}`,
              color: connected ? '#4ADE80' : '#F87171',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
            title={connected ? 'Connected to live order stream' : 'Disconnected from live order stream'}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: connected ? '#22C55E' : '#EF4444'
              }}
              className={connected ? 'pulse-live' : ''}
            />
            {connected ? 'Live' : 'Offline'}
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Order Alerts' : 'Unmute Order Alerts'}
            style={{
              background: 'rgba(248, 241, 223, 0.08)',
              border: '1px solid rgba(196, 154, 82, 0.35)',
              color: soundEnabled ? '#C49A52' : '#9CA3AF',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Quick Pickup Code Verification Button */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="btn-gold"
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            <QrCode size={15} />
            <span>Verify Pickup</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            style={{
              background: 'transparent',
              border: '1px solid rgba(196, 154, 82, 0.35)',
              color: '#F8F1DF',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
