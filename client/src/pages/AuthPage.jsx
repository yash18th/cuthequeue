import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, User, Phone, ArrowRight, Shield, CheckCircle } from 'lucide-react';

export default function AuthPage({ setActivePage }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Simulate password reset email send
        setResetSent(true);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const res = await login(formData.email, formData.password);
        if (res.user.role === 'restaurant_admin') {
          setActivePage('restaurant-dashboard');
        } else if (res.user.role === 'super_admin') {
          setActivePage('superadmin');
        } else {
          setActivePage('home');
        }
      } else {
        const res = await register(formData);
        if (res.user.role === 'restaurant_admin') {
          setActivePage('restaurant-dashboard');
        } else {
          setActivePage('home');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (email, role) => {
    setError('');
    setLoading(true);
    try {
      await login(email, 'password123');
      if (role === 'customer') setActivePage('home');
      else if (role === 'restaurant_admin') setActivePage('restaurant-dashboard');
      else if (role === 'super_admin') setActivePage('superadmin');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3.5rem 0', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="card" style={{ padding: '2.25rem', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-medium)' }}>
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
            }}>
              <UtensilsCrossed size={24} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {isForgotPassword
                ? 'Reset Password'
                : isLogin
                ? 'Welcome Back'
                : 'Create an Account'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {isForgotPassword
                ? 'Enter your email to receive recovery instructions'
                : isLogin
                ? 'Sign in to place orders and skip restaurant waiting lines'
                : 'Join Cut the Queue to order ahead and pick up instantly'}
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fff1f2',
              color: '#be123c',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              border: '1px solid #fecdd3'
            }}>
              {error}
            </div>
          )}

          {resetSent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ color: '#059669', marginBottom: '1rem' }}>
                <CheckCircle size={44} style={{ margin: '0 auto' }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Reset Link Dispatched
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                We've sent a password reset link to <strong>{formData.email}</strong>. Check your inbox to set a new password.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setResetSent(false);
                  setIsForgotPassword(false);
                  setIsLogin(true);
                }}
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {!isLogin && !isForgotPassword && (
                <>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Alex Morgan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">I want to</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${formData.role === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFormData({ ...formData, role: 'customer' })}
                      >
                        Order Food (Customer)
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${formData.role === 'restaurant_admin' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFormData({ ...formData, role: 'restaurant_admin' })}
                      >
                        Kitchen Partner
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@campus.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {!isForgotPassword && (
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setIsForgotPassword(true); setError(''); }}
                        style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
                disabled={loading}
              >
                {loading
                  ? 'Processing...'
                  : isForgotPassword
                  ? 'Send Recovery Link'
                  : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem' }}>
                {isForgotPassword ? (
                  <button
                    type="button"
                    style={{ color: 'var(--primary)', fontWeight: 600 }}
                    onClick={() => { setIsForgotPassword(false); setIsLogin(true); }}
                  >
                    Back to Sign In
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      style={{ color: 'var(--primary)', fontWeight: 700 }}
                      onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}

          {/* 1-Click Fast Sandbox Fill for Reviewers */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px dashed var(--border-medium)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
              One-Click Demo Credentials
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleDemoSelect('customer@demo.com', 'customer')}
                style={{ fontSize: '0.75rem' }}
              >
                Alex (Customer)
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleDemoSelect('campus@demo.com', 'restaurant_admin')}
                style={{ fontSize: '0.75rem' }}
              >
                Campus Cafe (Kitchen)
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleDemoSelect('spice@demo.com', 'restaurant_admin')}
                style={{ fontSize: '0.75rem' }}
              >
                Spice Corner (Kitchen)
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleDemoSelect('admin@cutthequeue.com', 'super_admin')}
                style={{ fontSize: '0.75rem' }}
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
