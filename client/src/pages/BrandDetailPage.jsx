import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../utils/api';
import BackButton from '../components/BackButton';
import PageNavHeader from '../components/PageNavHeader';
import {
  Star,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Award,
  Users,
  UtensilsCrossed,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function BrandDetailPage({ setActivePage, setSelectedRestaurantId }) {
  const { brandIdOrSlug, brandId } = useParams();
  const targetParam = brandIdOrSlug || brandId;
  const navigate = useNavigate();

  const [brandData, setBrandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchBranch, setSearchBranch] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');

  useEffect(() => {
    if (!targetParam) return;
    setLoading(true);
    setError(null);

    restaurantAPI.getBrand(targetParam)
      .then((data) => {
        setBrandData(data);
      })
      .catch((err) => {
        console.error('Failed to load brand:', err);
        setError(err.message || 'Unable to load restaurant brand');
      })
      .finally(() => setLoading(false));
  }, [targetParam]);

  if (loading) {
    return (
      <div style={{ padding: '3rem 0 6rem 0', minHeight: '60vh', background: 'var(--bg-heritage)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
            <div style={{ width: '120px', height: '36px', background: '#e7e5e4', borderRadius: '8px' }} />
          </div>
          <div style={{ height: '240px', background: '#e7e5e4', borderRadius: '16px', marginBottom: '2rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '180px', background: '#e7e5e4', borderRadius: '14px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !brandData || !brandData.brand) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', background: 'var(--bg-heritage)', minHeight: '60vh' }}>
        <div className="container" style={{ maxWidth: '500px' }}>
          <AlertCircle size={48} style={{ color: 'var(--accent-terracotta)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Restaurant Brand Not Found
          </h2>
          <p style={{ color: 'var(--text-heritage-secondary)', marginBottom: '1.5rem' }}>
            {error || 'We could not locate this restaurant brand in Bengaluru.'}
          </p>
          <BackButton label="Back to Restaurants" fallbackPath="/restaurants" />
        </div>
      </div>
    );
  }

  const { brand, branches = [] } = brandData;

  // Filter branches
  const filteredBranches = branches.filter((branch) => {
    const matchesSearch = searchBranch.trim() === '' ||
      branch.branch_name.toLowerCase().includes(searchBranch.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchBranch.toLowerCase()) ||
      (branch.area && branch.area.toLowerCase().includes(searchBranch.toLowerCase()));

    const matchesArea = selectedArea === 'All' || branch.area === selectedArea;

    return matchesSearch && matchesArea;
  });

  const allAreas = ['All', ...(brand.areas || [])];

  const handleSelectBranch = (branch) => {
    setSelectedRestaurantId?.(branch.id);
    setActivePage?.('restaurant-menu-view');
    navigate(`/restaurants/${brand.slug || brand.id}/branches/${branch.id}`);
  };

  // Helper for Queue Pill
  const renderQueueBadge = (status, count) => {
    const s = (status || 'moderate').toLowerCase();
    if (s === 'low') {
      return (
        <span className="queue-pill queue-pill-low">
          ● Low Queue ({count || 4} ahead)
        </span>
      );
    }
    if (s === 'busy') {
      return (
        <span className="queue-pill queue-pill-busy">
          ● Busy ({count || 12} ahead)
        </span>
      );
    }
    if (s === 'very_busy') {
      return (
        <span className="queue-pill queue-pill-very-busy">
          ● High Rush ({count || 18} ahead)
        </span>
      );
    }
    return (
      <span className="queue-pill queue-pill-moderate">
        ● Moderate ({count || 8} ahead)
      </span>
    );
  };

  return (
    <div className="bg-warm-canvas" style={{ minHeight: '85vh', padding: '2rem 0 6rem 0' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        {/* Navigation Breadcrumb & Back */}
        <PageNavHeader
          backLabel="Back to Restaurants"
          fallbackPath="/restaurants"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Restaurants', path: '/restaurants' },
            { label: brand.name }
          ]}
        />

        {/* Brand Banner with Heritage Styling */}
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0B2923 0%, #123C32 100%)',
          color: '#F7F1E5',
          marginBottom: '2.5rem',
          boxShadow: 'var(--shadow-heritage)',
          border: '1px solid #C6A15B'
        }}>
          {/* Subtle background image overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.22,
            backgroundImage: `url(${brand.cover_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(1px)'
          }} />

          <div style={{ position: 'relative', zIndex: 2, padding: '2.5rem 2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: '#F7F1E5',
                padding: '4px',
                border: '2px solid #C6A15B',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                <img
                  src={brand.logo || brand.cover_image}
                  alt={brand.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(198, 161, 91, 0.15)',
                    border: '1px solid #C6A15B',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#C6A15B',
                    fontFamily: 'var(--font-serif)'
                  }}>
                    <Award size={13} style={{ color: '#C6A15B' }} />
                    Bengaluru Landmark {brand.heritage_since ? `• Est. ${brand.heritage_since}` : ''}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#C6A15B'
                  }}>
                    <Star size={14} fill="#C6A15B" strokeWidth={0} />
                    {brand.rating ? Number(brand.rating).toFixed(1) : '4.8'}
                  </span>
                </div>

                <h1 style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  margin: '0.2rem 0 0.5rem 0',
                  color: '#F7F1E5',
                  fontFamily: 'var(--font-serif)'
                }}>
                  {brand.name}
                </h1>

                <p style={{
                  fontSize: '0.925rem',
                  color: '#C6A15B',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                  fontFamily: 'var(--font-serif)'
                }}>
                  {brand.cuisine}
                </p>

                <p style={{
                  fontSize: '0.95rem',
                  color: '#E8DDC8',
                  lineHeight: 1.6,
                  maxWidth: '750px',
                  margin: 0
                }}>
                  {brand.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Choose a Branch in Bengaluru */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-charcoal)', letterSpacing: '-0.01em', margin: 0, fontFamily: 'var(--font-serif)' }}>
                Choose a Bengaluru Branch
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Select your nearest location to view the menu, track real-time queue, and place your pre-order.
              </p>
            </div>

            {/* Search branch locality */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchBranch}
                onChange={(e) => setSearchBranch(e.target.value)}
                placeholder="Search area (e.g. Indiranagar)..."
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem 0.55rem 2.4rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E8DDC8',
                  background: 'white',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Area quick filter chips */}
          {allAreas.length > 2 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {allAreas.map((area) => {
                const isSelected = selectedArea === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedArea(area)}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.85rem',
                      background: isSelected ? 'var(--bg-deep-green)' : 'white',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-gold)' : '#E8DDC8',
                      color: isSelected ? '#F7F1E5' : 'var(--text-charcoal)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          )}

          {/* Branch Cards Grid */}
          {filteredBranches.length === 0 ? (
            <div style={{
              background: 'white',
              padding: '3rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              border: '1px solid #E8DDC8'
            }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                No branches match your search in "{searchBranch}".
              </p>
              <button
                type="button"
                onClick={() => { setSearchBranch(''); setSelectedArea('All'); }}
                className="btn btn-sm btn-forest"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredBranches.map((branch) => {
                const isOpen = branch.is_currently_open !== undefined
                  ? branch.is_currently_open
                  : !!branch.is_open;

                return (
                  <div
                    key={branch.id}
                    className="heritage-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      border: '1px solid #E8DDC8',
                      background: 'white',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onClick={() => handleSelectBranch(branch)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectBranch(branch);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>
                          {branch.area || 'Bengaluru'}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-charcoal)', margin: '2px 0 0 0', fontFamily: 'var(--font-serif)' }}>
                          {branch.branch_name}
                        </h3>
                      </div>
                      <span className={`badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
                        {isOpen ? '🟢 Open' : '🔴 Closed'}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '5px'
                    }}>
                      <MapPin size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0, marginTop: '2px' }} />
                      <span>{branch.address}</span>
                    </p>

                    {/* Queue & Prep Time Indicator Strip */}
                    <div style={{
                      marginTop: 'auto',
                      padding: '0.75rem',
                      background: '#F7F1E5',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #E8DDC8',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      <div>
                        {renderQueueBadge(branch.queue_status, branch.queue_count)}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-charcoal)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} style={{ color: 'var(--accent-gold)' }} />
                        Ready in ~{branch.prep_time_minutes || 15}m
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      className="btn btn-forest"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBranch(branch);
                      }}
                      style={{
                        width: '100%',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        padding: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>View Menu & Pre-Order</span>
                      <ChevronRight size={16} style={{ color: '#C6A15B' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
