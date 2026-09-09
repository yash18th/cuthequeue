import React from 'react';
import { UtensilsCrossed, ShieldCheck, Zap, Clock, Smartphone } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer style={{
      background: '#0f172a',
      color: '#cbd5e1',
      padding: '4rem 0 2rem 0',
      borderTop: '1px solid #1e293b',
      marginTop: '4rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Col 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <UtensilsCrossed size={18} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                CutTheQueue
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Order your food ahead of time, skip lengthy counter queues, and pick up your hot meals without waiting.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#1e293b', color: '#10b981', border: '1px solid #334155' }}>
                <Zap size={12} /> Instant Alerts
              </span>
              <span className="badge" style={{ background: '#1e293b', color: '#38bdf8', border: '1px solid #334155' }}>
                <Clock size={12} /> Live Kitchen Tracking
              </span>
            </div>
          </div>

          {/* Col 2: For Customers */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              For Customers
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <li>
                <button
                  style={{ color: '#94a3b8', transition: 'color 0.15s' }}
                  onClick={() => setActivePage('home')}
                  className="hover-text-white"
                >
                  Browse Campus Restaurants
                </button>
              </li>
              <li>
                <button
                  style={{ color: '#94a3b8', transition: 'color 0.15s' }}
                  onClick={() => setActivePage('orders')}
                  className="hover-text-white"
                >
                  Track Active Orders
                </button>
              </li>
              <li>
                <button
                  style={{ color: '#94a3b8', transition: 'color 0.15s' }}
                  onClick={() => setActivePage('profile')}
                  className="hover-text-white"
                >
                  Notification & Vibration Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: For Restaurants */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              For Partners
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <li>
                <button
                  style={{ color: '#94a3b8', transition: 'color 0.15s' }}
                  onClick={() => setActivePage('auth')}
                  className="hover-text-white"
                >
                  Partner Your Restaurant
                </button>
              </li>
              <li>
                <button
                  style={{ color: '#94a3b8', transition: 'color 0.15s' }}
                  onClick={() => setActivePage('auth')}
                  className="hover-text-white"
                >
                  Kitchen Dashboard Demo
                </button>
              </li>
              <li>
                <span style={{ color: '#64748b' }}>QR Verification System</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Legal */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Platform & Legal
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Contact Support</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', marginTop: '0.5rem' }}>
                <ShieldCheck size={16} /> 256-Bit SSL Encrypted
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <div>
            &copy; {new Date().getFullYear()} Cut The Queue Inc. Order ahead. Skip the wait.
          </div>
          <div>
            Designed for busy food courts, campuses, and quick-service diners.
          </div>
        </div>
      </div>
    </footer>
  );
}
