import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight, Clock, Bell, QrCode, Smartphone, Sparkles, CheckCircle2, ShieldCheck, ChevronRight, MapPin, Award, Flame, Coffee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HeritageDivider from '../components/HeritageDivider';

export default function LandingPage({ setActivePage, onOpenCart }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleQuickDemo = async (email, page) => {
    try {
      await login(email, 'password123');
      if (page === 'restaurant-dashboard') {
        setActivePage?.('restaurant-dashboard');
        navigate('/kitchen');
      } else if (page === 'superadmin') {
        setActivePage?.('superadmin');
        navigate('/admin');
      } else {
        setActivePage?.('restaurants');
        navigate('/restaurants');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-warm-canvas" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {/* 1. ROYAL HERO SECTION */}
      <section
        style={{
          padding: '4.5rem 0 3.5rem 0',
          position: 'relative',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3.5rem',
              alignItems: 'center'
            }}
          >
            {/* Left Column: Stately Heritage Messaging */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.4rem 0.95rem',
                  background: '#FEF6EC',
                  border: '1px solid #E8DDC8',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-gold-muted)',
                  fontFamily: 'var(--font-serif)',
                  marginBottom: '1.25rem'
                }}
              >
                <Sparkles size={14} style={{ color: 'var(--accent-gold)' }} />
                Built for Bengaluru's Dining Culture
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--text-charcoal)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                  marginBottom: '1.25rem'
                }}
              >
                Skip the queue.
                <br />
                <span style={{ color: 'var(--bg-deep-green)', fontStyle: 'italic', fontFamily: 'var(--font-serif-sub)' }}>
                  Savour the moment.
                </span>
              </h1>

              <p
                style={{
                  fontSize: '1.15rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: '2rem',
                  maxWidth: '540px'
                }}
              >
                Pre-order from Bengaluru's most loved restaurants and arrive when your food is ready. Experience legendary dining traditions without standing in queues or waiting for food preparation.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <button
                  className="btn btn-gold btn-lg"
                  onClick={() => {
                    setActivePage?.('restaurants');
                    navigate('/restaurants');
                  }}
                  style={{ gap: '8px' }}
                >
                  <span>Explore Restaurants</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  className="btn btn-forest btn-lg"
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>How It Works</span>
                </button>
              </div>

              {/* Quick Trust Highlights */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(198, 161, 91, 0.25)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} style={{ color: 'var(--accent-gold)' }} />
                  <strong>14 Authentic Branches</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} style={{ color: 'var(--bg-deep-green)' }} />
                  <span>Live Queue Tracking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={16} style={{ color: 'var(--accent-gold)' }} />
                  <span>Instant Counter Pass</span>
                </div>
              </div>
            </div>

            {/* Right Column: Traditional Hospitality Visual Composition */}
            <div style={{ position: 'relative' }}>
              <div
                className="heritage-card heritage-frame"
                style={{
                  padding: '8px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  boxShadow: '0 20px 40px -10px rgba(11, 41, 35, 0.22)'
                }}
              >
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '420px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200"
                    alt="Authentic South Indian feast on banana leaf"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Gradient Overlay for Mood & Contrast */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(11, 41, 35, 0.15) 0%, rgba(11, 41, 35, 0.75) 100%)'
                    }}
                  />

                  {/* Top Badge: Bengaluru Culinary Heritage */}
                  <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2 }}>
                    <span
                      style={{
                        background: 'rgba(11, 41, 35, 0.9)',
                        color: '#C6A15B',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(198, 161, 91, 0.4)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-serif)',
                        letterSpacing: '0.04em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Coffee size={14} /> Ghee Roasts • Biryanis • Filter Coffee
                    </span>
                  </div>

                  {/* Floating Live Queue Ticket Preview on Image */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      right: '16px',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '1rem 1.25rem',
                      border: '1px solid #E8DDC8',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                      zIndex: 3
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="queue-pill queue-pill-moderate">
                          <span className="dot" />
                          ● LIVE QUEUE
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          The Rameshwaram Cafe • Indiranagar
                        </span>
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--bg-deep-green)' }}>
                        ~12 Min Prep
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                          Ghee Podi Masala Dosa + Filter Coffee
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          8 orders ahead in kitchen • Prepared fresh as you travel
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#FEF6EC',
                          border: '1px solid #E8DDC8',
                          color: '#A98242',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}
                      >
                        Pass CQ102
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Demo Evaluation Sandbox Strip */}
          <div
            style={{
              marginTop: '3.5rem',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--accent-gold-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-serif)'
                }}
              >
                Instant Evaluation Sandbox
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Test role workflows instantly with authenticated demo personas:
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('customer@demo.com', 'home')}
              >
                👤 Customer (Alex)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('campus@demo.com', 'restaurant-dashboard')}
              >
                🍳 Rameshwaram Cafe Kitchen
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('spice@demo.com', 'restaurant-dashboard')}
              >
                🍗 Empire Restaurant Kitchen
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('admin@cutthequeue.com', 'superadmin')}
              >
                🛡️ Super Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 3 ICONIC BRANDS SHOWCASE */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-canvas)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: 'var(--accent-gold-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-serif)'
              }}
            >
              Bengaluru Dining Institutions
            </span>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-charcoal)',
                letterSpacing: '-0.01em',
                margin: '6px 0 10px 0'
              }}
            >
              Three Legendary Brands. 14 Authentic Branches.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
              Handcrafted South Indian breakfast, legendary Mughlai feasts, and fiery Andhra biryanis.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem'
            }}
          >
            {/* Brand 1: The Rameshwaram Cafe */}
            <div
              className="heritage-card"
              style={{ padding: '0', cursor: 'pointer' }}
              onClick={() => {
                setActivePage?.('brand-detail', { brandSlug: 'rameshwaram-cafe' });
                navigate('/restaurants/rameshwaram-cafe');
              }}
            >
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800"
                  alt="The Rameshwaram Cafe"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className="heritage-badge badge-gold">Est. 2021 • Pure Veg</span>
                </div>
              </div>
              <div style={{ padding: '1.4rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-serif)', margin: '0 0 4px 0' }}>
                  The Rameshwaram Cafe
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Pure Veg • South Indian • Ghee Goodness
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Famous for crispy Ghee Podi Masala Dosas, melt-in-the-mouth Thatte Idlis, and aromatic filter coffee.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                    4 Branches: Indiranagar, JP Nagar, Whitefield, Rajajinagar
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--accent-gold)' }} />
                </div>
              </div>
            </div>

            {/* Brand 2: Empire Restaurant */}
            <div
              className="heritage-card"
              style={{ padding: '0', cursor: 'pointer' }}
              onClick={() => {
                setActivePage?.('brand-detail', { brandSlug: 'empire-restaurant' });
                navigate('/restaurants/empire-restaurant');
              }}
            >
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
                  alt="Empire Restaurant"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className="heritage-badge badge-forest">Est. 1966 • Iconic Feasts</span>
                </div>
              </div>
              <div style={{ padding: '1.4rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-serif)', margin: '0 0 4px 0' }}>
                  Empire Restaurant
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  North Indian • Mughlai • Arabian • Biryani
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  The taste of Bengaluru since 1966. Famous for Empire Special Chicken Kebab, coin parottas, and late-night feasts.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                    5 Branches: Church St, Koramangala, Indiranagar, Jayanagar
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--accent-gold)' }} />
                </div>
              </div>
            </div>

            {/* Brand 3: Meghana Foods */}
            <div
              className="heritage-card"
              style={{ padding: '0', cursor: 'pointer' }}
              onClick={() => {
                setActivePage?.('brand-detail', { brandSlug: 'meghana-foods' });
                navigate('/restaurants/meghana-foods');
              }}
            >
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800"
                  alt="Meghana Foods"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className="heritage-badge badge-maroon">Est. 2006 • Spice Master</span>
                </div>
              </div>
              <div style={{ padding: '1.4rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-serif)', margin: '0 0 4px 0' }}>
                  Meghana Foods
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Andhra • Biryani Specialist • Guntur Spices
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Synonymous with fiery Andhra cuisine and legendary long-grain Biryanis cooked with fragrant basmati and tender cuts.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                    5 Branches: Koramangala, Indiranagar, Jayanagar, Residency Rd
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--accent-gold)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HeritageDivider label="Concierge Flow" />

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" style={{ padding: '3.5rem 0 4.5rem 0', background: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: 'var(--accent-gold-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-serif)'
              }}
            >
              Order Before You Arrive
            </span>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-charcoal)',
                letterSpacing: '-0.01em',
                margin: '6px 0 10px 0'
              }}
            >
              How Cut the Queue Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Eliminating long queues, tokens, and waiting times across Bengaluru in 3 refined steps.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                background: 'var(--bg-canvas)',
                padding: '2rem 1.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-serif)',
                  color: 'rgba(198, 161, 91, 0.4)',
                  lineHeight: 1,
                  marginBottom: '1rem'
                }}
              >
                01
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-serif)', marginBottom: '0.65rem', color: 'var(--text-charcoal)' }}>
                Pre-Order from Anywhere
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Select your restaurant branch and meal from home, office, or while in transit. Pay securely in advance with zero token hassle.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                background: 'var(--bg-canvas)',
                padding: '2rem 1.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-serif)',
                  color: 'rgba(18, 60, 50, 0.35)',
                  lineHeight: 1,
                  marginBottom: '1rem'
                }}
              >
                02
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-serif)', marginBottom: '0.65rem', color: 'var(--text-charcoal)' }}>
                Kitchen Prepares While You Travel
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The kitchen receives your ticket and cooks your order fresh while you travel. Track live queue position and preparation countdown.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                background: 'var(--bg-canvas)',
                padding: '2rem 1.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-serif)',
                  color: 'rgba(198, 161, 91, 0.4)',
                  lineHeight: 1,
                  marginBottom: '1rem'
                }}
              >
                03
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-serif)', marginBottom: '0.65rem', color: 'var(--text-charcoal)' }}>
                Walk In & Collect Hot
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Receive instant chime notification the second it is ready. Walk past the long ordering queue, present your QR code pass, and savour your meal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FINAL HOSPITALITY CALLOUT */}
      <section style={{ padding: '5rem 0', background: 'linear-gradient(145deg, #0B2923 0%, #123C32 100%)', color: '#F7F1E5', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#C6A15B',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-serif)',
              display: 'inline-block',
              marginBottom: '0.75rem'
            }}
          >
            Preserve Your Time
          </span>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-serif)',
              color: '#F7F1E5',
              lineHeight: 1.2,
              marginBottom: '1.25rem'
            }}
          >
            Arrive to a table that's already waiting.
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#E8DDC8', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Experience Bengaluru's favourite dining traditions with modern zero-wait pre-ordering technology.
          </p>

          <button
            type="button"
            className="btn btn-gold btn-lg"
            onClick={() => {
              setActivePage?.('restaurants');
              navigate('/restaurants');
            }}
            style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
          >
            <span>Explore All 14 Branches</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
