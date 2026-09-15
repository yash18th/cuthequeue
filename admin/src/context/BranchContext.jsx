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
        // Branch Admin: Strictly lock to assigned branch
        const myBranch = branchList.find(b => Number(b.id) === Number(assignedBranchId));
        if (myBranch) {
          setSelectedBrandId(myBranch.brand_id);
          setSelectedBranchId(myBranch.id);
        } else if (authRestaurant) {
          setSelectedBrandId(authRestaurant.brand_id || null);
          setSelectedBranchId(authRestaurant.id);
        }
      } else if (isSuperAdmin && branchList.length > 0) {
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

  // Synchronously react to user / authRestaurant updates
  useEffect(() => {
    if (user?.role === 'restaurant_admin') {
      const restId = user.branch_id || authRestaurant?.id;
      const brandId = user.brand_id || user.restaurant_id || authRestaurant?.brand_id;
      if (restId) {
        setSelectedBranchId(Number(restId));
        localStorage.setItem('cq_admin_selected_branch', String(restId));
      }
      if (brandId) {
        setSelectedBrandId(Number(brandId));
      }
    } else if (isSuperAdmin && allBranches.length > 0) {
      const savedBranchId = localStorage.getItem('cq_admin_selected_branch');
      if (savedBranchId && !selectedBranchId) {
        const found = allBranches.find(b => String(b.id) === String(savedBranchId));
        if (found) {
          setSelectedBrandId(found.brand_id);
          setSelectedBranchId(found.id);
        }
      }
    }
  }, [user, authRestaurant, isSuperAdmin, allBranches, selectedBranchId]);

  // Available branches for current selected brand
  const availableBranches = useMemo(() => {
    if (!selectedBrandId) return allBranches;
    return allBranches.filter(b => Number(b.brand_id) === Number(selectedBrandId));
  }, [allBranches, selectedBrandId]);

  // Currently selected branch object (never falls back to random/Rameshwaram branch for logged-in branch manager)
  const selectedBranch = useMemo(() => {
    // 1. If assigned to a specific branch (branch admin), lock to that branch
    if (!isSuperAdmin && assignedBranchId) {
      const assigned = allBranches.find(b => Number(b.id) === Number(assignedBranchId));
      if (assigned) return assigned;
      if (authRestaurant && Number(authRestaurant.id) === Number(assignedBranchId)) {
        return authRestaurant;
      }
    }
    // 2. Look up by selectedBranchId
    if (selectedBranchId) {
      const found = allBranches.find(b => Number(b.id) === Number(selectedBranchId));
      if (found) return found;
    }
    // 3. Use authRestaurant if present
    if (authRestaurant) return authRestaurant;
    // 4. If super admin, pick first available
    if (isSuperAdmin && availableBranches.length > 0) {
      return availableBranches[0];
    }
    return null;
  }, [allBranches, selectedBranchId, isSuperAdmin, assignedBranchId, authRestaurant, availableBranches]);

  // Currently selected brand object
  const selectedBrand = useMemo(() => {
    if (selectedBrandId) {
      const found = brands.find(b => Number(b.id) === Number(selectedBrandId));
      if (found) return found;
    }
    if (selectedBranch?.brand_id) {
      const found = brands.find(b => Number(b.id) === Number(selectedBranch.brand_id));
      if (found) return found;
    }
    if (authRestaurant?.brand_id) {
      const found = brands.find(b => Number(b.id) === Number(authRestaurant.brand_id));
      if (found) return found;
    }
    return null;
  }, [brands, selectedBrandId, selectedBranch, authRestaurant]);

  // Synchronous assignment method (used immediately on login or branch selection)
  const setAssignedBranch = useCallback((branch, brand) => {
    if (!branch) return;
    const branchId = Number(branch.id || branch.branch_id);
    const brandId = Number(brand?.id || branch.brand_id);

    if (brandId) setSelectedBrandId(brandId);
    if (branchId) {
      setSelectedBranchId(branchId);
      localStorage.setItem('cq_admin_selected_branch', String(branchId));
    }
  }, []);

  // Action: Select Brand (Super Admin)
  const selectBrand = useCallback((brandId) => {
    const numId = Number(brandId);
    setSelectedBrandId(numId);

    // Find branches belonging to this brand
    const matchingBranches = allBranches.filter(b => Number(b.brand_id) === numId);
    if (matchingBranches.length > 0) {
      const myAssigned = matchingBranches.find(b => Number(b.id) === Number(assignedBranchId));
      const nextBranch = myAssigned || matchingBranches[0];
      setSelectedBranchId(nextBranch.id);
      if (isSuperAdmin) {
        localStorage.setItem('cq_admin_selected_branch', String(nextBranch.id));
      }
    }
  }, [allBranches, assignedBranchId, isSuperAdmin]);

  // Action: Select Branch (Super Admin)
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
    setAssignedBranch,
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
