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

  // Auto-slideshow timer: automatically changes every 5 seconds
  useEffect(() => {
    if (prefersReducedMotion || isPaused || showcases.length <= 1) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcases.length);
    }, 5000);

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
              Occupies 65% of showcase height. The food is the HERO.
              ==================================================== */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '330px',
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
                    transform: isActive ? 'translateX(0)' : 'translateX(16px)',
                    visibility: isActive ? 'visible' : 'hidden',
                    transition: prefersReducedMotion
                      ? 'none'
                      : 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
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

            {/* Subtle Vignette Overlay for Depth (Does not obscure food) */}
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
            <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 3 }}>
              <span
                style={{
                  background: 'rgba(11, 53, 45, 0.92)',
                  color: '#C49A52',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  border: '1px solid rgba(196, 154, 82, 0.55)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  letterSpacing: '0.08em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
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
                  bottom: '12px',
                  right: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 3,
                  background: 'rgba(11, 53, 45, 0.7)',
                  padding: '4px 8px',
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
                      width: idx === currentIndex ? '20px' : '6px',
                      height: '5px',
                      borderRadius: '3px',
                      background: idx === currentIndex ? '#C49A52' : 'rgba(247, 240, 226, 0.4)',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.4s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ====================================================
              BOTTOM: DEDICATED RESTAURANT INFORMATION PANEL
              Clean stacked composition underneath the hero image.
              NO overlapping on the food photograph.
              ==================================================== */}
          <div
            style={{
              background: '#F7F0E2',
              borderTop: '2px solid #C49A52',
              padding: '1.25rem 1.4rem',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              position: 'relative',
              zIndex: 3
            }}
            onClick={handleNavigateToRestaurant}
          >
            {/* Top Row: Live Queue Indicator, Restaurant • Branch, Preparation Time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="queue-pill queue-pill-low"
                  style={{
                    background: '#EEF6F4',
                    border: '1px solid #A8CFC4',
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}
                >
                  <span className="dot live-indicator-pulse" style={{ background: '#123F35', width: '6px', height: '6px' }} />
                  ● LIVE QUEUE
                </span>
                <span style={{ fontSize: '0.8rem', color: '#665C54', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {current.restaurant_name} {current.branch_name ? `• ${current.branch_name}` : ''}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.64rem', color: '#A98242', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  EST. PREPARATION
                </div>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#123F35' }}>
                  ~{current.prep_time_minutes || 12} MIN
                </span>
              </div>
            </div>

            {/* Middle Row: Featured Dish & Queue Status */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#191714',
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={current.featured_dish || current.promo_title}
              >
                {current.featured_dish || current.promo_title}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#57534E',
                  marginTop: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={displayQueueText}
              >
                {displayQueueText}
              </div>
            </div>

            {/* Bottom Row: Pass Code & View Menu CTA Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #E9DDC7',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#0B352D',
                    border: '1px solid #C49A52',
                    color: '#C49A52',
                    padding: '3px 9px',
                    borderRadius: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}
                >
                  {current.pass_code || 'PASS CQ102'}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#8C827A', fontStyle: 'italic' }}>
                  Skip counter queue
                </span>
              </div>

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
