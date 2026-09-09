import React from 'react';
import { Check } from 'lucide-react';

/**
 * Visual Progress Indicator for the Royal Pre-Ordering Flow:
 * 1. Restaurant -> 2. Menu -> 3. Cart -> 4. Order Details -> 5. Payment -> 6. Order Confirmed
 */
export default function CheckoutProgress({ currentStep = 3 }) {
  const steps = [
    { number: 1, label: 'Restaurant' },
    { number: 2, label: 'Menu' },
    { number: 3, label: 'Cart' },
    { number: 4, label: 'Order Details' },
    { number: 5, label: 'Payment' },
    { number: 6, label: 'Confirmed' }
  ];

  return (
    <div
      style={{
        margin: '1.25rem 0 2rem 0',
        padding: '1rem 1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        overflowX: 'auto'
      }}
      aria-label="Order Progress"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '540px',
          position: 'relative'
        }}
      >
        {/* Subtle connecting line */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '20px',
            right: '20px',
            height: '2px',
            background: 'var(--border-subtle)',
            zIndex: 1
          }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div
              key={step.number}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2,
                gap: '6px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  background: isCompleted
                    ? 'var(--bg-deep-green)'
                    : isCurrent
                    ? 'var(--accent-gold)'
                    : 'var(--bg-card)',
                  color: isCompleted
                    ? '#F7F1E5'
                    : isCurrent
                    ? '#0B2923'
                    : 'var(--text-muted)',
                  border: isCompleted
                    ? '2px solid var(--bg-deep-green)'
                    : isCurrent
                    ? '2px solid var(--accent-gold-muted)'
                    : '2px solid var(--border-medium)',
                  boxShadow: isCurrent ? '0 0 0 3px rgba(198, 161, 91, 0.25)' : 'none'
                }}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : step.number}
              </div>

              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: isCurrent ? 800 : isCompleted ? 600 : 500,
                  color: isCurrent
                    ? 'var(--bg-deep-green)'
                    : isCompleted
                    ? 'var(--text-charcoal)'
                    : 'var(--text-muted)',
                  letterSpacing: isCurrent ? '0.02em' : 'normal',
                  fontFamily: isCurrent ? 'var(--font-serif)' : 'var(--font-sans)',
                  whiteSpace: 'nowrap'
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
