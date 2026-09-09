import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cq_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [restaurant, setRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem('cq_cart_restaurant');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('cq_cart', JSON.stringify(cartItems));
    localStorage.setItem('cq_cart_restaurant', JSON.stringify(restaurant));
  }, [cartItems, restaurant]);

  // Add item with customizations
  const addItem = (item, restInfo, quantity = 1, selectedCustomizations = {}) => {
    // If cart has items from a different restaurant, check
    if (restaurant && restaurant.id !== restInfo.id && cartItems.length > 0) {
      const confirmReset = window.confirm(
        `Your cart contains items from "${restaurant.name}". Would you like to clear your cart and start an order with "${restInfo.name}"?`
      );
      if (!confirmReset) return false;
      setCartItems([]);
    }

    setRestaurant(restInfo);

    // Calculate effective unit price with customizations
    let unitPrice = Number(item.price);
    const itemCustomizations = item.customizations || [];

    for (const group of itemCustomizations) {
      const selected = selectedCustomizations[group.name];
      if (selected) {
        if (group.type === 'single') {
          const opt = group.options.find((o) => o.label === selected);
          if (opt) unitPrice += Number(opt.price || 0);
        } else if (group.type === 'multiple' && Array.isArray(selected)) {
          for (const label of selected) {
            const opt = group.options.find((o) => o.label === label);
            if (opt) unitPrice += Number(opt.price || 0);
          }
        }
      }
    }

    // Generate unique key based on item id and selected customizations
    const customizationKey = JSON.stringify(selectedCustomizations);
    const cartItemId = `${item.id}_${customizationKey}`;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        copy[existingIndex].totalPrice = copy[existingIndex].quantity * copy[existingIndex].unitPrice;
        return copy;
      } else {
        return [
          ...prev,
          {
            cartItemId,
            menu_item_id: item.id,
            name: item.name,
            image: item.image,
            is_veg: item.is_veg,
            unitPrice,
            quantity,
            customizations: selectedCustomizations,
            totalPrice: unitPrice * quantity
          }
        ];
      }
    });

    return true;
  };

  const updateQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQty,
            totalPrice: item.unitPrice * newQty
          };
        }
        return item;
      })
    );
  };

  const removeItem = (cartItemId) => {
    setCartItems((prev) => {
      const updated = prev.filter((i) => i.cartItemId !== cartItemId);
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

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = restaurant?.tax_rate || 0.05;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const convenienceFee = cartItems.length > 0 ? 10 : 0;
  const discount = 0;
  const total = Math.round((subtotal + tax + convenienceFee - discount) * 100) / 100;
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cartItems,
    restaurant,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    convenienceFee,
    discount,
    total,
    totalItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
