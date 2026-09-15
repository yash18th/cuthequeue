import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2, Store, MapPin, UserCheck, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { setAssignedBranch } = useBranch();
  const navigate = useNavigate();

  const [selectedBrandKey, setSelectedBrandKey] = useState('empire');
  const [selectedBranch, setSelectedBranch] = useState({
    id: 24,
    branch: 'Church Street (Central)',
    slug: 'empire-church-street',
    email: 'spice@demo.com',
    manager: 'Farhan Khan'
  });

  const [email, setEmail] = useState('spice@demo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BRAND_PROFILES = {
    rameshwaram: {
      brandId: 1,
      brandName: 'The Rameshwaram Cafe',
      shortLabel: 'Rameshwaram',
      tagline: 'Pure South Indian Heritage • Filter Coffee & Ghee Podi Idli',
      branches: [
        { id: 20, branch: 'Indiranagar (Flagship)', slug: 'rameshwaram-indiranagar', email: 'campus@demo.com', manager: 'Rohan Sharma' },
        { id: 21, branch: 'JP Nagar', slug: 'rameshwaram-jpnagar', email: 'rameshwaram.jpnagar@demo.com', manager: 'Suresh Hegde' },
        { id: 22, branch: 'Whitefield', slug: 'rameshwaram-whitefield', email: 'rameshwaram.whitefield@demo.com', manager: 'Karthik Bhat' },
        { id: 23, branch: 'Rajajinagar', slug: 'rameshwaram-rajajinagar', email: 'rameshwaram.rajajinagar@demo.com', manager: 'Naveen Kumar' }
      ]
    },
    empire: {
      brandId: 2,
      brandName: 'Empire Restaurant',
      shortLabel: 'Empire',
      tagline: 'Bengaluru Nightlife Icon • Biryani, Ghee Rice & Kebabs',
      branches: [
        { id: 24, branch: 'Church Street (Central)', slug: 'empire-church-street', email: 'spice@demo.com', manager: 'Farhan Khan' },
        { id: 25, branch: 'Koramangala', slug: 'empire-koramangala', email: 'empire.koramangala@demo.com', manager: 'Tariq Ahmed' },
        { id: 26, branch: 'Indiranagar', slug: 'empire-indiranagar', email: 'empire.indiranagar@demo.com', manager: 'Bilal Mansoor' },
        { id: 27, branch: 'Jayanagar', slug: 'empire-jayanagar', email: 'empire.jayanagar@demo.com', manager: 'Sameer Pasha' },
        { id: 28, branch: 'Kammanahalli', slug: 'empire-kammanahalli', email: 'empire.kammanahalli@demo.com', manager: 'Rizwan Syed' }
      ]
    },
    meghana: {
      brandId: 3,
      brandName: 'Meghana Foods',
      shortLabel: 'Meghana',
      tagline: 'Legendary Andhra Spicy Biryani & Boneless Chicken Specialties',
      branches: [
        { id: 29, branch: 'Koramangala (Flagship)', slug: 'meghana-koramangala', email: 'meghana@demo.com', manager: 'Arjun Rao' },
        { id: 30, branch: 'Indiranagar', slug: 'meghana-indiranagar', email: 'meghana.indiranagar@demo.com', manager: 'Venkatesh Reddy' },
        { id: 31, branch: 'Jayanagar', slug: 'meghana-jayanagar', email: 'meghana.jayanagar@demo.com', manager: 'Praveen Naidu' },
        { id: 32, branch: 'Residency Road', slug: 'meghana-residency-road', email: 'meghana.residency@demo.com', manager: 'Sunil Verma' },
        { id: 33, branch: 'Marathahalli', slug: 'meghana-marathahalli', email: 'meghana.marathahalli@demo.com', manager: 'Kiran Goud' }
      ]
    },
    superadmin: {
      brandId: null,
      brandName: 'CutTheQueue Platform Administration',
      shortLabel: 'Super Admin',
      tagline: 'Unified Multi-Brand Oversight • All 14 Branches',
      branches: [
        { id: null, branch: 'All 14 Branches Super Admin', slug: 'super-admin', email: 'admin@cutthequeue.com', manager: 'System Administrator' }
      ]
    }
  };

  const handleBrandSelect = (brandKey) => {
    setSelectedBrandKey(brandKey);
    const profile = BRAND_PROFILES[brandKey];
    const defaultBranch = profile.branches[0];
    setSelectedBranch(defaultBranch);
    setEmail(defaultBranch.email);
    setPassword(brandKey === 'superadmin' ? 'admin123' : 'password123');
    setError('');
  };

  const handleBranchSelect = (branchObj) => {
    setSelectedBranch(branchObj);
    setEmail(branchObj.email);
    setPassword(selectedBrandKey === 'superadmin' ? 'admin123' : 'password123');
    setError('');
  };

  const handleDirectBranchLogin = async (branchObj, e) => {
    if (e) e.stopPropagation();
    handleBranchSelect(branchObj);
    executeLogin(branchObj.email, selectedBrandKey === 'superadmin' ? 'admin123' : 'password123', branchObj);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    executeLogin(email, password, selectedBranch);
  };

  const executeLogin = async (loginEmail, loginPassword, targetBranch) => {
    setError('');
    setLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      const currentBrand = BRAND_PROFILES[selectedBrandKey];

      // Synchronously configure branch and brand in BranchContext before route navigation
      if (res?.restaurant) {
        setAssignedBranch(res.restaurant, res.brand || { id: currentBrand?.brandId, name: currentBrand?.brandName });
      } else if (targetBranch && targetBranch.id) {
        setAssignedBranch(
          { id: targetBranch.id, branch_name: targetBranch.branch, slug: targetBranch.slug, brand_id: currentBrand?.brandId },
          { id: currentBrand?.brandId, name: currentBrand?.brandName }
        );
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('[Admin Login Error]', err);
      setError(err.message || 'Login failed. Please verify branch manager credentials.');
    } finally {
      setLoading(false);
    }
  };

  const currentBrand = BRAND_PROFILES[selectedBrandKey];

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
        maxWidth: '560px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #C49A52',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden'
      }}>
        {/* Header with Temple Arch */}
        <div style={{
          background: 'linear-gradient(180deg, #0B352D 0%, #123F35 100%)',
          padding: '2rem 2rem 1.5rem',
          textAlign: 'center',
          color: '#F8F1DF',
          position: 'relative'
        }}>
          <div className="temple-frieze" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
          
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
            border: '2px solid #C49A52',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C49A52',
            marginBottom: '0.75rem',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)'
          }}>
            <Store size={26} strokeWidth={1.8} />
          </div>

          <h1 className="font-royal" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.04em', color: '#F8F1DF', lineHeight: 1.2 }}>
            CUT THE QUEUE
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#C49A52', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '4px' }}>
            Restaurant Branch Operations Portal
          </p>
        </div>

        {/* Content Container */}
        <div style={{ padding: '1.75rem 2rem' }}>
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
                <strong style={{ display: 'block', marginBottom: '2px' }}>Authentication Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Select Restaurant Brand */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0B352D', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#C49A52', color: '#0B352D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 900 }}>1</span>
                Select Restaurant Brand
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {Object.keys(BRAND_PROFILES).map((key) => {
                const b = BRAND_PROFILES[key];
                const isActive = selectedBrandKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleBrandSelect(key)}
                    style={{
                      padding: '8px 4px',
                      fontSize: '0.74rem',
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #C49A52' : '1px solid #E8E0D2',
                      cursor: 'pointer',
                      background: isActive ? '#0B352D' : '#FCFAF6',
                      color: isActive ? '#F8F1DF' : '#3D4D49',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    {b.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Select Branch */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0B352D', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#C49A52', color: '#0B352D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 900 }}>2</span>
                Select Operational Branch ({currentBrand.brandName})
              </label>
              <span style={{ fontSize: '0.7rem', color: '#7E6E5A' }}>
                {currentBrand.branches.length} {currentBrand.branches.length === 1 ? 'Role' : 'Locations'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '175px', overflowY: 'auto', paddingRight: '2px' }}>
              {currentBrand.branches.map((br) => {
                const isBranchActive = selectedBranch?.email === br.email;
                return (
                  <div
                    key={br.email}
                    onClick={() => handleBranchSelect(br)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: isBranchActive ? '#F8F4EC' : '#FCFAF6',
                      border: isBranchActive ? '1.5px solid #C49A52' : '1px solid #E8E0D2',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={15} style={{ color: isBranchActive ? '#C49A52' : '#7E6E5A', flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#0B352D', display: 'block' }}>
                          {br.branch}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#5C6E6A' }}>
                          {br.manager} • {br.email}
                        </span>
                      </div>
                    </div>
                    {isBranchActive ? (
                      <CheckCircle2 size={16} style={{ color: '#C49A52', flexShrink: 0 }} />
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleDirectBranchLogin(br, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#C49A52',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        Select <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Sign In Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F0EAE1', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0B352D', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#C49A52', color: '#0B352D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 900 }}>3</span>
                Authenticate Branch Manager
              </label>
              {selectedBranch && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0B352D', background: '#F8F4EC', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E8E0D2' }}>
                  {selectedBranch.branch}
                </span>
              )}
            </div>

            <div>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#5C6E6A' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@restaurant.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #E8E0D2',
                    fontSize: '0.88rem',
                    outline: 'none',
                    background: '#FCFAF6'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#5C6E6A' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #E8E0D2',
                    fontSize: '0.88rem',
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
                padding: '11px',
                fontSize: '0.95rem',
                justifyContent: 'center',
                marginTop: '4px'
              }}
            >
              {loading ? (
                'Connecting to Branch...'
              ) : (
                <>
                  <span>Sign In as {selectedBranch?.branch || currentBrand.brandName} Manager</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
