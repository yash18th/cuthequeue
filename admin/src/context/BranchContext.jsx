import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { restaurantAPI } from '../utils/api';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { user, restaurant: authRestaurant } = useAuth();
  const [brands, setBrands] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const assignedBranchId = user?.branch_id || user?.restaurant_id || authRestaurant?.id;

  // Load all brands and branches from database
  const loadMetadata = useCallback(async () => {
    try {
      setLoading(true);
      const [brandsRes, branchesRes] = await Promise.all([
        restaurantAPI.getBrands().catch(() => ({ brands: [] })),
        restaurantAPI.getBranches().catch(() => ({ branches: [] }))
      ]);

      const brandList = brandsRes.brands || [];
      const branchList = branchesRes.branches || [];

      setBrands(brandList);
      setAllBranches(branchList);

      // Determine initial selection
      if (!isSuperAdmin && assignedBranchId) {
        // Branch Admin: Lock to assigned branch
        const myBranch = branchList.find(b => Number(b.id) === Number(assignedBranchId));
        if (myBranch) {
          setSelectedBrandId(myBranch.brand_id);
          setSelectedBranchId(myBranch.id);
        } else if (authRestaurant) {
          setSelectedBrandId(authRestaurant.brand_id || 1);
          setSelectedBranchId(authRestaurant.id);
        }
      } else if (branchList.length > 0) {
        // Super Admin: Restore saved branch or default to first
        const savedBranchId = localStorage.getItem('cq_admin_selected_branch');
        const existing = branchList.find(b => String(b.id) === String(savedBranchId));
        if (existing) {
          setSelectedBrandId(existing.brand_id);
          setSelectedBranchId(existing.id);
        } else {
          const first = branchList[0];
          setSelectedBrandId(first.brand_id);
          setSelectedBranchId(first.id);
        }
      }
    } catch (err) {
      console.error('Failed to load restaurant brands and branches:', err);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, assignedBranchId, authRestaurant]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Available branches for current selected brand
  const availableBranches = useMemo(() => {
    if (!selectedBrandId) return allBranches;
    return allBranches.filter(b => Number(b.brand_id) === Number(selectedBrandId));
  }, [allBranches, selectedBrandId]);

  // Currently selected objects
  const selectedBrand = useMemo(() => {
    return brands.find(b => Number(b.id) === Number(selectedBrandId)) || null;
  }, [brands, selectedBrandId]);

  const selectedBranch = useMemo(() => {
    const found = allBranches.find(b => Number(b.id) === Number(selectedBranchId));
    if (found) return found;
    if (!isSuperAdmin && authRestaurant) return authRestaurant;
    return availableBranches[0] || null;
  }, [allBranches, selectedBranchId, isSuperAdmin, authRestaurant, availableBranches]);

  // Action: Select Brand
  const selectBrand = useCallback((brandId) => {
    const numId = Number(brandId);
    setSelectedBrandId(numId);

    // Find branches belonging to this brand
    const matchingBranches = allBranches.filter(b => Number(b.brand_id) === numId);
    if (matchingBranches.length > 0) {
      // If user has an assigned branch under this brand, keep it; otherwise pick first
      const myAssigned = matchingBranches.find(b => Number(b.id) === Number(assignedBranchId));
      const nextBranch = myAssigned || matchingBranches[0];
      setSelectedBranchId(nextBranch.id);
      if (isSuperAdmin) {
        localStorage.setItem('cq_admin_selected_branch', String(nextBranch.id));
      }
    }
  }, [allBranches, assignedBranchId, isSuperAdmin]);

  // Action: Select Branch
  const selectBranch = useCallback((branchId) => {
    const numId = Number(branchId);
    const targetBranch = allBranches.find(b => Number(b.id) === numId);
    if (targetBranch) {
      setSelectedBrandId(targetBranch.brand_id);
      setSelectedBranchId(targetBranch.id);
      if (isSuperAdmin) {
        localStorage.setItem('cq_admin_selected_branch', String(targetBranch.id));
      }
    }
  }, [allBranches, isSuperAdmin]);

  const value = {
    brands,
    allBranches,
    availableBranches,
    selectedBrandId,
    selectedBranchId,
    selectedBrand,
    selectedBranch,
    loading,
    selectBrand,
    selectBranch,
    isSuperAdmin,
    canSwitchBranch: isSuperAdmin,
    assignedBranchId,
    refreshMetadata: loadMetadata
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
