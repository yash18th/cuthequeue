import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cq_token');
    if (token) {
      authAPI.me()
        .then((res) => {
          setUser(res.user);
          setRestaurant(res.restaurant);
        })
        .catch(() => {
          localStorage.removeItem('cq_token');
          setUser(null);
          setRestaurant(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('cq_token', res.token);
    setUser(res.user);
    setRestaurant(res.restaurant);
    return res;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    localStorage.setItem('cq_token', res.token);
    setUser(res.user);
    setRestaurant(res.restaurant);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('cq_token');
    setUser(null);
    setRestaurant(null);
  };

  const updateProfile = async (updatedData) => {
    const res = await authAPI.updateProfile(updatedData);
    setUser(res.user);
    return res;
  };

  const value = {
    user,
    restaurant,
    setRestaurant,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isCustomer: user?.role === 'customer',
    isRestaurantAdmin: user?.role === 'restaurant_admin',
    isSuperAdmin: user?.role === 'super_admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
