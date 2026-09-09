import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Home, Store } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ padding: '5rem 0', minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '520px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3.5rem 2rem', background: 'white' }}>
          <div style={{
            fontSize: '5rem',
            fontWeight: 900,
            color: 'var(--primary)',
            letterSpacing: '-0.05em',
            lineHeight: 1,
            marginBottom: '1rem'
          }}>
            404
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Page Not Found
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            The page you're looking for doesn't exist or has moved. Return to campus dining to pre-order food and skip the line.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Home size={16} /> Go Home
            </Link>
            <Link to="/browse" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Store size={16} /> Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
