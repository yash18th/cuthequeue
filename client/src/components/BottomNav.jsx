import React from 'react';
import { Home, ClipboardList, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ activePage, setActivePage, onOpenCart }) {
  const { totalItemCount } = useCart();
  const { isRestaurantAdmin, isSuperAdmin } = useAuth();

  // If logged in as restaurant admin or super admin, show appropriate navigation or hide customer bottom nav
  if (isRestaurantAdmin || isSuperAdmin) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-item ${activePage === 'home' || activePage === 'landing' ? 'active' : ''}`}
        onClick={() => setActivePage('home')}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        className={`bottom-nav-item ${activePage === 'orders' ? 'active' : ''}`}
        onClick={() => setActivePage('orders')}
      >
        <ClipboardList size={20} />
        <span>Orders</span>
      </button>

      <button
        className="bottom-nav-item"
        style={{ position: 'relative' }}
        onClick={onOpenCart}
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
        className={`bottom-nav-item ${activePage === 'profile' || activePage === 'auth' ? 'active' : ''}`}
        onClick={() => setActivePage('profile')}
      >
        <User size={20} />
        <span>Profile</span>
      </button>
    </nav>
  );
}
