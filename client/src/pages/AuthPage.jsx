import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, User, Phone, ArrowRight, ArrowLeft, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function AuthPage({ setActivePage, initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const redirectUser = () => {
    if (redirectParam && redirectParam.startsWith('/')) {
      navigate(redirectParam);
      return;
    }
    setActivePage?.('home');
    navigate('/restaurants');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setLoading(true);

    const emailToSubmit = typeof formData.email === 'string' ? formData.email.trim().toLowerCase() : '';
    const passwordToSubmit = typeof formData.password === 'string' ? formData.password.trim() : '';

    if (!emailToSubmit || !passwordToSubmit) {
      setError('Please provide both email address and password.');
      setErrorCode('VALIDATION_ERROR');
      setLoading(false);
      return;
    }

    try {
      if (isForgotPassword) {
        setResetSent(true);
        setLoading(false);
        return;
      }

      if (isLogin) {
        await login(emailToSubmit, passwordToSubmit);
        redirectUser();
      } else {
        await register({
          ...formData,
          name: typeof formData.name === 'string' ? formData.name.trim() : '',
          email: emailToSubmit,
          password: passwordToSubmit,
          phone: typeof formData.phone === 'string' ? formData.phone.trim() : ''
        });
        redirectUser();
      }
    } catch (err) {
      const code = err.code || err.data?.code || (err.status === 409 ? 'EMAIL_ALREADY_REGISTERED' : err.status >= 500 ? 'SERVER_ERROR' : '');
      setErrorCode(code);

      if (code === 'EMAIL_ALREADY_REGISTERED' || code === 'ACCOUNT_EXISTS') {
        setError('This email is already registered. Please sign in.');
      } else if (code === 'INVALID_PASSWORD') {
        setError('Incorrect password. Please try again.');
      } else if (code === 'ACCOUNT_NOT_FOUND') {
        setError('No account found with this email.');
      } else if (code === 'NETWORK_ERROR') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else if (code === 'SERVER_ERROR') {
        setError('Something went wrong on the server. Please try again.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-warm-canvas" style={{ padding: '3.5rem 0', minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '500px' }}>
        <button
          type="button"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="btn btn-sm btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '1rem',
            background: 'rgba(18, 60, 50, 0.08)',
            borderColor: 'rgba(198, 161, 91, 0.3)',
            color: '#123C32'
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="heritage-card" style={{ padding: '2.5rem 2.25rem', boxShadow: '0 12px 36px rgba(11, 41, 35, 0.12)' }}>
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0B2923 0%, #123C32 100%)',
              border: '2px solid #C6A15B',
              color: '#C6A15B',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 6px 16px rgba(11, 41, 35, 0.2)'
            }}>
              <UtensilsCrossed size={28} />
            </div>
            <h2 className="font-royal" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#123C32', letterSpacing: '0.02em' }}>
              {isForgotPassword
                ? 'Reset Password'
                : isLogin
                ? 'Welcome Back'
                : 'Create an Account'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#42151B', opacity: 0.85, marginTop: '0.4rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isForgotPassword
                ? 'Enter your email to receive recovery instructions'
                : isLogin
                ? 'Sign in to reserve your table and skip restaurant waiting queues'
                : 'Join Cut the Queue for Bengaluru hospitality pre-ordering'}
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fff1f2',
              color: '#be123c',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              border: '1px solid #fecdd3',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontWeight: 600 }}>{error}</div>
              {!isLogin && (errorCode === 'EMAIL_ALREADY_REGISTERED' || errorCode === 'ACCOUNT_EXISTS') && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setErrorCode('');
                    setIsLogin(true);
                  }}
                  style={{
                    background: '#0B352D',
                    color: '#F8F1DF',
                    border: '1.5px solid #C49A52',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    alignSelf: 'flex-start',
                    marginTop: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(11, 53, 45, 0.2)'
                  }}
                >
                  <span>Sign in instead &rarr;</span>
                </button>
              )}
              {isLogin && errorCode === 'ACCOUNT_NOT_FOUND' && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setErrorCode('');
                    setIsLogin(false);
                  }}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    alignSelf: 'flex-start',
                    marginTop: '4px'
                  }}
                >
                  Click here to Sign Up with this Email &rarr;
                </button>
              )}
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
                        onClick={() => { setIsForgotPassword(true); setError(''); setErrorCode(''); }}
                        style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      style={{ paddingRight: '42px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-forest"
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontWeight: 700 }}
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
                    style={{ color: '#123C32', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(''); setErrorCode(''); }}
                  >
                    Back to Sign In
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      style={{ color: '#641F27', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => { setIsLogin(!isLogin); setError(''); setErrorCode(''); }}
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
