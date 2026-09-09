import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cq_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to parse cq_cart from localStorage:', err);
      return [];
    }
  });

  const [restaurant, setRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem('cq_cart_restaurant');
      if (!saved) return null;
      return JSON.parse(saved);
    } catch (err) {
      console.warn('Failed to parse cq_cart_restaurant from localStorage:', err);
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cq_cart', JSON.stringify(cartItems));
      localStorage.setItem('cq_cart_restaurant', JSON.stringify(restaurant));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cartItems, restaurant]);

  // Add item with customizations
  const addItem = (item, restInfo, quantity = 1, selectedCustomizations = {}) => {
    if (!item) return false;

    const itemId = item.id || item.menu_item_id;
    if (!itemId) {
      console.error('Cannot add item without id:', item);
      return false;
    }

    const rest = restInfo || restaurant;

    // If cart has items from a different restaurant, confirm with user
    if (restaurant && rest && restaurant.id && rest.id && restaurant.id !== rest.id && cartItems.length > 0) {
      const confirmReset = window.confirm(
        `Your cart contains items from "${restaurant.name || 'another restaurant'}". Would you like to clear your existing cart and start an order with "${rest.name || 'this restaurant'}"?`
      );
      if (!confirmReset) return false;
      setCartItems([]);
    }

    if (rest) {
      setRestaurant(rest);
    }

    // Calculate effective unit price with customizations safely
    let unitPrice = Number(String(item.price || 0).replace(/[^0-9.]/g, '')) || 0;
    
    // Safely extract customizations
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

    const safeSelections = selectedCustomizations && typeof selectedCustomizations === 'object' ? selectedCustomizations : {};

    for (const group of itemCustomizations) {
      if (!group || !group.name || !Array.isArray(group.options)) continue;
      const selected = safeSelections[group.name];
      if (selected) {
        if (group.type === 'single') {
          const opt = group.options.find((o) => o && o.label === selected);
          if (opt) unitPrice += Number(opt.price || 0);
        } else if (group.type === 'multiple' && Array.isArray(selected)) {
          for (const label of selected) {
            const opt = group.options.find((o) => o && o.label === label);
            if (opt) unitPrice += Number(opt.price || 0);
          }
        }
      }
    }

    // Generate unique key based on item id and selected customizations
    const customizationKey = JSON.stringify(safeSelections);
    const cartItemId = `${itemId}_${customizationKey}`;
    const addQty = Math.max(1, Number(quantity) || 1);

    setCartItems((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const existingIndex = safePrev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const copy = [...safePrev];
        const newQty = copy[existingIndex].quantity + addQty;
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: newQty,
          totalPrice: newQty * copy[existingIndex].unitPrice
        };
        return copy;
      } else {
        return [
          ...safePrev,
          {
            cartItemId,
            id: itemId,
            menu_item_id: itemId,
            name: item.name || 'Food Item',
            image: item.image || '',
            is_veg: item.is_veg !== undefined ? Boolean(item.is_veg) : true,
            unitPrice,
            quantity: addQty,
            customizations: safeSelections,
            totalPrice: unitPrice * addQty,
            restaurant_id: rest?.id || restaurant?.id
          }
        ];
      }
    });

    return true;
  };

  const updateQuantity = (cartItemId, newQty) => {
    const qty = Number(newQty) || 0;
    if (qty <= 0) {
      removeItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: qty,
            totalPrice: item.unitPrice * qty
          };
        }
        return item;
      })
    );
  };

  const removeItem = (cartItemId) => {
    setCartItems((prev) => {
      const updated = (Array.isArray(prev) ? prev : []).filter((i) => i.cartItemId !== cartItemId);
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
    return (cartItems || [])
      .filter((i) => i.menu_item_id === menuItemId || i.id === menuItemId)
      .reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  };

  // Calculations with safe fallbacks
  const subtotal = (cartItems || []).reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const taxRate = restaurant?.tax_rate || 0.05;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const convenienceFee = (cartItems || []).length > 0 ? 10 : 0;
  const discount = 0;
  const total = Math.round((subtotal + tax + convenienceFee - discount) * 100) / 100;
  const totalItemCount = (cartItems || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

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
    cartTotal: total, // Exported alias to ensure RestaurantPage and other pages never encounter undefined
    totalItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
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

