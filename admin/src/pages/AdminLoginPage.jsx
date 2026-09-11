import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (presetEmail) => {
    setEmail(presetEmail);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(presetEmail, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const [selectedBrandTab, setSelectedBrandTab] = useState('rameshwaram');

  const BRANCH_PROFILES = {
    rameshwaram: {
      brandName: 'The Rameshwaram Cafe',
      shortLabel: 'Rameshwaram (4)',
      branches: [
        { branch: 'Indiranagar (Flagship)', email: 'campus@demo.com', manager: 'Rohan Sharma' },
        { branch: 'JP Nagar', email: 'rameshwaram.jpnagar@demo.com', manager: 'Suresh Hegde' },
        { branch: 'Whitefield', email: 'rameshwaram.whitefield@demo.com', manager: 'Karthik Bhat' },
        { branch: 'Rajajinagar', email: 'rameshwaram.rajajinagar@demo.com', manager: 'Naveen Kumar' }
      ]
    },
    empire: {
      brandName: 'Empire Restaurant',
      shortLabel: 'Empire (5)',
      branches: [
        { branch: 'Church Street (Central)', email: 'spice@demo.com', manager: 'Farhan Khan' },
        { branch: 'Koramangala', email: 'empire.koramangala@demo.com', manager: 'Tariq Ahmed' },
        { branch: 'Indiranagar', email: 'empire.indiranagar@demo.com', manager: 'Bilal Mansoor' },
        { branch: 'Jayanagar', email: 'empire.jayanagar@demo.com', manager: 'Sameer Pasha' },
        { branch: 'Kammanahalli', email: 'empire.kammanahalli@demo.com', manager: 'Rizwan Syed' }
      ]
    },
    meghana: {
      brandName: 'Meghana Foods',
      shortLabel: 'Meghana (5)',
      branches: [
        { branch: 'Koramangala (Flagship)', email: 'meghana@demo.com', manager: 'Arjun Rao' },
        { branch: 'Indiranagar', email: 'meghana.indiranagar@demo.com', manager: 'Venkatesh Reddy' },
        { branch: 'Jayanagar', email: 'meghana.jayanagar@demo.com', manager: 'Praveen Naidu' },
        { branch: 'Residency Road', email: 'meghana.residency@demo.com', manager: 'Sunil Verma' },
        { branch: 'Marathahalli', email: 'meghana.marathahalli@demo.com', manager: 'Kiran Goud' }
      ]
    },
    superadmin: {
      brandName: 'System Administration',
      shortLabel: 'Super Admin',
      branches: [
        { branch: 'All 14 Branches Super Admin', email: 'admin@cutthequeue.com', manager: 'System Administrator' }
      ]
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B352D 0%, #123F35 60%, #174D41 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #C49A52',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden'
      }}>
        {/* Card Header with Heritage Emblem */}
        <div style={{
          background: 'linear-gradient(180deg, #0B352D 0%, #123F35 100%)',
          padding: '2.5rem 2rem 2rem',
          textAlign: 'center',
          color: '#F8F1DF',
          position: 'relative'
        }}>
          <div className="temple-frieze" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
          
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
            border: '2px solid #C49A52',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C49A52',
            marginBottom: '1rem',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 20V9C4 5.5 7.5 3 12 3C16.5 3 20 5.5 20 9V20" stroke="#C49A52" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M8 20V12C8 9.8 9.8 8 12 8C14.2 8 16 9.8 16 12V20" stroke="#C49A52" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="12" cy="4.5" r="1.2" fill="#C49A52" />
            </svg>
          </div>

          <h1 className="font-royal" style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.04em', color: '#F8F1DF', lineHeight: 1.2 }}>
            CUT THE QUEUE
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#C49A52', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '4px' }}>
            Branch Operations Portal
          </p>
        </div>

        {/* Card Form */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              background: '#FFF1F2',
              color: '#BE123C',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              border: '1px solid #FECDD3',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Access Prohibited</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Branch Manager Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#5C6E6A' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@restaurant.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #E8E0D2',
                    fontSize: '0.92rem',
                    outline: 'none',
                    background: '#FCFAF6'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E2927', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#5C6E6A' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #E8E0D2',
                    fontSize: '0.92rem',
                    outline: 'none',
                    background: '#FCFAF6'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                justifyContent: 'center',
                marginTop: '8px'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Branch Kitchen'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick Restaurant Selection Switcher with All 14 Branches */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #E8E0D2' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#C49A52', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px', textAlign: 'center' }}>
              Select Branch for 1-Click Operations Demo
            </span>

            {/* Brand Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: '#F8F4EC', padding: '3px', borderRadius: '8px' }}>
              {Object.keys(BRANCH_PROFILES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedBrandTab(key)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: '0.72rem',
                    fontWeight: selectedBrandTab === key ? 800 : 600,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: selectedBrandTab === key ? '#0B352D' : 'transparent',
                    color: selectedBrandTab === key ? '#F8F1DF' : '#5C6E6A',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {BRANCH_PROFILES[key].shortLabel}
                </button>
              ))}
            </div>

            {/* Branch list for selected brand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
              {BRANCH_PROFILES[selectedBrandTab].branches.map((b) => (
                <button
                  key={b.email}
                  type="button"
                  onClick={() => handleQuickFill(b.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    background: '#FDFCFA',
                    border: '1px solid #E8E0D2',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#0B352D', display: 'block' }}>
                      {BRANCH_PROFILES[selectedBrandTab].brandName} — {b.branch}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#5C6E6A' }}>
                      {b.manager} • {b.email}
                    </span>
                  </div>
                  <ArrowRight size={14} style={{ color: '#C49A52', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
