import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { showcaseAPI } from '../utils/api';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  Clock,
  Image as ImageIcon,
  Save,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Curated high-res culinary image presets for 1-click manager selection
const IMAGE_PRESETS = [
  {
    name: 'Ghee Podi Masala Dosa',
    url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200'
  },
  {
    name: 'Steaming Thatte Idli & Vada',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200'
  },
  {
    name: 'Empire Signature Chicken Kebab',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1200'
  },
  {
    name: 'Royal Fragrant Biryani Feast',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200'
  },
  {
    name: 'Traditional Brass Filter Coffee',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200'
  },
  {
    name: 'Banana Leaf Full Thali Feast',
    url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200'
  }
];

export default function AdminShowcasePage() {
  const { restaurant } = useAuth();
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Live preview selection
  const [previewIndex, setPreviewIndex] = useState(0);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    badge: '✦ BENGALURU DINING HERITAGE',
    promo_title: '',
    featured_dish: '',
    description: '',
    hero_image: IMAGE_PRESETS[0].url,
    pass_code: 'PASS CQ102',
    cta_text: 'Pre-order Counter Pass',
    prep_time_minutes: 12,
    queue_text: '',
    is_active: true,
    display_order: 1
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch admin-scoped showcases
  const fetchShowcases = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await showcaseAPI.getAdminShowcases();
      const items = res.showcases || [];
      setShowcases(items);
      if (items.length > 0 && previewIndex >= items.length) {
        setPreviewIndex(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load restaurant showcases');
    } finally {
      setLoading(false);
    }
  }, [previewIndex]);

  useEffect(() => {
    fetchShowcases();
  }, [fetchShowcases]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      badge: '✦ BENGALURU DINING HERITAGE',
      promo_title: '',
      featured_dish: '',
      description: '',
      hero_image: IMAGE_PRESETS[0].url,
      pass_code: `PASS CQ${Math.floor(100 + Math.random() * 900)}`,
      cta_text: 'Pre-order Counter Pass',
      prep_time_minutes: 12,
      queue_text: '',
      is_active: true,
      display_order: (showcases.length + 1)
    });
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      badge: item.badge || '✦ BENGALURU DINING HERITAGE',
      promo_title: item.promo_title || '',
      featured_dish: item.featured_dish || '',
      description: item.description || '',
      hero_image: item.hero_image || IMAGE_PRESETS[0].url,
      pass_code: item.pass_code || 'PASS CQ102',
      cta_text: item.cta_text || 'Pre-order Counter Pass',
      prep_time_minutes: item.prep_time_minutes || 12,
      queue_text: item.queue_text || '',
      is_active: item.is_active === 1 || item.is_active === true,
      display_order: item.display_order || 1
    });
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.promo_title.trim() || !formData.featured_dish.trim()) {
      setError('Promotional title and featured dish are required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await showcaseAPI.updateShowcase(editingId, formData);
        setSuccess('Showcase promotion updated and published to customer app!');
      } else {
        await showcaseAPI.createShowcase(formData);
        setSuccess('New showcase promotion published successfully!');
      }
      setIsModalOpen(false);
      await fetchShowcases();
    } catch (err) {
      setError(err.message || 'Failed to save showcase');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggle = async (id) => {
    try {
      await showcaseAPI.toggleShowcase(id);
      await fetchShowcases();
      setSuccess('Showcase visibility updated');
    } catch (err) {
      setError(err.message || 'Failed to toggle status');
    }
  };

  // Delete showcase
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the promotion "${title}"?`)) return;
    try {
      await showcaseAPI.deleteShowcase(id);
      await fetchShowcases();
      setSuccess('Showcase deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete showcase');
    }
  };

  // Reorder up/down
  const handleReorder = async (item, direction) => {
    const newOrder = direction === 'up' ? Math.max(1, item.display_order - 1) : item.display_order + 1;
    try {
      await showcaseAPI.updateShowcase(item.id, { display_order: newOrder });
      await fetchShowcases();
    } catch (err) {
      setError(err.message || 'Failed to reorder showcase');
    }
  };

  const previewItem = showcases[previewIndex] || showcases[0] || null;

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
                border: '1px solid #C49A52',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C49A52'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-royal" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#191714', margin: 0 }}>
                Showcase & Promotions
              </h1>
              <p style={{ color: '#665C54', fontSize: '0.88rem', margin: '3px 0 0 0' }}>
                Manage the live customer hero carousel promotions for <strong>{restaurant?.name || 'Your Restaurant'}</strong>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
            color: '#F8F1DF',
            border: '1.5px solid #C49A52',
            borderRadius: '6px',
            padding: '10px 18px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(11, 53, 45, 0.2)'
          }}
        >
          <Plus size={16} />
          <span>Add New Showcase</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid #22c55e',
          color: '#15803d',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          color: '#b91c1c',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Left Column Live Customer Preview, Right Column Promotion Manager */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        {/* Live Customer Preview Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1.5px solid #E9DDC7',
            padding: '1.5rem',
            boxShadow: '0 8px 24px rgba(25, 23, 20, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} style={{ color: '#C49A52' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#191714', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Live Customer Preview
              </h2>
            </div>
            {showcases.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewIndex((prev) => (prev - 1 + showcases.length) % showcases.length)}
                  style={{
                    background: '#F7F0E2',
                    border: '1px solid #C49A52',
                    borderRadius: '4px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#0B352D'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.78rem', color: '#665C54', fontWeight: 600 }}>
                  {previewIndex + 1} / {showcases.length}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewIndex((prev) => (prev + 1) % showcases.length)}
                  style={{
                    background: '#F7F0E2',
                    border: '1px solid #C49A52',
                    borderRadius: '4px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#0B352D'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <p style={{ color: '#786F66', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
            Exact representation of how customers see this promotion on the homepage hero carousel.
          </p>

          {previewItem ? (
            <div className="heritage-ornamental-frame" style={{ maxWidth: '480px', margin: '0 auto', padding: 0, borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#0B352D',
                  boxShadow: '0 12px 28px rgba(11, 53, 45, 0.2)'
                }}
              >
                {/* Hero Food Photography (Unobstructed) */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '240px',
                    overflow: 'hidden',
                    background: '#0B352D'
                  }}
                >
                  <img
                    src={previewItem.hero_image}
                    alt={previewItem.featured_dish}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Dark Vignette Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(11, 53, 45, 0.25) 0%, rgba(11, 53, 45, 0.04) 50%, rgba(11, 53, 45, 0.3) 100%)'
                    }}
                  />

                  {/* Refined Heritage Badge */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                    <span
                      style={{
                        background: 'rgba(11, 53, 45, 0.92)',
                        color: '#C49A52',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid rgba(196, 154, 82, 0.55)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    >
                      {previewItem.badge || '✦ BENGALURU DINING HERITAGE'}
                    </span>
                  </div>
                </div>

                {/* Dedicated Information Panel Underneath */}
                <div
                  style={{
                    background: '#F7F0E2',
                    borderTop: '2px solid #C49A52',
                    padding: '1.1rem 1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="queue-pill queue-pill-low" style={{ background: '#EEF6F4', border: '1px solid #A8CFC4', fontSize: '0.68rem', padding: '2px 6px' }}>
                        <span className="dot live-indicator-pulse" style={{ background: '#123F35', width: '6px', height: '6px' }} />
                        ● LIVE QUEUE
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#665C54', fontWeight: 700 }}>
                        {restaurant?.name || previewItem.restaurant_name}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.62rem', color: '#A98242', fontWeight: 700 }}>
                        EST. PREPARATION
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#123F35' }}>
                        ~{previewItem.prep_time_minutes || 12} MIN
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#191714', fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {previewItem.featured_dish}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#57534E', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {previewItem.queue_text || `${previewItem.live_queue_count || 8} orders ahead in kitchen • Prepared fresh`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E9DDC7' }}>
                    <div
                      style={{
                        background: '#0B352D',
                        border: '1px solid #C49A52',
                        color: '#C49A52',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      {previewItem.pass_code || 'PASS CQ102'}
                    </div>

                    <div
                      style={{
                        background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
                        border: '1px solid #C49A52',
                        color: '#F8F1DF',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}
                    >
                      VIEW MENU
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#F7F0E2', borderRadius: '8px', border: '1px dashed #C49A52' }}>
              <Sparkles size={32} style={{ color: '#C49A52', marginBottom: '8px' }} />
              <p style={{ fontWeight: 600, color: '#191714', margin: 0 }}>No showcase items configured yet.</p>
              <p style={{ fontSize: '0.8rem', color: '#665C54', marginTop: '4px' }}>Click "Add New Showcase" above to create your first promotion.</p>
            </div>
          )}
        </div>

        {/* Info & Overview Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1.5px solid #E9DDC7',
            padding: '1.5rem',
            boxShadow: '0 8px 24px rgba(25, 23, 20, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#191714', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Showcase Guidelines
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem', color: '#57534E' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ color: '#C49A52', fontWeight: 700, fontSize: '1.1rem' }}>✦</div>
                <div>
                  <strong style={{ color: '#191714' }}>Controlled Carousel:</strong> Customers see active promotions rotate every 6 seconds on the main homepage.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ color: '#C49A52', fontWeight: 700, fontSize: '1.1rem' }}>✦</div>
                <div>
                  <strong style={{ color: '#191714' }}>Live Queue Integration:</strong> If your restaurant has active pending/preparing orders, the customer card automatically reflects the real orders ahead in kitchen.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ color: '#C49A52', fontWeight: 700, fontSize: '1.1rem' }}>✦</div>
                <div>
                  <strong style={{ color: '#191714' }}>Direct Ordering:</strong> When customers tap the showcase card or pass button, they are taken directly to your branch menu.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ color: '#C49A52', fontWeight: 700, fontSize: '1.1rem' }}>✦</div>
                <div>
                  <strong style={{ color: '#191714' }}>Strict Data Isolation:</strong> You can only edit promotions for <strong>{restaurant?.name}</strong>. Cross-restaurant alterations are rejected at the database level.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#F7F0E2', borderRadius: '8px', border: '1px solid #C49A52' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B352D' }}>
                Active Promotions Count
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#C49A52' }}>
                {showcases.filter((s) => s.is_active === 1 || s.is_active === true).length} / {showcases.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Showcase Items List */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#191714', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>
          Promotional Items ({showcases.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#665C54' }}>
            Loading showcase items...
          </div>
        ) : showcases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#FFFFFF', borderRadius: '8px', border: '1px dashed #C49A52' }}>
            <p style={{ color: '#665C54' }}>No showcase items found for your restaurant.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {showcases.map((item, index) => {
              const isActive = item.is_active === 1 || item.is_active === true;
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1.5px solid #E9DDC7',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    boxShadow: '0 4px 14px rgba(25, 23, 20, 0.04)',
                    opacity: isActive ? 1 : 0.75
                  }}
                >
                  {/* Left: Thumbnail & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1 1 340px' }}>
                    <div
                      style={{
                        width: '100px',
                        height: '75px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid #C49A52',
                        background: '#0B352D'
                      }}
                    >
                      <img
                        src={item.hero_image}
                        alt={item.featured_dish}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          style={{
                            background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                            color: isActive ? '#15803d' : '#4b5563',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {isActive ? '● ACTIVE' : '○ INACTIVE'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#A98242', fontWeight: 700 }}>
                          {item.badge}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#191714', margin: 0 }}>
                        {item.featured_dish}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#665C54', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.promo_title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#8C827A', marginTop: '4px' }}>
                        <span>⏱ ~{item.prep_time_minutes} min prep</span>
                        <span>🏷 {item.pass_code}</span>
                        <span>Order: #{item.display_order}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Reorder & Action Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Reorder Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleReorder(item, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        style={{
                          background: '#F7F0E2',
                          border: '1px solid #E9DDC7',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.3 : 1
                        }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorder(item, 'down')}
                        disabled={index === showcases.length - 1}
                        title="Move Down"
                        style={{
                          background: '#F7F0E2',
                          border: '1px solid #E9DDC7',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          cursor: index === showcases.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === showcases.length - 1 ? 0.3 : 1
                        }}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    {/* Toggle Active */}
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      title={isActive ? 'Deactivate Showcase' : 'Activate Showcase'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: isActive ? '#15803d' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      style={{
                        background: '#F7F0E2',
                        border: '1px solid #C49A52',
                        color: '#0B352D',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.featured_dish)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid #ef4444',
                        color: '#dc2626',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 53, 45, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '2px solid #C49A52',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 className="font-royal" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#191714', margin: 0 }}>
                {editingId ? 'Edit Showcase Promotion' : 'Add New Showcase Promotion'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#665C54' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Promotional Badge */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191714', marginBottom: '6px' }}>
                  Promotional Badge
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. ✦ BENGALURU DINING HERITAGE"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D6C8B4',
                    fontSize: '0.88rem',
                    background: '#FDFBF7'
                  }}
                />
              </div>

              {/* Promotional Headline Title */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191714', marginBottom: '6px' }}>
                  Promotional Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.promo_title}
                  onChange={(e) => setFormData({ ...formData, promo_title: e.target.value })}
                  placeholder="e.g. Legendary Pure Dairy Ghee Podi Delicacies"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D6C8B4',
                    fontSize: '0.88rem',
                    background: '#FDFBF7'
                  }}
                />
              </div>

              {/* Featured Dish Name */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191714', marginBottom: '6px' }}>
                  Featured Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.featured_dish}
                  onChange={(e) => setFormData({ ...formData, featured_dish: e.target.value })}
                  placeholder="e.g. Ghee Podi Masala Dosa + Degree Filter Coffee"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D6C8B4',
                    fontSize: '0.88rem',
                    background: '#FDFBF7'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191714', marginBottom: '6px' }}>
                  Editorial Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief enticing description for the customer showcase..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D6C8B4',
                    fontSize: '0.88rem',
                    background: '#FDFBF7',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Showcase Image & 1-Click Presets */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191714', marginBottom: '6px' }}>
                  Hero Image URL
                </label>
                <input
                  type="url"
                  required
                  value={formData.hero_image}
                  onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D6C8B4',
                    fontSize: '0.88rem',
                    background: '#FDFBF7',
                    marginBottom: '8px'
                  }}
                />

                {/* 1-Click Preset Selector */}
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#665C54', fontWeight: 600 }}>
                    Or select a curated culinary photo preset:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0' }}>
                    {IMAGE_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setFormData({ ...formData, hero_image: preset.url })}
                        style={{
                          flexShrink: 0,
                          width: '72px',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          style={{
                            width: '72px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: formData.hero_image === preset.url ? '2px solid #C49A52' : '1px solid #D6C8B4'
                          }}
                        />
                        <span style={{ fontSize: '0.62rem', color: '#665C54', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {preset.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prep Minutes, Pass Code, CTA Text */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191714', marginBottom: '6px' }}>
                    Est. Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.prep_time_minutes}
                    onChange={(e) => setFormData({ ...formData, prep_time_minutes: parseInt(e.target.value, 10) || 12 })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D6C8B4',
                      fontSize: '0.88rem',
                      background: '#FDFBF7'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191714', marginBottom: '6px' }}>
                    Pass Badge Code
                  </label>
                  <input
                    type="text"
                    value={formData.pass_code}
                    onChange={(e) => setFormData({ ...formData, pass_code: e.target.value })}
                    placeholder="PASS CQ102"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D6C8B4',
                      fontSize: '0.88rem',
                      background: '#FDFBF7'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191714', marginBottom: '6px' }}>
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Pre-order Counter Pass"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D6C8B4',
                      fontSize: '0.88rem',
                      background: '#FDFBF7'
                    }}
                  />
                </div>
              </div>

              {/* Status & Display Order */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F7F0E2', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, color: '#191714' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Publish to Customer Homepage (Active)</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#665C54', fontWeight: 600 }}>Display Order:</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })}
                    style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6C8B4', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#F7F0E2',
                    border: '1px solid #D6C8B4',
                    color: '#665C54',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
                    border: '1.5px solid #C49A52',
                    color: '#F8F1DF',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : (editingId ? 'Update & Publish' : 'Publish Showcase')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
