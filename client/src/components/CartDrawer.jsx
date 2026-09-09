import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, setActivePage }) {
  if (!isOpen) return null;

  const {
    cartItems,
    restaurant,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    convenienceFee,
    total,
    totalItemCount
  } = useCart();

  const handleGoToCheckout = () => {
    onClose();
    setActivePage('checkout');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          height: '100vh',
          maxHeight: '100vh',
          borderRadius: '24px 0 0 24px',
          display: 'flex',
          flexDirection: 'column',
          margin: 0
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Your Tray ({totalItemCount})
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Items Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <ShoppingBag size={24} />
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Your tray is empty</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Add delicious food from campus kitchens to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  From: {restaurant?.name}
                </span>
                <button
                  onClick={clearCart}
                  style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 600 }}
                >
                  Clear Tray
                </button>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '0.925rem' }}>{item.name}</strong>
                      {Object.entries(item.customizations || {}).length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {Object.entries(item.customizations).map(([k, v]) => (
                            <span key={k} style={{ marginRight: '6px' }}>
                              {k}: {Array.isArray(v) ? v.join(', ') : v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>₹{item.totalPrice}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: '6px', padding: '1px 4px' }}>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        style={{ padding: '2px 4px', color: 'var(--text-secondary)' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 6px' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        style={{ padding: '2px 4px', color: 'var(--text-secondary)' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.cartItemId)}
                      style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Bill Summary */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Taxes (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Convenience Fee</span>
                <span>₹{convenienceFee}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border-subtle)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
              onClick={handleGoToCheckout}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
