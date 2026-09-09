import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';

export default function ItemModal({ item, restaurant, isOpen, onClose, onAddToCart }) {
  if (!isOpen || !item) return null;

  const customizations = item.customizations || [];

  // Initialize selections with default values
  const [selections, setSelections] = useState(() => {
    const initial = {};
    for (const group of customizations) {
      if (group.type === 'single' && group.options.length > 0) {
        initial[group.name] = group.options[0].label;
      } else if (group.type === 'multiple') {
        initial[group.name] = [];
      }
    }
    return initial;
  });

  const [quantity, setQuantity] = useState(1);

  // Calculate dynamic unit price
  let currentUnitPrice = Number(item.price);
  for (const group of customizations) {
    const sel = selections[group.name];
    if (sel) {
      if (group.type === 'single') {
        const opt = group.options.find((o) => o.label === sel);
        if (opt) currentUnitPrice += Number(opt.price || 0);
      } else if (group.type === 'multiple' && Array.isArray(sel)) {
        for (const label of sel) {
          const opt = group.options.find((o) => o.label === label);
          if (opt) currentUnitPrice += Number(opt.price || 0);
        }
      }
    }
  }

  const handleSingleSelect = (groupName, label) => {
    setSelections((prev) => ({ ...prev, [groupName]: label }));
  };

  const handleMultiToggle = (groupName, label) => {
    setSelections((prev) => {
      const currentList = prev[groupName] || [];
      if (currentList.includes(label)) {
        return { ...prev, [groupName]: currentList.filter((l) => l !== label) };
      } else {
        return { ...prev, [groupName]: [...currentList, label] };
      }
    });
  };

  const handleAdd = () => {
    onAddToCart(item, restaurant, quantity, selections);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Item Image Header */}
        <div style={{ position: 'relative', height: '220px', width: '100%', background: '#f1f5f9' }}>
          <img
            src={item.image}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(15, 23, 42, 0.75)',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className={item.is_veg ? 'veg-indicator' : 'non-veg-indicator'}>
                  {item.is_veg ? <span className="veg-indicator-dot" /> : <span className="non-veg-indicator-triangle" />}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.name}
                </h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.description}
              </p>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              ₹{item.price}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '1.25rem 0' }} />

          {/* Customization Options */}
          {customizations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {customizations.map((group, gIdx) => (
                <div key={gIdx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {group.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: group.required ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {group.required ? 'Required • Choose 1' : 'Optional'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.options.map((opt, oIdx) => {
                      const isSelected = group.type === 'single'
                        ? selections[group.name] === opt.label
                        : (selections[group.name] || []).includes(opt.label);

                      return (
                        <div
                          key={oIdx}
                          onClick={() => {
                            if (group.type === 'single') handleSingleSelect(group.name, opt.label);
                            else handleMultiToggle(group.name, opt.label);
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                            background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: group.type === 'single' ? '50%' : '4px',
                              border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-medium)'}`,
                              background: isSelected ? 'var(--primary)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 500, color: 'var(--text-primary)' }}>
                              {opt.label}
                            </span>
                          </div>
                          {opt.price > 0 && (
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              +₹{opt.price}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Action Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            {/* Quantity Stepper */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1.5px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '2px'
            }}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span style={{ width: '32px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Add to Cart Button with dynamic computed price */}
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.75rem' }}
              onClick={handleAdd}
            >
              Add to Order • ₹{currentUnitPrice * quantity}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
