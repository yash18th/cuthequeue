import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { showcaseAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';

// Safe initial fallback while live API responds
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
    cta_text: 'Pre-order Counter Pass',
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
    cta_text: 'Skip Empire Counter Queue',
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
    cta_text: 'Reserve Meghana Express Token',
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Swipe gesture tracking
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
      console.log('⚡ [Showcase] Received real-time showcase update event');
      fetchShowcases();
    };
    socket.on('showcase:updated', handleShowcaseUpdate);
    return () => {
      socket.off('showcase:updated', handleShowcaseUpdate);
    };
  }, [socket, fetchShowcases]);

  // Preload next image to prevent flicker
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

  // Auto-rotation timer (6 seconds)
  useEffect(() => {
    if (prefersReducedMotion || isPaused || showcases.length <= 1) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      goToNext();
    }, 6000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentIndex, isPaused, showcases.length, prefersReducedMotion]);

  const goToSlide = (index) => {
    if (index === currentIndex || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToNext = () => {
    if (isTransitioning || showcases.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % showcases.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToPrev = () => {
    if (isTransitioning || showcases.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + showcases.length) % showcases.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Touch Swipe Handlers
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

  // Dynamic queue text formatting
  const displayQueueText = current.live_queue_count !== undefined && current.live_queue_count !== null
    ? `${current.live_queue_count} orders ahead in kitchen • Prepared fresh upon arrival`
    : (current.queue_text || 'Active Kitchen Queue • Freshly Prepared');

  return (
    <div
      style={{ position: 'relative', userSelect: 'none' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="heritage-ornamental-frame">
        <div
          style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            height: '440px',
            background: '#0B352D'
          }}
        >
          {/* Animated / Crossfading Hero Images */}
          {showcases.map((item, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={item.id || idx}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  visibility: isActive ? 'visible' : 'hidden',
                  transition: prefersReducedMotion ? 'none' : 'opacity 0.6s ease-in-out',
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
                    transform: isActive ? 'scale(1)' : 'scale(1.04)',
                    transition: prefersReducedMotion ? 'none' : 'transform 6s ease-out'
                  }}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </div>
            );
          })}

          {/* Contrast Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(11, 53, 45, 0.25) 0%, rgba(11, 53, 45, 0.4) 40%, rgba(11, 53, 45, 0.92) 100%)',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          />

          {/* Top Row: Heritage Badge & Slide Indicators */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span
              style={{
                background: 'rgba(11, 53, 45, 0.92)',
                color: '#C49A52',
                padding: '6px 14px',
                borderRadius: '4px',
                border: '1px solid rgba(196, 154, 82, 0.5)',
                fontSize: '0.74rem',
                fontWeight: 700,
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                backdropFilter: 'blur(4px)'
              }}
            >
              {current.badge || '✦ BENGALURU DINING HERITAGE'}
            </span>

            {/* Manual Slide Navigation Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                aria-label="Previous Restaurant Promotion"
                style={{
                  background: 'rgba(11, 53, 45, 0.85)',
                  border: '1px solid rgba(196, 154, 82, 0.6)',
                  color: '#F7F0E2',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E2B873'; e.currentTarget.style.background = '#123F35'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(196, 154, 82, 0.6)'; e.currentTarget.style.background = 'rgba(11, 53, 45, 0.85)'; }}
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                aria-label="Next Restaurant Promotion"
                style={{
                  background: 'rgba(11, 53, 45, 0.85)',
                  border: '1px solid rgba(196, 154, 82, 0.6)',
                  color: '#F7F0E2',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E2B873'; e.currentTarget.style.background = '#123F35'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(196, 154, 82, 0.6)'; e.currentTarget.style.background = 'rgba(11, 53, 45, 0.85)'; }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Dynamic Live Queue & Editorial Showcase Card at Bottom */}
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
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.38)',
              zIndex: 3,
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onClick={handleNavigateToRestaurant}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {/* Upper Info: Restaurant, Branch, Preparation Time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="queue-pill queue-pill-low" style={{ background: '#EEF6F4', border: '1px solid #A8CFC4' }}>
                  <span className="dot live-indicator-pulse" style={{ background: '#123F35', width: '7px', height: '7px' }} />
                  ● LIVE QUEUE
                </span>
                <span style={{ fontSize: '0.8rem', color: '#665C54', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {current.restaurant_name} {current.branch_name ? `• ${current.branch_name}` : ''}
                </span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.66rem', color: '#A98242', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EST. PREPARATION
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#123F35' }}>
                  ~{current.prep_time_minutes || 12} MIN
                </span>
              </div>
            </div>

            {/* Lower Info: Featured Dish, Live Queue Status, CTA Pass */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#191714',
                    fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
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
                    fontSize: '0.78rem',
                    color: '#57534E',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={displayQueueText}
                >
                  {displayQueueText}
                </div>
              </div>

              {/* Action Button / Pass Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0
                }}
              >
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
                  {current.pass_code || 'PASS CQ102'}
                </div>

                <div
                  style={{
                    background: '#C49A52',
                    color: '#0B352D',
                    padding: '5px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Order</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </div>

          {/* Dots Pagination Indicators */}
          {showcases.length > 1 && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                right: '16px',
                display: 'flex',
                gap: '5px',
                zIndex: 3
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
                    height: '6px',
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
      </div>
    </div>
  );
}
