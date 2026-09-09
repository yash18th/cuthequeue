import React from 'react';
import { UtensilsCrossed, ArrowRight, Clock, Bell, QrCode, Smartphone, Sparkles, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ setActivePage, onOpenCart }) {
  const { login } = useAuth();

  const handleQuickDemo = async (email, page) => {
    try {
      await login(email, 'password123');
      setActivePage(page);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '5rem 0 4rem 0',
        background: 'radial-gradient(ellipse at top, #ecfdf5 0%, #f8fafc 70%)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '840px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.4rem 1rem', background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem' }}>
            <Sparkles size={16} /> The Smart Food Pre-Ordering Platform
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Order before you arrive.<br />
            <span style={{ color: 'var(--primary)' }}>Pick up without waiting.</span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
            Skip the queue. Order your favorite food in advance and get notified the exact second it’s hot and ready.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setActivePage('home')}
            >
              Order Now <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => handleQuickDemo('campus@demo.com', 'restaurant-dashboard')}
            >
              Partner Your Restaurant
            </button>
          </div>

          {/* 1-Click Demo Evaluation Strip */}
          <div style={{
            background: 'white',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            textAlign: 'left'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Instant Evaluation Sandbox
              </span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Test role workflows with 1-click preset accounts:
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('customer@demo.com', 'home')}
              >
                👤 Customer
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('campus@demo.com', 'restaurant-dashboard')}
              >
                🍳 Kitchen Admin
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemo('admin@cutthequeue.com', 'superadmin')}
              >
                🛡️ Super Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Stepper Process Section */}
      <section style={{ padding: '4.5rem 0', background: 'white', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3.5rem auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              How Cut the Queue Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              From hunger to hot food in 5 effortless steps.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            position: 'relative'
          }}>
            {[
              { num: '01', title: 'Choose Restaurant', desc: 'Browse live menus, ratings, and preparation times.', icon: <UtensilsCrossed size={22} /> },
              { num: '02', title: 'Place & Pay Ahead', desc: 'Customize sides, select ASAP or scheduled pickup.', icon: <Smartphone size={22} /> },
              { num: '03', title: 'Kitchen Prepares', desc: 'Watch real-time prep status without waiting around.', icon: <Clock size={22} /> },
              { num: '04', title: 'Instant Notification', desc: 'Get chime, vibration, and push alert when food is ready.', icon: <Bell size={22} /> },
              { num: '05', title: 'QR Code Pick Up', desc: 'Flash your unique QR code at the counter and pick up.', icon: <QrCode size={22} /> },
            ].map((step, idx) => (
              <div
                key={idx}
                className="card"
                style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  {step.icon}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                  STEP {step.num}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.4rem 0 0.5rem 0' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Cut the Queue */}
      <section style={{ padding: '4.5rem 0', background: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3.5rem auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              Why Cut the Queue?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              Built specifically for busy students, faculty, and quick-service diners who value their time.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              {
                title: 'No Waiting in Ordering Lines',
                desc: 'Skip standing 20 minutes behind people deciding what to order. Order straight from your phone wherever you are.',
                icon: '⚡'
              },
              {
                title: 'Faster Pickup',
                desc: 'Food is prepared while you walk over. Arrive precisely when your buzzer chimes and grab your tray.',
                icon: '🚀'
              },
              {
                title: 'Live Order Tracking',
                desc: 'See exactly when the restaurant accepts, cooks, and wraps your meal with second-by-second updates.',
                icon: '👀'
              },
              {
                title: 'Real-Time Notifications & Vibration',
                desc: 'Rich desktop and mobile alerts with customizable sound chimes and gentle vibration feedback.',
                icon: '🔔'
              },
              {
                title: 'Tamper-Proof QR Pickup',
                desc: 'Unique cryptographic QR code generated for each order. Verified instantly by kitchen staff to prevent mixups.',
                icon: '🛡️'
              },
              {
                title: 'Streamlined Restaurant Kitchens',
                desc: 'Live order board helps chefs prioritize tickets, reduce counter chaos, and maximize turnaround speed.',
                icon: '📊'
              }
            ].map((feat, idx) => (
              <div
                key={idx}
                className="card"
                style={{ padding: '1.75rem', background: 'white' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{feat.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurant CTA Banner */}
      <section style={{ padding: '4rem 0', background: 'white' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '3.5rem 2rem',
            color: 'white',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Are you a restaurant or food court vendor?
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#d1fae5', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
              Increase your daily order capacity by 40% by eliminating counter bottlenecks. Start receiving pre-orders today.
            </p>
            <button
              className="btn btn-lg"
              style={{ background: 'white', color: '#047857', fontWeight: 700 }}
              onClick={() => handleQuickDemo('campus@demo.com', 'restaurant-dashboard')}
            >
              Explore Kitchen Live Board <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
