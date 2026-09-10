import React, { useState } from 'react';
import { QrCode, CheckCircle2, AlertCircle, X, Search } from 'lucide-react';
import { restaurantAPI } from '../utils/api';

export default function QRScannerModal({ isOpen, onClose, onOrderVerified, activeOrders = [] }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!code.trim()) return;

    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const cleanCode = code.trim().toUpperCase();
      
      // Look for order matching pickup code in active orders or send to backend
      const matched = activeOrders.find(
        (o) => (o.pickup_code && o.pickup_code.toUpperCase() === cleanCode) ||
               String(o.order_number) === cleanCode ||
               String(o.id) === cleanCode
      );

      let verifiedOrder = matched;

      if (matched) {
        // Update order status to completed
        await restaurantAPI.updateOrderStatus(matched.id, 'completed');
        verifiedOrder = { ...matched, status: 'completed' };
      } else {
        // Fallback: try direct verify endpoint
        try {
          const res = await restaurantAPI.verifyPickup(cleanCode, cleanCode);
          verifiedOrder = res.order;
        } catch {
          throw new Error(`No active pickup found matching code "${cleanCode}". Please verify customer receipt.`);
        }
      }

      setSuccess(`Order #${verifiedOrder.order_number || verifiedOrder.id} successfully verified & handed over!`);
      setCode('');
      if (onOrderVerified) {
        onOrderVerified(verifiedOrder);
      }
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to verify pickup code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(180deg, #0B352D 0%, #123F35 100%)',
          color: '#F8F1DF',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #C49A52'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(196, 154, 82, 0.2)',
              border: '1px solid #C49A52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C49A52'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-royal" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pickup Verification</h3>
              <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Verify customer order handover</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F8F1DF',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem 1.5rem' }}>
          {error && (
            <div style={{
              background: '#FFF1F2',
              color: '#BE123C',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              border: '1px solid #FECDD3',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              background: '#DCFCE7',
              color: '#166534',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: '1rem',
              border: '1px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Enter 4-Digit Pickup Code or Order #
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 7821 or 104"
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '2px solid #C49A52',
                  outline: 'none',
                  color: '#0B352D',
                  background: '#FCFAF6'
                }}
              />
              <button
                type="submit"
                className="btn-gold"
                disabled={loading || !code.trim()}
                style={{ padding: '0 24px', fontSize: '0.95rem' }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>

          {/* Quick pick list of orders ready for pickup */}
          {activeOrders.filter(o => o.status === 'ready').length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E8E0D2' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5C6E6A', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Orders Waiting for Pickup:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {activeOrders.filter(o => o.status === 'ready').map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setCode(o.pickup_code || String(o.order_number || o.id))}
                    style={{
                      background: '#F8F4EC',
                      border: '1px solid #C49A52',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.78rem',
                      color: '#0B352D',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    #{o.order_number || o.id} ({o.pickup_code ? `Code: ${o.pickup_code}` : o.customer_name || 'Customer'})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
