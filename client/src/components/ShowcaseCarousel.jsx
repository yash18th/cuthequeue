import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { showcaseAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';

// Safe initial fallbacks
const DEFAULT_FALLBACKS = [
  {
    id: 1,
    restaurant_id: 20,
    restaurant_name: 'The Rameshwaram Cafe',
    branch_name: 'Indiranagar',
    badge: '✦ BENGALURU DINING HERITAGE',
    promo_title: 'Legendary Pure Dairy Ghee Podi Delicacies',
    featured_dish: 'Ghee Podi Masala Dosa + Degree Filter Coffee',
    description: 'Golden crisp fermented rice crepe bathed in pure clarified butter, smeared with fiery gun-powder chutney and served with traditional brassware decoction coffee.',
    hero_image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200',
    pass_code: 'PASS CQ102',
    cta_text: 'VIEW MENU',
    prep_time_minutes: 12,
    queue_text: '8 orders ahead in kitchen • Prepared fresh as you travel',
    live_queue_count: 8
  },
  {
    id: 3,
    restaurant_id: 21,
    restaurant_name: 'Empire Restaurant',
    branch_name: 'Church Street',
    badge: '✦ LATE-NIGHT ICON SINCE 1966',
    promo_title: 'Bengaluru Midnight Ghee Rice & Empire Kebabs',
    featured_dish: 'Empire Special Chicken Kebab + Ghee Rice',
    description: 'Iconic spicy shallow-fried crispy chicken tossed in curry leaves paired with fragrant steamed basmati glistening with pure ghee and rich dalcha gravy.',
    hero_image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1200',
    pass_code: 'PASS CQ204',
    cta_text: 'VIEW MENU',
    prep_time_minutes: 15,
    queue_text: '5 orders ahead in kitchen • Sizzling hot upon arrival',
    live_queue_count: 5
  },
  {
    id: 5,
    restaurant_id: 24,
    restaurant_name: 'Meghana Foods',
    branch_name: 'Koramangala 5th Block',
    badge: '✦ ANDHRA SPICE BENCHMARK',
    promo_title: 'Authentic Fiery Coastal Andhra Biryani',
    featured_dish: 'Special Boneless Chicken Biryani + Mirchi Salan',
    description: 'Aromatic aged long-grain basmati seasoned with signature Andhra spices, layered with tender chili-marinated spiced chicken bites and slow dum sealed.',
    hero_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200',
    pass_code: 'PASS CQ308',
    cta_text: 'VIEW MENU',
    prep_time_minutes: 18,
    queue_text: '11 orders ahead in kitchen • Freshly packed for quick takeaway',
    live_queue_count: 11
  }
];

export default function ShowcaseCarousel({ setActivePage }) {
  const navigate = useNavigate();
  const socketContext = useSocket();
  const socket = socketContext?.socket;

  const [showcases, setShowcases] = useState(DEFAULT_FALLBACKS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Swipe gesture tracking for mobile
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const autoPlayRef = useRef(null);

  // Fetch active showcases from backend
  const fetchShowcases = useCallback(async () => {
    try {
      const res = await showcaseAPI.getActive();
      if (res && Array.isArray(res.showcases) && res.showcases.length > 0) {
        setShowcases(res.showcases);
      }
    } catch (err) {
      console.warn('Could not load live showcases, using graceful defaults:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchShowcases();
  }, [fetchShowcases]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handleShowcaseUpdate = () => {
      fetchShowcases();
    };
    socket.on('showcase:updated', handleShowcaseUpdate);
    return () => {
      socket.off('showcase:updated', handleShowcaseUpdate);
    };
  }, [socket, fetchShowcases]);

  // Preload next image to eliminate flicker
  useEffect(() => {
    if (!showcases || showcases.length <= 1) return;
    const nextIdx = (currentIndex + 1) % showcases.length;
    const nextItem = showcases[nextIdx];
    if (nextItem?.hero_image) {
      const img = new Image();
      img.src = nextItem.hero_image;
    }
  }, [currentIndex, showcases]);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-slideshow timer: fast, snappy rotation (2.8 seconds)
  useEffect(() => {
    if (prefersReducedMotion || isPaused || showcases.length <= 1) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcases.length);
    }, 2800);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentIndex, isPaused, showcases.length, prefersReducedMotion]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % showcases.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + showcases.length) % showcases.length);
  };

  // Touch Swipe Handlers (auto-slideshow resumes on touch release)
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;
    if (diff > minSwipeDistance) {
      goToNext();
    } else if (diff < -minSwipeDistance) {
      goToPrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = showcases[currentIndex] || showcases[0] || DEFAULT_FALLBACKS[0];

  const handleNavigateToRestaurant = (e) => {
    e?.stopPropagation?.();
    if (current.restaurant_id) {
      setActivePage?.('restaurants');
      navigate(`/restaurant/${current.restaurant_id}`);
    } else {
      setActivePage?.('restaurants');
      navigate('/restaurants');
    }
  };

  // Live queue count text
  const displayQueueText = current.live_queue_count !== undefined && current.live_queue_count !== null
    ? `${current.live_queue_count} orders ahead in kitchen • Prepared fresh as you travel`
    : (current.queue_text || 'Active Kitchen Queue • Prepared Fresh');

  return (
    <div
      style={{ position: 'relative', userSelect: 'none', width: '100%' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="heritage-ornamental-frame" style={{ padding: '0', borderRadius: '10px', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#0B352D',
            boxShadow: '0 16px 36px rgba(11, 53, 45, 0.25)'
          }}
        >
          {/* ====================================================
              TOP: HERO FOOD PHOTOGRAPHY (UNOBSTRUCTED)
              Responsive height ensures the entire card fits cleanly.
              ==================================================== */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(230px, 34vw, 310px)',
              overflow: 'hidden',
              background: '#0B352D'
            }}
          >
            {showcases.map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={item.id || idx}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateX(0)' : 'translateX(12px)',
                    visibility: isActive ? 'visible' : 'hidden',
                    transition: prefersReducedMotion
                      ? 'none'
                      : 'opacity 0.45s ease-in-out, transform 0.45s ease-in-out',
                    zIndex: isActive ? 1 : 0
                  }}
                >
                  <img
                    src={item.hero_image}
                    alt={`${item.restaurant_name || 'Restaurant'} - ${item.featured_dish || 'Dish'}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 40%',
                      transform: isActive ? 'scale(1)' : 'scale(1.03)',
                      transition: prefersReducedMotion ? 'none' : 'transform 5s ease-out'
                    }}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200';
                    }}
                  />
                </div>
              );
            })}

            {/* Subtle Vignette Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(11, 53, 45, 0.28) 0%, rgba(11, 53, 45, 0.04) 45%, rgba(11, 53, 45, 0.35) 100%)',
                zIndex: 2,
                pointerEvents: 'none'
              }}
            />

            {/* Refined Heritage Badge in Upper-Left */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 3 }}>
              <span
                style={{
                  background: 'rgba(11, 53, 45, 0.92)',
                  color: '#C49A52',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid rgba(196, 154, 82, 0.55)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  letterSpacing: '0.08em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {current.badge || '✦ BENGALURU DINING HERITAGE'}
              </span>
            </div>

            {/* Subtle Progress Dots in Bottom-Right of Image */}
            {showcases.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  zIndex: 3,
                  background: 'rgba(11, 53, 45, 0.75)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(196, 154, 82, 0.3)'
                }}
              >
                {showcases.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                    aria-label={`Go to slide ${idx + 1}`}
                    style={{
                      width: idx === currentIndex ? '18px' : '5px',
                      height: '5px',
                      borderRadius: '3px',
                      background: idx === currentIndex ? '#C49A52' : 'rgba(247, 240, 226, 0.4)',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ====================================================
              BOTTOM: DEDICATED RESTAURANT & FOOD DETAILS PANEL
              Fully visible, beautiful hierarchy, zero truncation.
              ==================================================== */}
          <div
            style={{
              background: '#F7F0E2',
              borderTop: '2px solid #C49A52',
              padding: '1.15rem 1.4rem',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 3,
              transition: 'background 0.2s ease'
            }}
            onClick={handleNavigateToRestaurant}
          >
            {/* Restaurant Brand Eyebrow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#A98242',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                {current.restaurant_name}
              </span>
              {current.prep_time_minutes && (
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#123F35' }}>
                  ~{current.prep_time_minutes} MINS
                </span>
              )}
            </div>

            {/* Food Dish Name - Fully Visible, Wraps Gracefully (Never Truncated) */}
            <div
              style={{
                fontSize: 'clamp(1.15rem, 2.2vw, 1.35rem)',
                fontWeight: 800,
                color: '#191714',
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                lineHeight: 1.28,
                marginBottom: current.description ? '5px' : '10px',
                whiteSpace: 'normal',
                wordBreak: 'break-word'
              }}
            >
              {current.featured_dish || current.promo_title}
            </div>

            {/* Editorial Description / Flavor Notes */}
            {current.description && (
              <div
                style={{
                  fontSize: '0.82rem',
                  color: '#57534E',
                  lineHeight: 1.45,
                  marginBottom: '10px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}
              >
                {current.description}
              </div>
            )}

            {/* Bottom Action Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #E9DDC7',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '0.74rem', color: '#8C827A', fontStyle: 'italic' }}>
                Prepared fresh for your pickup
              </span>

              <button
                type="button"
                onClick={handleNavigateToRestaurant}
                style={{
                  background: 'linear-gradient(135deg, #123F35 0%, #0B352D 100%)',
                  border: '1.5px solid #C49A52',
                  color: '#F8F1DF',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(11, 53, 45, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#E2B873';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#C49A52';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>VIEW MENU</span>
                <ArrowRight size={14} style={{ color: '#C49A52' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
