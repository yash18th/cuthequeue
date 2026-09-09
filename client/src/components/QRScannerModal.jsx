import React, { useState } from 'react';
import { QrCode, CheckCircle2, AlertTriangle, X, Search, Sparkles } from 'lucide-react';
import { orderAPI } from '../utils/api';

export default function QRScannerModal({ restaurantId, isOpen, onClose, onOrderVerified }) {
  if (!isOpen) return null;

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const isToken = inputVal.includes('CQ_QR_');
      const payload = {
        restaurant_id: restaurantId,
        ...(isToken ? { qr_token: inputVal.trim() } : { order_number: inputVal.trim().startsWith('#') ? inputVal.trim() : `#${inputVal.trim()}` })
      };

      const res = await orderAPI.verifyQR(payload);
      setResult(res);
      if (onOrderVerified) {
        onOrderVerified(res.order);
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
      if (err.data?.order) {
        setResult({ order: err.data.order, isErrorState: true, message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputVal('');
    setResult(null);
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pickup QR Verification</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scan customer QR or enter Order ID</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={handleVerify} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Scan QR or type e.g. #CQ1042"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !inputVal.trim()}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Tip: Paste the customer's QR token or their Order ID directly.
            </span>
          </form>

          {/* Verification Result Feedback */}
          {result && !result.isErrorState && (
            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              animation: 'fadeIn 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#047857', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={24} />
                <strong style={{ fontSize: '1.05rem' }}>Pickup Verified & Completed!</strong>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.75rem' }}>
                {result.message}
              </p>
              <div style={{ background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.825rem' }}>
                <div><strong>Order:</strong> {result.order.order_number}</div>
                <div><strong>Customer:</strong> {result.order.customer_name}</div>
                <div><strong>Total Amount:</strong> ₹{result.order.total}</div>
              </div>
              <button
                className="btn btn-sm btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={handleReset}
              >
                Scan Next Order
              </button>
            </div>
          )}

          {error && (
            <div style={{
              background: '#fff1f2',
              border: '1.5px solid #fecdd3',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              color: '#be123c',
              animation: 'fadeIn 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                <AlertTriangle size={20} />
                <strong style={{ fontSize: '0.95rem' }}>Verification Warning</strong>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                {error}
              </p>
              {result?.order && (
                <div style={{ marginTop: '0.75rem', background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>Current Status: <strong>{result.order.status.toUpperCase()}</strong></div>
                  <div>Order: <strong>{result.order.order_number}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
