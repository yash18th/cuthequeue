import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, ClipboardList, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ activePage, setActivePage, onOpenCart }) {
  const { totalItemCount } = useCart();
  const { isRestaurantAdmin, isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Hide customer bottom nav for restaurant admin or super admin
  if (isRestaurantAdmin || isSuperAdmin) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`bottom-nav-item ${path === '/' ? 'active' : ''}`}
        onClick={() => {
          setActivePage?.('landing');
          navigate('/');
        }}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${path === '/browse' || path.startsWith('/restaurant') ? 'active' : ''}`}
        onClick={() => {
          setActivePage?.('home');
          navigate('/browse');
        }}
      >
        <Compass size={20} />
        <span>Browse</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${path.startsWith('/orders') ? 'active' : ''}`}
        onClick={() => {
          if (!user) {
            navigate('/signin?redirect=/orders');
          } else {
            setActivePage?.('orders');
            navigate('/orders');
          }
        }}
      >
        <ClipboardList size={20} />
        <span>My Orders</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${path === '/cart' ? 'active' : ''}`}
        style={{ position: 'relative' }}
        onClick={() => {
          setActivePage?.('cart');
          navigate('/cart');
        }}
      >
        <div style={{ position: 'relative' }}>
          <ShoppingBag size={20} />
          {totalItemCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              background: 'var(--primary)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {totalItemCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${path === '/profile' || path === '/signin' ? 'active' : ''}`}
        onClick={() => {
          if (user) {
            setActivePage?.('profile');
            navigate('/profile');
          } else {
            setActivePage?.('auth');
            navigate('/signin');
          }
        }}
      >
        <User size={20} />
        <span>Account</span>
      </button>
    </nav>
  );
}
