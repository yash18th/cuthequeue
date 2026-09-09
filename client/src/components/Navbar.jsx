import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Compass,
  Home,
  ClipboardList,
  Menu as MenuIcon,
  X
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenCart }) {
  const { user, logout, isCustomer, isRestaurantAdmin, isSuperAdmin, login } = useAuth();
  const { totalItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = location.pathname;

  const handleBrandClick = () => {
    setMobileMenuOpen(false);
    if (isRestaurantAdmin) {
      setActivePage?.('restaurant-dashboard');
      navigate('/kitchen');
    } else if (isSuperAdmin) {
      setActivePage?.('superadmin');
      navigate('/admin');
    } else {
      setActivePage?.('landing');
      navigate('/');
    }
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/signin');
  };

  const switchDemoRole = async (email) => {
    try {
      await login(email, 'password123');
      setShowDemoMenu(false);
      setMobileMenuOpen(false);
      if (email === 'customer@demo.com') {
        setActivePage?.('home');
        navigate('/browse');
      } else if (email === 'campus@demo.com' || email === 'spice@demo.com') {
        setActivePage?.('restaurant-dashboard');
        navigate('/kitchen');
      } else if (email === 'admin@cutthequeue.com') {
        setActivePage?.('superadmin');
        navigate('/admin');
      }
    } catch (e) {
      console.error('Demo login switch error:', e);
    }
  };

  // Helper to check active customer link
  const isHomeActive = pathname === '/';
  const isBrowseActive = pathname === '/browse' || pathname.startsWith('/restaurant/');
  const isOrdersActive = pathname.startsWith('/orders');
  const isCartActive = pathname === '/cart';

  return (
    <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
      <div className="container navbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <div
          className="brand-logo"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={handleBrandClick}
        >
          <div className="brand-icon-box">
            <UtensilsCrossed size={20} strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, letterSpacing: '-0.03em', fontSize: '1.2rem' }}>
            Cut<span style={{ color: 'var(--primary)' }}>The</span>Queue
          </span>
        </div>

        {/* Customer Desktop Navigation Links */}
        {(!user || isCustomer) && (
          <nav className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to="/"
              onClick={() => setActivePage?.('landing')}
              className={`btn btn-sm ${isHomeActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textDecoration: 'none', fontWeight: 600 }}
            >
              Home
            </Link>
            <Link
              to="/browse"
              onClick={() => setActivePage?.('home')}
              className={`btn btn-sm ${isBrowseActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textDecoration: 'none', fontWeight: 600 }}
            >
              Browse
            </Link>
            {user && (
              <Link
                to="/orders"
                onClick={() => setActivePage?.('orders')}
                className={`btn btn-sm ${isOrdersActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textDecoration: 'none', fontWeight: 600 }}
              >
                My Orders
              </Link>
            )}
          </nav>
        )}

        {/* Kitchen Staff Navigation Links */}
        {isRestaurantAdmin && (
          <nav className="desktop-links" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <Link
              to="/kitchen"
              onClick={() => setActivePage?.('restaurant-dashboard')}
              className={`btn btn-sm ${pathname === '/kitchen' || pathname === '/kitchen/orders' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textDecoration: 'none', fontWeight: 600 }}
            >
              Kitchen Orders
            </Link>
            <Link
              to="/kitchen/menu"
              onClick={() => setActivePage?.('restaurant-menu')}
              className={`btn btn-sm ${pathname === '/kitchen/menu' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textDecoration: 'none', fontWeight: 600 }}
            >
              Menu
            </Link>
            <Link
              to="/kitchen/analytics"
              onClick={() => setActivePage?.('restaurant-analytics')}
              className={`btn btn-sm ${pathname === '/kitchen/analytics' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textDecoration: 'none', fontWeight: 600 }}
            >
              Analytics
            </Link>
            <Link
              to="/kitchen/settings"
              onClick={() => setActivePage?.('restaurant-settings')}
              className={`btn btn-sm ${pathname === '/kitchen/settings' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textDecoration: 'none', fontWeight: 600 }}
            >
              Settings
            </Link>
          </nav>
        )}

        {/* Super Admin Navigation Links */}
        {isSuperAdmin && (
          <nav className="desktop-links" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link
              to="/admin"
              onClick={() => setActivePage?.('superadmin')}
              className={`btn btn-sm ${pathname.startsWith('/admin') ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Shield size={16} /> Admin Dashboard
            </Link>
          </nav>
        )}

        {/* Right Side Actions: Cart, Role Switcher, Profile/Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Cart button for customers */}
          {(!user || isCustomer) && (
            <Link
              to="/cart"
              onClick={() => setActivePage?.('cart')}
              className={`btn ${isCartActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                position: 'relative',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="View Cart"
            >
              <ShoppingBag size={18} />
              <span className="desktop-links" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cart</span>
              {totalItemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: isCartActive ? '#10b981' : 'var(--primary)',
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
            </Link>
          )}

          {/* Quick Demo Role Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              aria-label="Switch Role"
            >
              Role: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {user ? (isCustomer ? 'Customer' : isRestaurantAdmin ? 'Kitchen' : 'Admin') : 'Guest'}
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
                zIndex: 1100
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                  Switch Demo Account
                </div>
                <button
                  type="button"
                  onClick={() => switchDemoRole('customer@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  className="hover-bg"
                >
                  <strong style={{ color: 'var(--text-primary)' }}>Alex Morgan (Customer)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>customer@demo.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('campus@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  className="hover-bg"
                >
                  <strong style={{ color: 'var(--primary)' }}>Campus Cafe (Kitchen)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>campus@demo.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('spice@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  className="hover-bg"
                >
                  <strong style={{ color: '#d97706' }}>Spice Corner (Kitchen)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>spice@demo.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('admin@cutthequeue.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  className="hover-bg"
                >
                  <strong style={{ color: '#2563eb' }}>Platform Super Admin</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>admin@cutthequeue.com</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile / Logout */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Link
                to="/profile"
                onClick={() => setActivePage?.('profile')}
                className={`btn btn-sm ${pathname === '/profile' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Profile & Settings"
              >
                <User size={16} />
                <span className="desktop-name">{user.name?.split(' ')[0] || 'Profile'}</span>
              </Link>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleLogout}
                title="Sign Out"
                style={{ padding: '0.5rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/signin"
              onClick={() => setActivePage?.('auth')}
              className="btn btn-sm btn-primary"
              style={{ textDecoration: 'none', fontWeight: 700 }}
            >
              Sign In
            </Link>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Responsive Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          background: 'white',
          borderTop: '1px solid var(--border-subtle)',
          padding: '1rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          {(!user || isCustomer) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link
                to="/"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('landing'); }}
                className={`btn btn-sm ${isHomeActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Home
              </Link>
              <Link
                to="/browse"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('home'); }}
                className={`btn btn-sm ${isBrowseActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Browse Restaurants
              </Link>
              {user && (
                <Link
                  to="/orders"
                  onClick={() => { setMobileMenuOpen(false); setActivePage?.('orders'); }}
                  className={`btn btn-sm ${isOrdersActive ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  My Orders
                </Link>
              )}
              <Link
                to="/cart"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('cart'); }}
                className={`btn btn-sm ${isCartActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Cart ({totalItemCount})
              </Link>
            </div>
          )}

          {isRestaurantAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link
                to="/kitchen"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurant-dashboard'); }}
                className="btn btn-sm btn-ghost"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Kitchen Orders
              </Link>
              <Link
                to="/kitchen/menu"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurant-menu'); }}
                className="btn btn-sm btn-ghost"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Menu Items
              </Link>
              <Link
                to="/kitchen/analytics"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurant-analytics'); }}
                className="btn btn-sm btn-ghost"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Analytics
              </Link>
              <Link
                to="/kitchen/settings"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurant-settings'); }}
                className="btn btn-sm btn-ghost"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Settings
              </Link>
            </div>
          )}

          {isSuperAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link
                to="/admin"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('superadmin'); }}
                className="btn btn-sm btn-ghost"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Super Admin Dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
