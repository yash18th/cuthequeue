import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, Clock, MapPin, Award, Sparkles, ChevronRight } from 'lucide-react';

export default function Footer({ setActivePage }) {
  const navigate = useNavigate();

  return (
    <footer
      style={{
        background: '#0B352D',
        color: '#E9DDC7',
        padding: '5rem 0 3rem 0',
        borderTop: '1px solid rgba(196, 154, 82, 0.4)',
        marginTop: '5rem',
        position: 'relative'
      }}
    >
      {/* South Indian Ornamental Pattern at Top of Footer */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0B352D',
          border: '1px solid #C49A52',
          padding: '2px 18px',
          borderRadius: '20px',
          color: '#C49A52',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)'
        }}
      >
        <span>✦</span>
        <span style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.15em', fontSize: '0.68rem', textTransform: 'uppercase' }}>
          Bengaluru Dining Heritage
        </span>
        <span>✦</span>
      </div>

      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '3rem',
            marginBottom: '3.5rem'
          }}
        >
          {/* Col 1: Brand & Heritage Philosophy */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
                  border: '1.5px solid #C49A52',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C49A52',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 20V9C4 5.5 7.5 3 12 3C16.5 3 20 5.5 20 9V20" stroke="#C49A52" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M8 20V12C8 9.8 9.8 8 12 8C14.2 8 16 9.8 16 12V20" stroke="#C49A52" strokeWidth="1.3" strokeLinecap="round" />
                  <circle cx="12" cy="4.5" r="1.2" fill="#C49A52" />
                </svg>
              </div>
              <div>
                <span
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-serif)',
                    color: '#F7F0E2',
                    letterSpacing: '0.06em',
                    display: 'block',
                    lineHeight: 1.1
                  }}
                >
                  CUT THE QUEUE
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: '#C49A52',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700
                  }}
                >
                  Bengaluru Dining Heritage
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#E9DDC7', fontStyle: 'italic', fontFamily: 'var(--font-serif-sub)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              "Technology that respects the tradition of dining."
            </p>

            <p style={{ fontSize: '0.86rem', color: '#C5BAA8', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              A tribute to Bengaluru’s culinary institutions. Pre-order ahead from iconic dining houses, travel at your own pace, and arrive when your food is fresh, hot, and ready at the counter.
            </p>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: 'rgba(198, 161, 91, 0.12)',
                  border: '1px solid rgba(198, 161, 91, 0.35)',
                  color: '#C6A15B',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                <Award size={12} /> Bengaluru Heritage
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: 'rgba(247, 241, 229, 0.08)',
                  border: '1px solid rgba(247, 241, 229, 0.2)',
                  color: '#F7F1E5',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                <Clock size={12} /> Zero Queue Waiting
              </span>
            </div>
          </div>

          {/* Col 2: The 3 Iconic Brands */}
          <div>
            <h4
              style={{
                color: '#F7F1E5',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: 'var(--font-serif)',
                marginBottom: '1.25rem',
                letterSpacing: '0.04em'
              }}
            >
              Iconic Brands
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActivePage?.('brand-detail', { brandSlug: 'rameshwaram-cafe' });
                    navigate('/restaurants/rameshwaram-cafe');
                  }}
                  style={{
                    color: '#E8DDC8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#C6A15B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#E8DDC8'; }}
                >
                  <ChevronRight size={14} style={{ color: '#C6A15B' }} />
                  The Rameshwaram Cafe (4 Branches)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActivePage?.('brand-detail', { brandSlug: 'empire-restaurant' });
                    navigate('/restaurants/empire-restaurant');
                  }}
                  style={{
                    color: '#E8DDC8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#C6A15B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#E8DDC8'; }}
                >
                  <ChevronRight size={14} style={{ color: '#C6A15B' }} />
                  Empire Restaurant (5 Branches)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActivePage?.('brand-detail', { brandSlug: 'meghana-foods' });
                    navigate('/restaurants/meghana-foods');
                  }}
                  style={{
                    color: '#E8DDC8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#C6A15B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#E8DDC8'; }}
                >
                  <ChevronRight size={14} style={{ color: '#C6A15B' }} />
                  Meghana Foods (5 Branches)
                </button>
              </li>
              <li style={{ marginTop: '0.4rem', color: 'rgba(232, 221, 200, 0.65)', fontSize: '0.8rem', paddingLeft: '1.25rem' }}>
                All 14 branches across Indiranagar, Koramangala, Church St, Jayanagar & Whitefield.
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Hospitality & Concierge */}
          <div>
            <h4
              style={{
                color: '#F7F1E5',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: 'var(--font-serif)',
                marginBottom: '1.25rem',
                letterSpacing: '0.04em'
              }}
            >
              Customer Concierge
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
              <li>
                <button
                  type="button"
                  onClick={() => { setActivePage?.('restaurants'); navigate('/restaurants'); }}
                  style={{ color: '#E8DDC8', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#C6A15B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#E8DDC8'; }}
                >
                  Explore Bengaluru Restaurants
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActivePage?.('orders'); navigate('/orders'); }}
                  style={{ color: '#E8DDC8', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#C6A15B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#E8DDC8'; }}
                >
                  Live Order Queue Tracker
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActivePage?.('cart'); navigate('/cart'); }}
                  style={{ color: '#E8DDC8', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#C6A15B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#E8DDC8'; }}
                >
                  Review Pre-Order Tray
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActivePage?.('profile'); navigate('/profile'); }}
                  style={{ color: '#E8DDC8', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#C6A15B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#E8DDC8'; }}
                >
                  Chime & Vibration Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Bengaluru Culinary Standards */}
          <div>
            <h4
              style={{
                color: '#F7F1E5',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: 'var(--font-serif)',
                marginBottom: '1.25rem',
                letterSpacing: '0.04em'
              }}
            >
              Culinary Standards
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: '#C5BAA8' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F7F1E5' }}>
                <ShieldCheck size={16} style={{ color: '#C6A15B' }} />
                Instant QR Verification at Counter
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#C6A15B' }} />
                Pure Ghee & Authentic Spices
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: '#C6A15B' }} />
                Real-Time Kitchen Sync
              </li>
              <li style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(232, 221, 200, 0.65)' }}>
                Breakfast from 6:30 AM • Mughlai Feasts until 2:00 AM
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid rgba(198, 161, 91, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.825rem',
            color: 'rgba(232, 221, 200, 0.65)'
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} CutTheQueue. Royal South Indian Dining Heritage & Zero Waiting.
          </div>
          <div style={{ fontFamily: 'var(--font-serif-sub)', fontStyle: 'italic', color: '#C6A15B', fontSize: '0.95rem' }}>
            "Arrive to a table that's already waiting."
          </div>
        </div>
      </div>
    </footer>
  );
}
