import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { restaurantAPI } from '../utils/api';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
  Sparkles,
  Store,
  MapPin
} from 'lucide-react';

const COMMON_CATEGORIES = [
  'Mains',
  'Tiffin',
  'Biryanis',
  'Starters',
  'Beverages',
  'Desserts',
  'Snacks',
  'Thalis & Combos'
];

export default function AdminMenuPage() {
  const { restaurant } = useAuth();
  const { selectedBrand, selectedBranch } = useBranch();
  const activeRestaurantId = selectedBranch?.id || restaurant?.id;
  const activeRestaurantName = selectedBranch?.branch_name 
    ? `${selectedBrand?.name || restaurant?.name} - ${selectedBranch.branch_name} Branch`
    : (selectedBrand?.name || restaurant?.name || 'Restaurant');

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Mains',
    price: '',
    description: '',
    prep_time_minutes: 15,
    is_veg: true,
    is_available: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = useCallback(async () => {
    if (!activeRestaurantId) return;
    setLoading(true);
    setError('');
    try {
      const res = await restaurantAPI.getMenu(activeRestaurantId);
      const items = res.menu_items || res.items || (Array.isArray(res) ? res : []);
      setMenuItems(items);
    } catch (err) {
      console.error('Fetch menu error:', err);
      setError(err.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, [activeRestaurantId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Mains',
      price: '',
      description: '',
      prep_time_minutes: 15,
      is_veg: true,
      is_available: true
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || item.item_name || '',
      category: item.category || item.category_name || 'Mains',
      price: item.price !== undefined ? item.price : '',
      description: item.description || '',
      prep_time_minutes: item.prep_time_minutes || 15,
      is_veg: item.is_veg !== false && item.is_veg !== 0,
      is_available: item.is_available !== false && item.is_available !== 0
    });
    setIsModalOpen(true);
  };

  // Toggle availability (In Stock <-> Sold Out)
  const handleToggleAvailability = async (item) => {
    const targetAvail = item.is_available === false || item.is_available === 0 ? true : false;
    
    // Optimistic UI update
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: targetAvail } : i))
    );

    try {
      const res = await restaurantAPI.toggleMenuItem(item.id, targetAvail);
      const serverAvail = res.is_available !== undefined ? Boolean(res.is_available) : targetAvail;
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: serverAvail } : i))
      );
    } catch (err) {
      // Revert optimistic update on failure
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: item.is_available } : i))
      );
      alert(`Failed to update item availability: ${err.message}`);
    }
  };

  // Save Add/Edit
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!activeRestaurantId) {
      alert('Please select a restaurant branch first.');
      return;
    }

    if (!formData.name || !formData.name.trim()) {
      alert('Dish Name is required.');
      return;
    }

    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      alert('Please enter a valid price (₹).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category ? formData.category.trim() : 'Mains',
        category_name: formData.category ? formData.category.trim() : 'Mains',
        price: Number(formData.price),
        description: formData.description ? formData.description.trim() : '',
        prep_time_minutes: Number(formData.prep_time_minutes) || 15,
        is_veg: Boolean(formData.is_veg),
        is_available: formData.is_available !== false
      };

      if (editingItem) {
        const res = await restaurantAPI.updateMenuItem(activeRestaurantId, editingItem.id, payload);
        const updated = res.item || res.menu_item || { ...editingItem, ...payload };
        setMenuItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i))
        );
      } else {
        const res = await restaurantAPI.addMenuItem(activeRestaurantId, payload);
        const created = res.item || res.menu_item || { ...payload, id: Date.now() };
        setMenuItems((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save menu item error:', err);
      alert(`Failed to save menu item: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this dish from the menu?')) return;
    try {
      await restaurantAPI.deleteMenuItem(activeRestaurantId, itemId);
      setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      alert(`Failed to delete menu item: ${err.message}`);
    }
  };

  // Categories list
  const existingCategories = Array.from(new Set(menuItems.map((i) => i.category || i.category_name || 'Mains'))).filter(Boolean);
  const filterCategories = ['all', ...existingCategories];

  const filteredItems = menuItems.filter((item) => {
    const itemCat = item.category || item.category_name || 'Mains';
    if (categoryFilter !== 'all' && itemCat !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.name || item.item_name || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchCat = itemCat.toLowerCase().includes(q);
      return matchName || matchDesc || matchCat;
    }
    return true;
  });

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#C49A52', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Operational Menu Control
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
            </div>
            <h1 className="font-royal" style={{ fontSize: '1.8rem', color: '#0B352D' }}>
              Menu Catalogue & Availability
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5C6E6A', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>Managing live items, prices, and 86'd sold out inventory for:</span>
              <strong style={{ color: '#0B352D' }}>{activeRestaurantName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-gold"
            style={{ padding: '8px 18px', fontSize: '0.88rem' }}
          >
            <Plus size={16} />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Categories & Search Filter Bar */}
        <div className="admin-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5C6E6A', textTransform: 'uppercase' }}>Filter:</span>
            {filterCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: categoryFilter === cat ? '#C49A52' : '#E8E0D2',
                  background: categoryFilter === cat ? '#0B352D' : '#FFFFFF',
                  color: categoryFilter === cat ? '#F8F1DF' : '#1E2927',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '240px', flexShrink: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#5C6E6A' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by dish name or tag..."
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                borderRadius: '6px',
                border: '1px solid #E8E0D2',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <span style={{ color: '#5C6E6A', fontSize: '0.95rem' }}>Loading menu items for this branch...</span>
          </div>
        ) : error ? (
          <div className="admin-card" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid #EF4444' }}>
            <p style={{ color: '#BE123C', fontWeight: 600 }}>{error}</p>
            <button type="button" onClick={fetchMenu} className="btn-outline-gold" style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <UtensilsCrossed size={36} style={{ color: '#C49A52', margin: '0 auto 12px', opacity: 0.7 }} />
            <h3 className="font-royal" style={{ fontSize: '1.2rem', color: '#0B352D', marginBottom: '6px' }}>
              No Dishes Found in this View
            </h3>
            <p style={{ color: '#5C6E6A', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              {searchQuery ? 'Try adjusting your search filters.' : 'Add your first dish to this branch menu catalogue.'}
            </p>
            <button type="button" onClick={handleOpenAdd} className="btn-gold">
              <Plus size={15} />
              <span>Add First Dish</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredItems.map((item) => {
              const isAvailable = item.is_available !== false && item.is_available !== 0;
              const isVeg = item.is_veg !== false && item.is_veg !== 0;

              return (
                <div
                  key={item.id}
                  className="admin-card"
                  style={{
                    padding: '1.25rem',
                    opacity: isAvailable ? 1 : 0.68,
                    borderLeft: `4px solid ${isVeg ? '#22C55E' : '#EF4444'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    {/* Top Row: Dish Name, Veg Badge & Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            width: '12px',
                            height: '12px',
                            border: `1.5px solid ${isVeg ? '#22C55E' : '#EF4444'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '2px',
                            flexShrink: 0
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isVeg ? '#22C55E' : '#EF4444'
                            }} />
                          </span>
                          <strong style={{ fontSize: '1.02rem', color: '#0B352D' }}>
                            {item.name || item.item_name}
                          </strong>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#5C6E6A', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {item.category || item.category_name || 'Mains'}
                        </span>
                      </div>

                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#C49A52', flexShrink: 0, marginLeft: '8px' }}>
                        ₹{item.price}
                      </span>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p style={{ fontSize: '0.80rem', color: '#5C6E6A', marginBottom: '10px', lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    )}

                    {/* Meta: Prep time & Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: '#5C6E6A', marginBottom: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> Prep: {item.prep_time_minutes || 15} mins
                      </span>
                      <span style={{
                        fontSize: '0.70rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: isAvailable ? '#DCFCE7' : '#FEE2E2',
                        color: isAvailable ? '#166534' : '#991B1B',
                        border: `1px solid ${isAvailable ? '#86EFAC' : '#FCA5A5'}`
                      }}>
                        {isAvailable ? 'In Stock' : 'Sold Out (86ed)'}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E8E0D2' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item)}
                      style={{
                        background: isAvailable ? 'rgba(190, 18, 60, 0.08)' : 'rgba(22, 101, 52, 0.08)',
                        border: `1px solid ${isAvailable ? '#FECDD3' : '#BBF7D0'}`,
                        borderRadius: '6px',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isAvailable ? '#BE123C' : '#166534',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease'
                      }}
                      title={isAvailable ? 'Mark this dish as Sold Out (Unavailable for order)' : 'Mark this dish back In Stock'}
                    >
                      {isAvailable ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                      <span>{isAvailable ? 'Mark Sold Out' : 'Mark In Stock'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #E8E0D2',
                          background: '#FFFFFF',
                          color: '#C49A52',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                        title="Edit dish details"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #FECDD3',
                          background: '#FFF1F2',
                          color: '#BE123C',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete dish"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div style={{ background: '#0B352D', color: '#F8F1DF', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #C49A52' }}>
                <div>
                  <h3 className="font-royal" style={{ fontSize: '1.15rem', color: '#F8F1DF' }}>
                    {editingItem ? 'Edit Dish Details' : 'Add New Heritage Dish'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#C49A52', fontWeight: 600 }}>
                    Branch: {activeRestaurantName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#F8F1DF', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Dish Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0B352D' }}>
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Paneer Biryani, Ghee Podi Thatte Idli"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #E8E0D2', fontSize: '0.90rem', outline: 'none' }}
                  />
                </div>

                {/* Category & Price Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0B352D' }}>
                      Category *
                    </label>
                    <input
                      type="text"
                      list="category-suggestions"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Mains, Tiffin, Biryanis"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #E8E0D2', fontSize: '0.90rem', outline: 'none' }}
                    />
                    <datalist id="category-suggestions">
                      {Array.from(new Set([...COMMON_CATEGORIES, ...existingCategories])).map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0B352D' }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 240"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #E8E0D2', fontSize: '0.90rem', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Prep Time & Dietary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0B352D' }}>
                      Prep Time (mins)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.prep_time_minutes}
                      onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #E8E0D2', fontSize: '0.90rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0B352D' }}>
                      Dietary Type
                    </label>
                    <select
                      value={formData.is_veg ? 'veg' : 'non-veg'}
                      onChange={(e) => setFormData({ ...formData, is_veg: e.target.value === 'veg' })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #E8E0D2', fontSize: '0.90rem', outline: 'none', background: '#FFFFFF' }}
                    >
                      <option value="veg">🟢 Pure Vegetarian</option>
                      <option value="non-veg">🔴 Non-Vegetarian</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0B352D' }}>
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Fragrant basmati rice layered with soft paneer cubes and traditional Andhra spices..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #E8E0D2', fontSize: '0.86rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* Stock Status Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <input
                    type="checkbox"
                    id="is_available_checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#C49A52', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_available_checkbox" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0B352D', cursor: 'pointer' }}>
                    Available in stock (Live for ordering)
                  </label>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #E8E0D2', background: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gold"
                    style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  >
                    {submitting ? 'Saving...' : editingItem ? 'Update Dish' : 'Save Dish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
