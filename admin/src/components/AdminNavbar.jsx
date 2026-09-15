import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotification } from '../context/NotificationContext';
import { useBranch } from '../context/BranchContext';
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
  Radio,
  MapPin
} from 'lucide-react';

export default function AdminNavbar({ onOpenScanner, activeOrderCount = 0 }) {
  const { user, restaurant, logout } = useAuth();
  const { connected } = useSocket();
  const { soundEnabled, setSoundEnabled } = useNotification();
  const { selectedBrand, selectedBranch } = useBranch();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="temple-frieze" />
      <div className="admin-navbar-inner">
        {/* Left: Brand Identity & Restaurant Badge */}
        <div className="admin-navbar-brand-group">
          <div
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Cut The Queue Admin Dashboard"
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
                border: '1.5px solid #C49A52',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C49A52',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                flexShrink: 0
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20V9C4 5.5 7.5 3 12 3C16.5 3 20 5.5 20 9V20" stroke="#C49A52" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M8 20V12C8 9.8 9.8 8 12 8C14.2 8 16 9.8 16 12V20" stroke="#C49A52" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M15 13C14.5 11.5 13.5 10.8 12 10.8C10.2 10.8 9 12 9 13.8C9 15.6 10.2 16.8 12 16.8C13.5 16.8 14.5 16.1 15 14.6" stroke="#F7F0E2" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="4.5" r="1.2" fill="#C49A52" />
              </svg>
            </div>
            <div>
              <div className="font-royal" style={{ fontSize: '1.02rem', fontWeight: 800, color: '#F8F1DF', letterSpacing: '0.03em', lineHeight: 1.1 }}>
                CUT THE QUEUE
              </div>
              <div className="admin-navbar-subtext" style={{ fontSize: '0.58rem', color: '#C49A52', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Restaurant Operations
              </div>
            </div>
          </div>

          {/* Restaurant identity pill */}
          {(selectedBrand || restaurant) && (
            <div className="restaurant-pill">
              <span className="restaurant-pill-brand">
                {selectedBrand?.name || restaurant?.brand_name || restaurant?.name}
              </span>
              {(selectedBranch?.branch_name || selectedBranch?.area || restaurant?.branch_name) && (
                <>
                  <span className="restaurant-pill-divider">•</span>
                  <span className="restaurant-pill-branch">
                    <MapPin size={12} style={{ color: '#C49A52', flexShrink: 0 }} />
                    <span>{selectedBranch?.branch_name || selectedBranch?.area || restaurant?.branch_name}</span>
                    <span className="restaurant-pill-branch-suffix">&nbsp;Branch</span>
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center: Navigation Links */}
        <nav className="admin-nav-group">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={15} />
            <span>Kitchen Queue</span>
            {activeOrderCount > 0 && (
              <span className="admin-nav-badge">
                {activeOrderCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={15} />
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/menu"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <UtensilsCrossed size={15} />
            <span>Menu</span>
          </NavLink>

          <NavLink
            to="/showcase"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Sparkles size={15} />
            <span>Showcase</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={15} />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={15} />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Right: Actions, Sound, Live Status, Sign Out */}
        <div className="admin-navbar-actions">
          {/* Real-Time Socket Connection Pill */}
          <div
            className="admin-socket-pill"
            style={{
              background: connected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${connected ? '#22C55E' : '#EF4444'}`,
              color: connected ? '#4ADE80' : '#F87171'
            }}
            title={connected ? 'Connected to live order stream' : 'Disconnected from live order stream'}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: connected ? '#22C55E' : '#EF4444'
              }}
              className={connected ? 'pulse-live' : ''}
            />
            <span>{connected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Order Alerts' : 'Unmute Order Alerts'}
            className="admin-btn-icon"
          >
            {soundEnabled ? <Volume2 size={15} style={{ color: '#C49A52' }} /> : <VolumeX size={15} style={{ color: '#9CA3AF' }} />}
          </button>

          {/* Quick Pickup Code Verification Button */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="btn-gold admin-btn-verify"
            title="Verify Pickup Code (QR Scanner / Manual)"
          >
            <QrCode size={14} />
            <span className="admin-btn-verify-text">Verify Pickup</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="admin-btn-icon"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
