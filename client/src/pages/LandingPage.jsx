import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ArrowRight,
  Clock,
  QrCode,
  Sparkles,
  Award,
  Coffee,
  CheckCircle2,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Flame,
  Star,
  Users,
  Timer
} from 'lucide-react';
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

  const handleAreaClick = (areaName) => {
    setActivePage?.('restaurants');
    navigate(`/restaurants?search=${encodeURIComponent(areaName)}`);
  };

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ====================================================
          1. CINEMATIC ROYAL HERO SECTION
          ==================================================== */}
      <section
        className="bg-hero-canvas"
        style={{
          padding: '5rem 0 4rem 0',
          position: 'relative',
          borderBottom: '1px solid rgba(196, 154, 82, 0.3)'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '4rem',
              alignItems: 'center'
            }}
          >
            {/* Left Column: Magazine-Style Heritage Typography */}
            <div>
              {/* Eyebrow with decorative gold rule */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#A98242',
                    fontFamily: 'var(--font-serif)'
                  }}
                >
                  <Sparkles size={13} style={{ color: '#C49A52' }} />
                  BUILT FOR BENGALURU'S DINING CULTURE
                </span>
                <div
                  style={{
                    width: '64px',
                    height: '2px',
                    background: 'linear-gradient(90deg, #C49A52 0%, transparent 100%)',
                    marginTop: '6px'
                  }}
                />
              </div>

              {/* Stately Serif Headline */}
              <h1
                className="font-royal"
                style={{
                  fontSize: 'clamp(2.6rem, 5.2vw, 4rem)',
                  fontWeight: 900,
                  color: '#191714',
                  lineHeight: 1.12,
                  letterSpacing: '0.01em',
                  marginBottom: '1.25rem'
                }}
              >
                SKIP THE QUEUE.
                <br />
                <span
                  style={{
                    color: '#123F35',
                    fontStyle: 'italic',
                    fontFamily: 'var(--font-serif-sub)',
                    fontWeight: 600
                  }}
                >
                  Savour the moment.
                </span>
              </h1>

              {/* Supporting Description */}
              <p
                style={{
                  fontSize: '1.15rem',
                  color: '#57534E',
                  lineHeight: 1.68,
                  marginBottom: '2.25rem',
                  maxWidth: '520px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}
              >
                Pre-order from Bengaluru's most loved restaurants and arrive when your food is ready. Experience legendary dining traditions without standing in queues or waiting for preparation.
              </p>

              {/* Call-to-Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <button
                  className="btn btn-gold btn-lg"
                  onClick={() => {
                    setActivePage?.('restaurants');
                    navigate('/restaurants');
                  }}
                  style={{ gap: '8px', padding: '0.9rem 1.8rem' }}
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
                  style={{ padding: '0.9rem 1.6rem' }}
                >
                  <span>How It Works</span>
                </button>
              </div>

              {/* Quick Heritage Trust Metrics */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.75rem',
                  flexWrap: 'wrap',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(196, 154, 82, 0.3)',
                  fontSize: '0.85rem',
                  color: '#57534E'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} style={{ color: '#C49A52' }} />
                  <strong style={{ color: '#191714' }}>14 Authentic Branches</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} style={{ color: '#123F35' }} />
                  <span>Live Queue Tracking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={16} style={{ color: '#C49A52' }} />
                  <span>Instant Counter Pass</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-End Framed Culinary Heritage Composition */}
            <div style={{ position: 'relative' }}>
              <div className="heritage-ornamental-frame">
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    height: '430px'
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200"
                    alt="South Indian ghee roast feast on fresh banana leaf"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Contrast Gradient Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(11, 53, 45, 0.15) 0%, rgba(11, 53, 45, 0.8) 100%)'
                    }}
                  />

                  {/* Top Heritage Badge inside image */}
                  <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2 }}>
                    <span
                      style={{
                        background: 'rgba(11, 53, 45, 0.92)',
                        color: '#C49A52',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: '1px solid rgba(196, 154, 82, 0.5)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-serif)',
                        letterSpacing: '0.08em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    >
                      ✦ BENGALURU DINING HERITAGE
                    </span>
                  </div>

                  {/* Upgraded Live Queue Card Preview at Bottom */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      right: '16px',
                      background: '#F7F0E2',
                      borderRadius: '8px',
                      padding: '1.1rem 1.25rem',
                      border: '1.5px solid #C49A52',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
                      zIndex: 3
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="queue-pill queue-pill-low" style={{ background: '#EEF6F4', border: '1px solid #A8CFC4' }}>
                          <span className="dot live-indicator-pulse" style={{ background: '#123F35', width: '7px', height: '7px' }} />
                          ● LIVE QUEUE
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#8C827A', fontWeight: 600 }}>
                          THE RAMESHWARAM CAFE • Indiranagar
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.66rem', color: '#A98242', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          EST. PREPARATION
                        </div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#123F35' }}>
                          ~12 MIN
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191714', fontFamily: 'var(--font-serif)' }}>
                          Ghee Podi Masala Dosa + Filter Coffee
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#57534E', marginTop: '2px' }}>
                          8 orders ahead in kitchen • Prepared fresh as you travel
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#0B352D',
                          border: '1px solid #C49A52',
                          color: '#C49A52',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em'
                        }}
                      >
                        PASS CQ102
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Fast Sandbox Fill */}
          <div
            style={{
              marginTop: '3.5rem',
              background: '#F7F0E2',
              border: '1px solid #E9DDC7',
              borderRadius: '8px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 4px 14px rgba(25, 23, 20, 0.05)',
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
                  color: '#A98242',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-serif)'
                }}
              >
                Instant Evaluation Sandbox
              </div>
              <p style={{ fontSize: '0.85rem', color: '#57534E', margin: '2px 0 0 0' }}>
                Explore real role workflows with pre-authenticated demo credentials:
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('customer@demo.com', 'home')}
                style={{ background: '#FFFFFF', borderColor: '#C49A52', color: '#191714' }}
              >
                👤 Customer (Alex)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('campus@demo.com', 'restaurant-dashboard')}
                style={{ background: '#FFFFFF', borderColor: '#C49A52', color: '#191714' }}
              >
                🍳 Rameshwaram Kitchen
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('spice@demo.com', 'restaurant-dashboard')}
                style={{ background: '#FFFFFF', borderColor: '#C49A52', color: '#191714' }}
              >
                🍗 Empire Kitchen
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('admin@cutthequeue.com', 'superadmin')}
                style={{ background: '#FFFFFF', borderColor: '#C49A52', color: '#191714' }}
              >
                🛡️ Super Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          2. HERITAGE STORY SECTION (Section 9)
          ==================================================== */}
      <section
        className="bg-temple-sand"
        style={{
          padding: '5rem 0',
          borderBottom: '1px solid rgba(196, 154, 82, 0.3)'
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
            {/* Story Text */}
            <div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#A98242',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-serif)'
                }}
              >
                Our Bengaluru Heritage
              </span>
              <h2
                className="font-royal"
                style={{
                  fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
                  fontWeight: 800,
                  color: '#191714',
                  lineHeight: 1.22,
                  margin: '8px 0 1.5rem 0'
                }}
              >
                Where Bengaluru's food heritage meets your time.
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#57534E',
                  lineHeight: 1.75,
                  marginBottom: '1.25rem'
                }}
              >
                Bengaluru has always been a city that knows how to eat well. From crisp dosas and fragrant filter coffee to legendary biryanis and family recipes passed through generations, its dining culture is part of the city's identity.
              </p>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#123F35',
                  fontWeight: 600,
                  lineHeight: 1.75,
                  marginBottom: '2rem'
                }}
              >
                Cut the Queue brings that experience into the modern day — allowing you to order ahead without taking away the soul of the restaurant.
              </p>

              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', borderTop: '1px solid rgba(196, 154, 82, 0.3)', paddingTop: '1.5rem' }}>
                <div>
                  <div className="font-royal" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#123F35' }}>100%</div>
                  <div style={{ fontSize: '0.8rem', color: '#57534E', fontWeight: 600 }}>Authentic Recipes</div>
                </div>
                <div>
                  <div className="font-royal" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#C49A52' }}>0 Mins</div>
                  <div style={{ fontSize: '0.8rem', color: '#57534E', fontWeight: 600 }}>Waiting in Queue</div>
                </div>
                <div>
                  <div className="font-royal" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#641F27' }}>14</div>
                  <div style={{ fontSize: '0.8rem', color: '#57534E', fontWeight: 600 }}>Iconic Branches</div>
                </div>
              </div>
            </div>

            {/* Traditional Visual Composition */}
            <div style={{ position: 'relative' }}>
              <div
                className="heritage-card"
                style={{
                  padding: '0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 36px rgba(18, 63, 53, 0.12)',
                  border: '1.5px solid #C49A52'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
                  alt="Traditional South Indian feast and coffee tumbler"
                  style={{ width: '100%', height: '380px', objectFit: 'cover' }}
                />
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    background: '#F7F0E2',
                    borderTop: '1px solid rgba(196, 154, 82, 0.35)'
                  }}
                >
                  <div className="font-royal" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#123F35' }}>
                    Tradition Honoured, Friction Removed
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#57534E', marginTop: '4px' }}>
                    Prepared at iconic counters in Indiranagar, Church Street, and Koramangala.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          3. FEATURED RESTAURANTS: BENGALURU'S LEGENDARY TABLES (Section 10)
          ==================================================== */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-canvas)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem auto' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#A98242',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-serif)'
              }}
            >
              Bengaluru's Legendary Tables
            </span>
            <h2
              className="font-royal"
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 2.8rem)',
                fontWeight: 800,
                color: '#191714',
                margin: '6px 0 10px 0'
              }}
            >
              Three Iconic Names. One Effortless Way to Dine.
            </h2>
            <p style={{ color: '#57534E', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Pre-order ahead from Bengaluru's undisputed culinary landmarks.
            </p>
            <div className="heritage-filigree-rule">✦</div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2.25rem'
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
              <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800"
                  alt="The Rameshwaram Cafe"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className="heritage-badge badge-gold">Est. 2021 • Pure Veg</span>
                </div>
                <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                  <span className="queue-pill queue-pill-moderate">
                    <span className="dot" /> ~12 min prep
                  </span>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 className="font-royal" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0', color: '#191714' }}>
                  The Rameshwaram Cafe
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#A98242', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Pure Veg • South Indian • Ghee Goodness
                </p>
                <p style={{ fontSize: '0.88rem', color: '#57534E', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  Famous for crispy Ghee Podi Masala Dosas, melt-in-the-mouth Thatte Idlis, and aromatic filter coffee.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E9DDC7', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#123F35' }}>
                    4 Branches: Indiranagar, JP Nagar, Whitefield...
                  </span>
                  <span className="btn btn-sm btn-forest" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    Explore Menu &rarr;
                  </span>
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
              <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
                  alt="Empire Restaurant"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className="heritage-badge badge-forest">Est. 1966 • Iconic Feasts</span>
                </div>
                <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                  <span className="queue-pill queue-pill-low">
                    <span className="dot" /> ~15 min prep
                  </span>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 className="font-royal" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0', color: '#191714' }}>
                  Empire Restaurant
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#A98242', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  North Indian • Mughlai • Arabian • Biryani
                </p>
                <p style={{ fontSize: '0.88rem', color: '#57534E', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  The taste of Bengaluru since 1966. Famous for Empire Special Chicken Kebab, coin parottas, and late-night feasts.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E9DDC7', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#123F35' }}>
                    5 Branches: Church St, Koramangala, Indiranagar...
                  </span>
                  <span className="btn btn-sm btn-forest" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    Explore Menu &rarr;
                  </span>
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
              <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800"
                  alt="Meghana Foods"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className="heritage-badge badge-maroon">Est. 2006 • Spice Master</span>
                </div>
                <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                  <span className="queue-pill queue-pill-moderate">
                    <span className="dot" /> ~18 min prep
                  </span>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 className="font-royal" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0', color: '#191714' }}>
                  Meghana Foods
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#A98242', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Andhra • Biryani Specialist • Guntur Spices
                </p>
                <p style={{ fontSize: '0.88rem', color: '#57534E', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  Synonymous with fiery Andhra cuisine and legendary long-grain Biryanis cooked with fragrant basmati and tender cuts.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E9DDC7', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#123F35' }}>
                    5 Branches: Koramangala, Indiranagar, Jayanagar...
                  </span>
                  <span className="btn btn-sm btn-forest" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    Explore Menu &rarr;
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          4. BENGALURU BRANCH DISCOVERY (Section 11)
          ==================================================== */}
      <section style={{ padding: '4.5rem 0', background: '#F7F0E2', borderTop: '1px solid #E9DDC7', borderBottom: '1px solid #E9DDC7' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#A98242',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-serif)'
              }}
            >
              Find Your Table Across Bengaluru
            </span>
            <h2
              className="font-royal"
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: '#191714',
                margin: '6px 0 10px 0'
              }}
            >
              14 Verified Authentic Branches
            </h2>
            <p style={{ color: '#57534E', fontSize: '1rem' }}>
              Select a neighborhood to discover supported iconic dining counters near you.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
              maxWidth: '820px',
              margin: '0 auto'
            }}
          >
            {[
              'Indiranagar',
              'Koramangala',
              'Church Street',
              'Jayanagar',
              'JP Nagar',
              'Brookfield',
              'Rajajinagar',
              'Kammanahalli',
              'Marathahalli',
              'Singasandra',
              'Residency Road'
            ].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handleAreaClick(loc)}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #C49A52',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  color: '#123F35',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#123F35';
                  e.currentTarget.style.color = '#F7F0E2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#123F35';
                }}
              >
                <MapPin size={15} style={{ color: '#C49A52' }} />
                <span>Explore {loc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          5. HOW IT WORKS: 5-STEP TRADITIONAL JOURNEY (Section 13)
          ==================================================== */}
      <section
        id="how-it-works"
        className="bg-forest-section"
        style={{
          padding: '5.5rem 0',
          borderTop: '1px solid rgba(196, 154, 82, 0.35)',
          borderBottom: '1px solid rgba(196, 154, 82, 0.35)'
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 4rem auto' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#C49A52',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-serif)'
              }}
            >
              From Queue to Table
            </span>
            <h2
              className="font-royal"
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3rem)',
                fontWeight: 800,
                color: '#F7F0E2',
                margin: '8px 0 12px 0'
              }}
            >
              From queue to table, beautifully simple.
            </h2>
            <p style={{ color: '#E9DDC7', fontSize: '1.05rem', lineHeight: 1.6 }}>
              A refined dining flow that respects your time while preserving authentic food quality.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.75rem'
            }}
          >
            {[
              { num: '01', title: 'Choose Your Restaurant', desc: 'Browse the 14 authentic branches of Rameshwaram Cafe, Empire, and Meghana Foods.' },
              { num: '02', title: 'Build Your Order', desc: 'Customize dosas, biryanis, and filter coffee with transparent preparation times.' },
              { num: '03', title: 'Watch It Being Prepared', desc: 'The kitchen starts cooking fresh as you travel, with live real-time queue position.' },
              { num: '04', title: 'Arrive When Ready', desc: 'Receive instant chime notification. Arrive without waiting in coupon or token lines.' },
              { num: '05', title: 'Pick Up & Enjoy', desc: 'Flash your single-use QR pass at the dedicated pickup counter and savour your meal.' }
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(18, 63, 53, 0.65)',
                  border: '1px solid rgba(196, 154, 82, 0.35)',
                  borderRadius: '10px',
                  padding: '2rem 1.4rem',
                  position: 'relative'
                }}
              >
                <div
                  className="font-royal"
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: '#C49A52',
                    lineHeight: 1,
                    marginBottom: '1rem',
                    opacity: 0.9
                  }}
                >
                  {step.num}
                </div>
                <h3
                  className="font-royal"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#F7F0E2',
                    marginBottom: '0.75rem'
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#E9DDC7', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          6. LIVE KITCHEN EXPERIENCE & TRUST/TECHNOLOGY (Sections 14 & 15)
          ==================================================== */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-canvas)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '4rem',
              alignItems: 'center'
            }}
          >
            {/* Live Kitchen Experience Demo Card */}
            <div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#A98242',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-serif)'
                }}
              >
                Live Kitchen Coordination
              </span>
              <h2
                className="font-royal"
                style={{
                  fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
                  fontWeight: 800,
                  color: '#191714',
                  margin: '8px 0 1.25rem 0'
                }}
              >
                Know when your food is ready.
              </h2>
              <p style={{ color: '#57534E', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                No guessing. Cut the Queue coordinates with kitchen staff in real time, synchronizing food readiness to the minute of your arrival.
              </p>

              {/* Concierge Stepper Display */}
              <div
                className="heritage-card"
                style={{
                  padding: '1.75rem',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1.5px solid #C49A52'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8C827A', textTransform: 'uppercase', fontWeight: 700 }}>
                      Live Status Preview
                    </span>
                    <h4 className="font-royal" style={{ fontSize: '1.15rem', color: '#123F35', margin: '2px 0 0 0' }}>
                      Empire Restaurant • Church Street
                    </h4>
                  </div>
                  <span className="queue-pill queue-pill-low">
                    <span className="dot live-indicator-pulse" /> LIVE
                  </span>
                </div>

                {/* Timeline Visual */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { label: 'Order Received', state: 'done' },
                    { label: 'Restaurant Confirmed', state: 'done' },
                    { label: 'Preparing Fresh', state: 'active' },
                    { label: 'Ready for Pickup', state: 'upcoming' },
                    { label: 'Completed', state: 'upcoming' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: item.state === 'done' ? '#123F35' : item.state === 'active' ? '#C49A52' : '#E9DDC7',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: item.state === 'active' ? '0 0 8px rgba(196, 154, 82, 0.6)' : 'none'
                        }}
                      >
                        {item.state === 'done' ? '✓' : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: item.state === 'active' ? 800 : 600,
                          color: item.state === 'active' ? '#123F35' : item.state === 'done' ? '#191714' : '#8C827A'
                        }}
                      >
                        {item.label}
                      </span>
                      {item.state === 'active' && (
                        <span style={{ fontSize: '0.72rem', color: '#C49A52', fontWeight: 700, marginLeft: 'auto' }}>
                          ~6 mins remaining
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust & Technology Pillars (Section 15) */}
            <div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#A98242',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-serif)'
                }}
              >
                Tradition Meets Precision
              </span>
              <h2
                className="font-royal"
                style={{
                  fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
                  fontWeight: 800,
                  color: '#191714',
                  margin: '8px 0 1.5rem 0'
                }}
              >
                Tradition at the table. Technology behind it.
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                {[
                  {
                    icon: <Clock size={20} style={{ color: '#C49A52' }} />,
                    title: 'Live Queue Visibility',
                    desc: 'Real-time kitchen order load data informs you before placing your order.'
                  },
                  {
                    icon: <Timer size={20} style={{ color: '#123F35' }} />,
                    title: 'Synchronized Pre-Ordering',
                    desc: 'Food is prepared while you travel so hot items are never sitting cold.'
                  },
                  {
                    icon: <QrCode size={20} style={{ color: '#C49A52' }} />,
                    title: 'Single-Use Counter Pass',
                    desc: 'Anti-reuse QR verification ensures instant pickup at the kitchen counter.'
                  },
                  {
                    icon: <ShieldCheck size={20} style={{ color: '#641F27' }} />,
                    title: 'Zero Delivery Markups',
                    desc: 'Dine in authentic Bengaluru traditions with authentic in-store pricing.'
                  }
                ].map((pillar, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '1.25rem',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E9DDC7'
                    }}
                  >
                    <div style={{ padding: '8px', background: '#F7F0E2', borderRadius: '6px', border: '1px solid #E9DDC7' }}>
                      {pillar.icon}
                    </div>
                    <div>
                      <h4 className="font-royal" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#191714', margin: '0 0 4px 0' }}>
                        {pillar.title}
                      </h4>
                      <p style={{ fontSize: '0.86rem', color: '#57534E', margin: 0, lineHeight: 1.55 }}>
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          7. SOCIAL PROOF & TESTIMONIALS (Section 16)
          ==================================================== */}
      <section
        className="bg-temple-sand"
        style={{
          padding: '5rem 0',
          borderTop: '1px solid rgba(196, 154, 82, 0.3)',
          borderBottom: '1px solid rgba(196, 154, 82, 0.3)'
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#A98242',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-serif)'
              }}
            >
              Bengaluru Diners Speak
            </span>
            <h2
              className="font-royal"
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                color: '#191714',
                margin: '6px 0 10px 0'
              }}
            >
              Less waiting. More eating.
            </h2>
            <p style={{ color: '#57534E', fontSize: '1rem' }}>
              How Bengaluru regulars skip the line at their favourite food counters.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}
          >
            {[
              {
                quote: 'I used to spend 30 minutes in line at Rameshwaram Indiranagar on Sunday mornings. Now my ghee roast is hot on the counter the second I arrive.',
                author: 'Karthik Rao',
                role: 'Indiranagar Resident'
              },
              {
                quote: 'Empire Church Street after work is always packed. Pre-ordering kebabs on the metro and picking them up instantly is a game changer.',
                author: 'Pooja Hegde',
                role: 'MG Road Professional'
              },
              {
                quote: 'Meghana Foods biryani without standing in the token line. The live countdown lets me time my walk from Koramangala 5th block perfectly.',
                author: 'Arjun Menon',
                role: 'Koramangala Tech Lead'
              }
            ].map((t, idx) => (
              <div
                key={idx}
                className="heritage-card"
                style={{
                  padding: '2rem 1.75rem',
                  background: '#F7F0E2',
                  border: '1.5px solid #C49A52',
                  position: 'relative'
                }}
              >
                <div style={{ color: '#C49A52', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                  ★★★★★
                </div>
                <p
                  style={{
                    fontSize: '0.94rem',
                    color: '#191714',
                    fontStyle: 'italic',
                    fontFamily: 'var(--font-serif-sub)',
                    lineHeight: 1.68,
                    marginBottom: '1.5rem'
                  }}
                >
                  "{t.quote}"
                </p>
                <div style={{ borderTop: '1px solid #E9DDC7', paddingTop: '1rem' }}>
                  <div className="font-royal" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#123F35' }}>
                    {t.author}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8C827A' }}>
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          8. FINAL HOSPITALITY CALLOUT
          ==================================================== */}
      <section
        style={{
          padding: '5.5rem 0',
          background: 'linear-gradient(145deg, #0B352D 0%, #123F35 100%)',
          color: '#F7F0E2',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ maxWidth: '720px' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#C49A52',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-serif)',
              display: 'inline-block',
              marginBottom: '0.75rem'
            }}
          >
            Preserve Your Time
          </span>
          <h2
            className="font-royal"
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
              fontWeight: 800,
              color: '#F7F0E2',
              lineHeight: 1.2,
              marginBottom: '1.25rem'
            }}
          >
            Arrive to a table that's already waiting.
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#E9DDC7', lineHeight: 1.65, marginBottom: '2.5rem' }}>
            Experience Bengaluru's favourite dining traditions with modern zero-wait pre-ordering technology.
          </p>

          <button
            type="button"
            className="btn btn-gold btn-lg"
            onClick={() => {
              setActivePage?.('restaurants');
              navigate('/restaurants');
            }}
            style={{ padding: '0.95rem 2.2rem', fontSize: '1.05rem' }}
          >
            <span>Explore All 14 Branches</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
