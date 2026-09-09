import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Home, Store } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="bg-warm-canvas" style={{ padding: '5rem 0', minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '540px', textAlign: 'center' }}>
        <div className="heritage-card" style={{ padding: '3.5rem 2rem' }}>
          <div className="font-royal" style={{
            fontSize: '5rem',
            fontWeight: 700,
            color: '#123C32',
            letterSpacing: '0.05em',
            lineHeight: 1,
            marginBottom: '1rem'
          }}>
            404
          </div>

          <h2 className="font-royal" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#123C32', marginBottom: '0.5rem' }}>
            Page Not Found
          </h2>

          <p style={{ color: '#42151B', opacity: 0.85, fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            The dining hall or kitchen you're seeking cannot be located. Return to discover Bengaluru's legendary dining traditions and reserve your table in advance.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Home size={16} /> Return Home
            </Link>
            <Link to="/restaurants" className="btn btn-forest" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Store size={16} /> Explore Bengaluru Restaurants
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
