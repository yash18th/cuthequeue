import React, { createContext, useContext, useState, useEffect } from 'react';
import { AlertCircle, Trash2, ArrowRight, X } from 'lucide-react';

const CartContext = createContext(null);

// Safely sanitize and validate cart items from localStorage or updates
function sanitizeCartItems(items) {
  if (!Array.isArray(items)) return [];
  const valid = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const rawId = item.id || item.menu_item_id;
    if (!rawId) continue;

    const unitPrice = Number.isFinite(Number(item.unitPrice))
      ? Number(item.unitPrice)
      : (Number.isFinite(Number(item.price)) ? Number(item.price) : 0);

    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const totalPrice = Number.isFinite(Number(item.totalPrice))
      ? Number(item.totalPrice)
      : unitPrice * quantity;

    const customizations = item.customizations && typeof item.customizations === 'object' && !Array.isArray(item.customizations)
      ? item.customizations
      : {};

    const cartItemId = item.cartItemId || `${rawId}_${JSON.stringify(customizations)}`;

    valid.push({
      cartItemId,
      id: rawId,
      menu_item_id: rawId,
      name: String(item.name || 'Food Item'),
      image: String(item.image || ''),
      is_veg: item.is_veg !== undefined ? Boolean(item.is_veg) : true,
      unitPrice: Math.max(0, unitPrice),
      quantity,
      customizations,
      totalPrice: Math.max(0, totalPrice),
      restaurant_id: item.restaurant_id || null
    });
  }
  return valid;
}

