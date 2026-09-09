import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UtensilsCrossed, ShoppingBag, User, LogOut, ChevronDown, Shield, Store, Bell } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenCart, ordersInitialTab, setOrdersInitialTab }) {
  const { user, logout, isCustomer, isRestaurantAdmin, isSuperAdmin, login } = useAuth();
  const { totalItemCount } = useCart();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const switchDemoRole = async (email) => {
    try {
      await login(email, 'password123');
      setShowDemoMenu(false);
      if (email === 'customer@demo.com') setActivePage('home');
      else if (email === 'campus@demo.com' || email === 'spice@demo.com') setActivePage('restaurant-dashboard');
      else if (email === 'admin@cutthequeue.com') setActivePage('superadmin');
    } catch (e) {
      console.error('Demo login switch error:', e);
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <div
          className="brand-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (isCustomer || !user) setActivePage('home');
            else if (isRestaurantAdmin) setActivePage('restaurant-dashboard');
            else if (isSuperAdmin) setActivePage('superadmin');
          }}
        >
          <div className="brand-icon-box">
            <UtensilsCrossed size={20} strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
            Cut<span style={{ color: 'var(--primary)' }}>The</span>Queue
          </span>
        </div>

        {/* Navigation Links for Desktop */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {(!user || isCustomer) && (
            <div style={{ display: 'flex', gap: '0.6rem' }} className="desktop-links">
              <button
                className={`btn btn-sm ${activePage === 'home' || activePage === 'landing' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('home')}
              >
                Home
              </button>
              <button
                className={`btn btn-sm ${activePage === 'orders' && ordersInitialTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  if (setOrdersInitialTab) setOrdersInitialTab('browse');
                  setActivePage('orders');
                }}
              >
                Browse
              </button>
              {user && (
                <button
                  className={`btn btn-sm ${activePage === 'orders' && ordersInitialTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    if (setOrdersInitialTab) setOrdersInitialTab('orders');
                    setActivePage('orders');
                  }}
                >
                  My Orders
                </button>
              )}
            </div>
          )}

          {isRestaurantAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem' }} className="desktop-links">
              <button
                className={`btn btn-sm ${activePage === 'restaurant-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('restaurant-dashboard')}
              >
                Kitchen Orders
              </button>
              <button
                className={`btn btn-sm ${activePage === 'restaurant-menu' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('restaurant-menu')}
              >
                Menu Items
              </button>
              <button
                className={`btn btn-sm ${activePage === 'restaurant-analytics' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('restaurant-analytics')}
              >
                Analytics
              </button>
              <button
                className={`btn btn-sm ${activePage === 'restaurant-settings' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('restaurant-settings')}
              >
                Settings
              </button>
            </div>
          )}

          {isSuperAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem' }} className="desktop-links">
              <button
                className={`btn btn-sm ${activePage === 'superadmin' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('superadmin')}
              >
                <Shield size={16} /> Super Admin
              </button>
            </div>
          )}

          {/* Quick Demo Switcher Dropdown (Helpful for pairs testing all roles instantly) */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              onClick={() => setShowDemoMenu(!showDemoMenu)}
            >
              Role: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {user ? (isCustomer ? 'Customer' : isRestaurantAdmin ? 'Restaurant' : 'Admin') : 'Guest'}
              </span>
              <ChevronDown size={14} />
            </button>

            {showDemoMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-subtle)',
                width: '240px',
                padding: '8px',
                zIndex: 100
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                  Switch Demo Account
                </div>
                <button
                  onClick={() => switchDemoRole('customer@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column' }}
                  className="hover-bg"
                >
                  <strong style={{ color: 'var(--text-primary)' }}>Alex Morgan (Customer)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>customer@demo.com</span>
                </button>
                <button
                  onClick={() => switchDemoRole('campus@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column' }}
                  className="hover-bg"
                >
                  <strong style={{ color: 'var(--primary)' }}>Campus Cafe (Kitchen)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>campus@demo.com</span>
                </button>
                <button
                  onClick={() => switchDemoRole('spice@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column' }}
                  className="hover-bg"
                >
                  <strong style={{ color: '#d97706' }}>Spice Corner (Kitchen)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>spice@demo.com</span>
                </button>
                <button
                  onClick={() => switchDemoRole('admin@cutthequeue.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column' }}
                  className="hover-bg"
                >
                  <strong style={{ color: '#2563eb' }}>Platform Super Admin</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>admin@cutthequeue.com</span>
                </button>
              </div>
            )}
          </div>

          {/* Cart Icon (for customers) */}
          {(!user || isCustomer) && (
            <button
              className="btn btn-secondary"
              style={{ position: 'relative', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)' }}
              onClick={onOpenCart}
              title="View Cart"
            >
              <ShoppingBag size={19} />
              {totalItemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(5,150,105,0.4)'
                }}>
                  {totalItemCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile / Auth Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className={`btn btn-sm ${activePage === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('profile')}
                title="Profile & Settings"
              >
                <User size={16} />
                <span className="desktop-name">{user.name.split(' ')[0]}</span>
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={logout}
                title="Sign Out"
                style={{ padding: '0.55rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setActivePage('auth')}
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
