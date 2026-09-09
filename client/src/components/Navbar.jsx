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
  X,
  BarChart3,
  Settings
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
  const isBrowseActive = pathname === '/restaurants' || pathname === '/browse' || pathname.startsWith('/restaurant');
  const isOrdersActive = pathname.startsWith('/orders') || pathname.startsWith('/queue');
  const isCartActive = pathname === '/cart';

  const handleHowItWorksClick = () => {
    setMobileMenuOpen(false);
    if (pathname === '/') {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#how-it-works');
    }
  };

  return (
    <header
      className="navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'linear-gradient(180deg, #0B352D 0%, #123F35 100%)',
        borderBottom: '1px solid rgba(201, 162, 74, 0.45)',
        boxShadow: '0 4px 20px rgba(11, 53, 45, 0.35)',
        position: 'relative'
      }}
    >
      {/* South Indian Temple-Border Detailing along bottom */}
      <div className="navbar-temple-frieze" aria-hidden="true" />

      <div className="container navbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px' }}>
        {/* Brand Logo with Heritage Hospitality Emblem */}
        <div
          className="brand-logo"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
          onClick={handleBrandClick}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
              border: '1.5px solid #C49A52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C49A52',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
          >
            {/* South Indian Heritage Emblem: Temple Doorway + Stylized C + Brass Lamp Motif */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 20V9C4 5.5 7.5 3 12 3C16.5 3 20 5.5 20 9V20"
                stroke="#C49A52"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M8 20V12C8 9.8 9.8 8 12 8C14.2 8 16 9.8 16 12V20"
                stroke="#C49A52"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d="M15 13C14.5 11.5 13.5 10.8 12 10.8C10.2 10.8 9 12 9 13.8C9 15.6 10.2 16.8 12 16.8C13.5 16.8 14.5 16.1 15 14.6"
                stroke="#F7F0E2"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="12" cy="4.5" r="1.2" fill="#C49A52" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                fontSize: '1.3rem',
                color: '#F7F0E2',
                lineHeight: 1.1
              }}
            >
              CUT THE QUEUE
            </span>
            <span
              style={{
                fontSize: '0.64rem',
                color: '#C49A52',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                marginTop: '1px'
              }}
            >
              Bengaluru Dining Heritage
            </span>
          </div>
        </div>

        {/* Customer Desktop Navigation Links */}
        {(!user || isCustomer) && (
          <nav className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Link
              to="/"
              onClick={() => setActivePage?.('landing')}
              style={{
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                color: isHomeActive ? '#C9A24A' : '#F8F1DF',
                background: isHomeActive ? 'rgba(201, 162, 74, 0.16)' : 'transparent',
                border: isHomeActive ? '1px solid rgba(201, 162, 74, 0.45)' : '1px solid transparent',
                transition: 'all 0.18s ease'
              }}
            >
              Home
            </Link>
            <Link
              to="/restaurants"
              onClick={() => setActivePage?.('restaurants')}
              style={{
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                color: isBrowseActive ? '#C9A24A' : '#F8F1DF',
                background: isBrowseActive ? 'rgba(201, 162, 74, 0.16)' : 'transparent',
                border: isBrowseActive ? '1px solid rgba(201, 162, 74, 0.45)' : '1px solid transparent',
                transition: 'all 0.18s ease'
              }}
            >
              Restaurants
            </Link>
            <button
              type="button"
              onClick={handleHowItWorksClick}
              style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                color: '#F8F1DF',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              How It Works
            </button>
            {user && (
              <Link
                to="/orders"
                onClick={() => setActivePage?.('orders')}
                style={{
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  color: isOrdersActive ? '#C9A24A' : '#F8F1DF',
                  background: isOrdersActive ? 'rgba(201, 162, 74, 0.16)' : 'transparent',
                  border: isOrdersActive ? '1px solid rgba(201, 162, 74, 0.45)' : '1px solid transparent',
                  transition: 'all 0.18s ease'
                }}
              >
                Orders
              </Link>
            )}
          </nav>
        )}

        {/* Kitchen Staff Navigation Links */}
        {isRestaurantAdmin && (
          <nav className="desktop-links kitchen-nav-container" aria-label="Kitchen Management Navigation">
            <Link
              to="/kitchen"
              onClick={() => setActivePage?.('restaurant-dashboard')}
              className={`kitchen-nav-item ${pathname === '/kitchen' || pathname === '/kitchen/orders' ? 'active' : ''}`}
            >
              <ClipboardList size={15} />
              <span>Kitchen Orders</span>
            </Link>
            <Link
              to="/kitchen/menu"
              onClick={() => setActivePage?.('restaurant-menu')}
              className={`kitchen-nav-item ${pathname === '/kitchen/menu' ? 'active' : ''}`}
            >
              <UtensilsCrossed size={15} />
              <span>Menu</span>
            </Link>
            <Link
              to="/kitchen/analytics"
              onClick={() => setActivePage?.('restaurant-analytics')}
              className={`kitchen-nav-item ${pathname === '/kitchen/analytics' ? 'active' : ''}`}
            >
              <BarChart3 size={15} />
              <span>Analytics</span>
            </Link>
            <Link
              to="/kitchen/settings"
              onClick={() => setActivePage?.('restaurant-settings')}
              className={`kitchen-nav-item ${pathname === '/kitchen/settings' ? 'active' : ''}`}
            >
              <Settings size={15} />
              <span>Settings</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Cart button for customers */}
          {(!user || isCustomer) && (
            <Link
              to="/cart"
              onClick={() => setActivePage?.('cart')}
              style={{
                position: 'relative',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isCartActive ? '#C6A15B' : 'rgba(198, 161, 91, 0.15)',
                color: isCartActive ? '#0B2923' : '#F7F1E5',
                border: isCartActive ? '1px solid #A98242' : '1px solid rgba(198, 161, 91, 0.35)',
                transition: 'all 0.2s ease'
              }}
              title="View Tray"
            >
              <ShoppingBag size={17} />
              <span className="desktop-links" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tray</span>
              {totalItemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#C6A15B',
                  color: '#0B2923',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  width: '19px',
                  height: '19px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                  border: '1.5px solid #0B2923'
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
              style={{
                fontSize: '0.78rem',
                padding: '0.45rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(248, 241, 223, 0.1)',
                border: '1px solid rgba(201, 162, 74, 0.45)',
                color: '#F8F1DF',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              aria-label="Switch Role"
            >
              Role: <span style={{ color: '#C9A24A', fontWeight: 700 }}>
                {user ? (isCustomer ? 'Customer' : isRestaurantAdmin ? 'Kitchen' : 'Admin') : 'Guest'}
              </span>
              <ChevronDown size={14} style={{ color: '#C9A24A' }} />
            </button>

            {showDemoMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '0 12px 30px rgba(11, 41, 35, 0.25)',
                border: '1px solid #E8DDC8',
                width: '260px',
                padding: '10px',
                zIndex: 1100
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--accent-gold-muted)',
                  padding: '4px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-serif)'
                }}>
                  Demo Role Switcher
                </div>
                <button
                  type="button"
                  onClick={() => switchDemoRole('customer@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  className="hover-bg"
                >
                  <strong style={{ color: 'var(--text-charcoal)' }}>Alex Morgan (Customer)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>customer@demo.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('campus@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  className="hover-bg"
                >
                  <strong style={{ color: 'var(--bg-deep-green)' }}>The Rameshwaram Cafe (Kitchen)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Indiranagar Branch</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('spice@demo.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  className="hover-bg"
                >
                  <strong style={{ color: 'var(--accent-gold)' }}>Empire Restaurant (Kitchen)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Church Street Branch</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('admin@cutthequeue.com')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  className="hover-bg"
                >
                  <strong style={{ color: 'var(--bg-royal-maroon)' }}>Platform Super Admin</strong>
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
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(248, 241, 223, 0.12)',
                  border: '1px solid rgba(201, 162, 74, 0.45)',
                  color: '#F8F1DF',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
                title="Profile & Settings"
              >
                <User size={15} style={{ color: '#C9A24A' }} />
                <span className="desktop-name">{user.name?.split(' ')[0] || 'Profile'}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                style={{
                  padding: '0.45rem',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid rgba(201, 162, 74, 0.35)',
                  color: '#F8F1DF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/signin"
              onClick={() => setActivePage?.('auth')}
              className="btn btn-sm btn-gold"
              style={{ textDecoration: 'none' }}
            >
              Sign In
            </Link>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Responsive Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          background: '#0B352D',
          borderTop: '1px solid rgba(201, 162, 74, 0.4)',
          borderBottom: '2px solid #C9A24A',
          padding: '1.25rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
        }}>
          {(!user || isCustomer) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Link
                to="/"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('landing'); }}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  color: isHomeActive ? '#C6A15B' : '#F7F1E5',
                  background: isHomeActive ? 'rgba(198, 161, 91, 0.15)' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Home
              </Link>
              <Link
                to="/restaurants"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurants'); }}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  color: isBrowseActive ? '#C6A15B' : '#F7F1E5',
                  background: isBrowseActive ? 'rgba(198, 161, 91, 0.15)' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Restaurants
              </Link>
              <button
                type="button"
                onClick={handleHowItWorksClick}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  color: '#F7F1E5',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                How It Works
              </button>
              {user && (
                <Link
                  to="/orders"
                  onClick={() => { setMobileMenuOpen(false); setActivePage?.('orders'); }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    color: isOrdersActive ? '#C6A15B' : '#F7F1E5',
                    background: isOrdersActive ? 'rgba(198, 161, 91, 0.15)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  My Orders
                </Link>
              )}
              <Link
                to="/cart"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('cart'); }}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  color: isCartActive ? '#0B2923' : '#F7F1E5',
                  background: isCartActive ? '#C6A15B' : 'rgba(198, 161, 91, 0.15)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Tray</span>
                <span>{totalItemCount} items</span>
              </Link>
            </div>
          )}
          {isRestaurantAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link
                to="/kitchen"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurant-dashboard'); }}
                className={`kitchen-nav-mobile-item ${pathname === '/kitchen' || pathname === '/kitchen/orders' ? 'active' : ''}`}
              >
                <ClipboardList size={18} />
                <span>Kitchen Orders</span>
              </Link>
              <Link
                to="/kitchen/menu"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurant-menu'); }}
                className={`kitchen-nav-mobile-item ${pathname === '/kitchen/menu' ? 'active' : ''}`}
              >
                <UtensilsCrossed size={18} />
                <span>Menu</span>
              </Link>
              <Link
                to="/kitchen/analytics"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurant-analytics'); }}
                className={`kitchen-nav-mobile-item ${pathname === '/kitchen/analytics' ? 'active' : ''}`}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </Link>
              <Link
                to="/kitchen/settings"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('restaurant-settings'); }}
                className={`kitchen-nav-mobile-item ${pathname === '/kitchen/settings' ? 'active' : ''}`}
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </div>
          )}

          {isSuperAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Link
                to="/admin"
                onClick={() => { setMobileMenuOpen(false); setActivePage?.('superadmin'); }}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  color: pathname.startsWith('/admin') ? '#C6A15B' : '#F7F1E5',
                  background: pathname.startsWith('/admin') ? 'rgba(198, 161, 91, 0.15)' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
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