// Safely sanitize and validate restaurant object from localStorage or updates
function sanitizeRestaurant(rest) {
  if (!rest || typeof rest !== 'object' || Array.isArray(rest)) return null;
  if (!rest.id && !rest.name) return null;
  return {
    ...rest,
    id: rest.id,
    branch_id: rest.branch_id || rest.id,
    branch_name: rest.branch_name || rest.area || '',
    area: rest.area || '',
    address: rest.address || '',
    brand_name: rest.brand_name || (rest.name ? rest.name.split(' - ')[0] : 'Restaurant'),
    name: rest.name || 'Restaurant Kitchen',
    tax_rate: Number.isFinite(Number(rest.tax_rate)) ? Number(rest.tax_rate) : 0.05,
    prep_time_minutes: Number(rest.prep_time_minutes) || 15
  };
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cq_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return sanitizeCartItems(parsed);
    } catch (err) {
      console.warn('Failed to parse cq_cart from localStorage:', err);
      return [];
    }
  });

  const [restaurant, setRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem('cq_cart_restaurant');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return sanitizeRestaurant(parsed);
    } catch (err) {
      console.warn('Failed to parse cq_cart_restaurant from localStorage:', err);
      return null;
    }
  });

  // State to hold a conflict when adding an item from a different restaurant
  const [conflictData, setConflictData] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('cq_cart', JSON.stringify(cartItems));
      if (restaurant) {
        localStorage.setItem('cq_cart_restaurant', JSON.stringify(restaurant));
      } else {
        localStorage.removeItem('cq_cart_restaurant');
      }
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cartItems, restaurant]);

  // Internal helper to perform the actual addition to cartItems
  const executeAddItem = (item, rest, quantity = 1, selectedCustomizations = {}) => {
    if (!item) return false;
    const itemId = item.id || item.menu_item_id;
    if (!itemId) return false;

    // Calculate effective unit price with customizations safely
    let unitPrice = Number(String(item.price || 0).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(unitPrice)) unitPrice = 0;

    let itemCustomizations = [];
    try {
      if (Array.isArray(item.customizations)) {
        itemCustomizations = item.customizations;
      } else if (typeof item.customizations_json === 'string' && item.customizations_json.trim()) {
        const parsed = JSON.parse(item.customizations_json);
        if (Array.isArray(parsed)) itemCustomizations = parsed;
      } else if (Array.isArray(item.customizations_json)) {
        itemCustomizations = item.customizations_json;
      }
    } catch {
      itemCustomizations = [];
    }

    const safeSelections = selectedCustomizations && typeof selectedCustomizations === 'object' && !Array.isArray(selectedCustomizations)
      ? selectedCustomizations
      : {};

    for (const group of itemCustomizations) {
      if (!group || !group.name || !Array.isArray(group.options)) continue;
      const selected = safeSelections[group.name];
      if (selected) {
        if (group.type === 'single') {
          const opt = group.options.find((o) => o && o.label === selected);
          if (opt) unitPrice += (Number(opt.price) || 0);
        } else if (group.type === 'multiple' && Array.isArray(selected)) {
          for (const label of selected) {
            const opt = group.options.find((o) => o && o.label === label);
            if (opt) unitPrice += (Number(opt.price) || 0);
          }
        }
      }
    }

    const customizationKey = JSON.stringify(safeSelections);
    const cartItemId = `${itemId}_${customizationKey}`;
    const addQty = Math.max(1, Math.floor(Number(quantity) || 1));

    if (rest) {
      setRestaurant(sanitizeRestaurant(rest));
    }

    setCartItems((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const existingIndex = safePrev.findIndex((i) => i && i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const copy = [...safePrev];
        const existing = copy[existingIndex];
        const effectiveUnit = Number.isFinite(Number(existing.unitPrice)) ? Number(existing.unitPrice) : unitPrice;
        const newQty = (Number(existing.quantity) || 0) + addQty;
        copy[existingIndex] = {
          ...existing,
          quantity: newQty,
          unitPrice: effectiveUnit,
          totalPrice: newQty * effectiveUnit
        };
        return copy;
      } else {
        return [
          ...safePrev,
          {
            cartItemId,
            id: itemId,
            menu_item_id: itemId,
            name: String(item.name || 'Food Item'),
            image: String(item.image || ''),
            is_veg: item.is_veg !== undefined ? Boolean(item.is_veg) : true,
            unitPrice,
            quantity: addQty,
            customizations: safeSelections,
            totalPrice: unitPrice * addQty,
            restaurant_id: rest?.id || restaurant?.id || item.restaurant_id || null
          }
        ];
      }
    });

    return true;
  };

  // Add item with conflict check
  const addItem = (item, restInfo, quantity = 1, selectedCustomizations = {}) => {
    if (!item) return false;

    const itemId = item.id || item.menu_item_id;
    if (!itemId) {
      console.error('Cannot add item without id:', item);
      return false;
    }

    const rest = sanitizeRestaurant(restInfo || restaurant);

    // If cart has items from a DIFFERENT restaurant, prompt user with confirmation
    if (
      restaurant &&
      rest &&
      restaurant.id &&
      rest.id &&
      String(restaurant.id) !== String(rest.id) &&
      cartItems.length > 0
    ) {
      // Trigger conflict modal
      setConflictData({
        incomingItem: item,
        incomingRestaurant: rest,
        quantity,
        selectedCustomizations,
        existingRestaurant: restaurant
      });
      return false;
    }

    return executeAddItem(item, rest, quantity, selectedCustomizations);
  };

  // Resolve conflict: Clear & Add
  const handleClearAndAdd = () => {
    if (!conflictData) return;
    const { incomingItem, incomingRestaurant, quantity, selectedCustomizations } = conflictData;
    setCartItems([]);
    setRestaurant(incomingRestaurant);
    executeAddItem(incomingItem, incomingRestaurant, quantity, selectedCustomizations);
    setConflictData(null);
  };

  // Resolve conflict: Cancel
  const handleCancelConflict = () => {
    setConflictData(null);
  };

  const updateQuantity = (cartItemId, newQty) => {
    const qty = Math.floor(Number(newQty) || 0);
    if (qty <= 0) {
      removeItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      (Array.isArray(prev) ? prev : [])
        .filter(Boolean)
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const unit = Number(item.unitPrice) || 0;
            return {
              ...item,
              quantity: qty,
              totalPrice: unit * qty
            };
          }
          return item;
        })
    );
  };

  const removeItem = (cartItemId) => {
    setCartItems((prev) => {
      const updated = (Array.isArray(prev) ? prev : [])
        .filter(Boolean)
        .filter((i) => i.cartItemId !== cartItemId);
      if (updated.length === 0) {
        setRestaurant(null);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurant(null);
  };

  // Helper to get total quantity of a specific menu item in cart
  const getItemQuantity = (menuItemId) => {
    if (!menuItemId) return 0;
    const targetStr = String(menuItemId);
    return (cartItems || [])
      .filter(Boolean)
      .filter((i) => String(i.menu_item_id) === targetStr || String(i.id) === targetStr)
      .reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  };

  // Calculations with safe fallbacks
  const subtotal = (cartItems || [])
    .filter(Boolean)
    .reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);

  const taxRate = Number(restaurant?.tax_rate) || 0.05;
  const rawTax = subtotal * taxRate;
  const tax = Number.isFinite(rawTax) ? Math.round(rawTax * 100) / 100 : 0;
  const convenienceFee = (cartItems || []).length > 0 ? 10 : 0;
  const discount = 0;
  const rawTotal = subtotal + tax + convenienceFee - discount;
  const total = Number.isFinite(rawTotal) ? Math.round(rawTotal * 100) / 100 : 0;

  const totalItemCount = (cartItems || [])
    .filter(Boolean)
    .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const value = {
    cartItems,
    restaurant,
    cartRestaurant: restaurant,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
    subtotal,
    tax,
    convenienceFee,
    discount,
    total,
    cartTotal: total,
    totalItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}

      {/* Royal South Indian Restaurant Conflict Modal */}
      {conflictData && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 53, 45, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem'
          }}
          onClick={handleCancelConflict}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px solid #C49A52',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#FDF6E2',
                  border: '1px solid #C49A52',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C49A52',
                  flexShrink: 0
                }}
              >
                <AlertCircle size={22} />
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#0B352D',
                  fontFamily: 'var(--font-serif)',
                  margin: 0
                }}
              >
                Start a New Tray?
              </h3>
            </div>

            <p style={{ color: '#4A5568', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              Your cart contains items from{' '}
              <strong style={{ color: '#0B352D' }}>
                {conflictData.existingRestaurant?.name || 'another restaurant'}
              </strong>
              . Clear the existing cart and add this item from{' '}
              <strong style={{ color: '#0B352D' }}>
                {conflictData.incomingRestaurant?.name || 'this restaurant'}
              </strong>
              ?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelConflict}
                className="btn btn-secondary"
                style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: '1px solid #E8DDC8',
                  background: '#F7F1E5',
                  color: '#4A5568',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAndAdd}
                className="btn btn-gold"
                style={{
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Clear & Add</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cartItems: [],
      restaurant: null,
      cartRestaurant: null,
      addItem: () => false,
      updateQuantity: () => {},
      removeItem: () => {},
      clearCart: () => {},
      getItemQuantity: () => 0,
      subtotal: 0,
      tax: 0,
      convenienceFee: 0,
      discount: 0,
      total: 0,
      cartTotal: 0,
      totalItemCount: 0
    };
  }
  return context;
}
