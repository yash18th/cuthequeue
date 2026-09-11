import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, restaurantAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('cq_admin_token');
    if (!token) {
      setUser(null);
      setRestaurant(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.me();
      if (!res.user) {
        throw new Error('User profile not found');
      }

      // Strictly verify restaurant manager or super admin role
      if (res.user.role !== 'restaurant_admin' && res.user.role !== 'super_admin') {
        throw new Error('Access denied: Restaurant manager or owner credentials required.');
      }

      setUser(res.user);

      setUser(res.user);

      // If user has a linked branch/restaurant
      const restId = res.user.branch_id || res.restaurant?.id || res.user.restaurant_id;
      if (res.restaurant) {
        setRestaurant(res.restaurant);
      }
      if (restId) {
        try {
          const restData = await restaurantAPI.getById(restId);
          setRestaurant(restData.restaurant || restData);
        } catch (e) {
          console.warn('Failed to load full restaurant details:', e);
          if (res.restaurant) setRestaurant(res.restaurant);
        }
      }
    } catch (err) {
      console.error('Admin auth verification error:', err);
      localStorage.removeItem('cq_admin_token');
      setUser(null);
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (!res.token || !res.user) {
      throw new Error('Invalid login response from server');
    }

    // Role verification
    if (res.user.role !== 'restaurant_admin' && res.user.role !== 'super_admin') {
      throw new Error('Access denied: Restaurant manager or owner credentials required.');
    }

    localStorage.setItem('cq_admin_token', res.token);
    setUser(res.user);

    if (res.restaurant) {
      setRestaurant(res.restaurant);
    }

    const restId = res.user.branch_id || res.restaurant?.id || res.user.restaurant_id;
    if (restId) {
      try {
        const restData = await restaurantAPI.getById(restId);
        setRestaurant(restData.restaurant || restData);
      } catch (e) {
        if (res.restaurant) setRestaurant(res.restaurant);
      }
    }

    return res;
  };

  const logout = () => {
    localStorage.removeItem('cq_admin_token');
    setUser(null);
    setRestaurant(null);
  };

  const refreshRestaurant = async () => {
    if (!restaurant?.id) return;
    try {
      const restData = await restaurantAPI.getById(restaurant.id);
      setRestaurant(restData.restaurant || restData);
    } catch (e) {
      console.error('Failed to refresh restaurant:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurant,
        loading,
        login,
        logout,
        refreshRestaurant,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
