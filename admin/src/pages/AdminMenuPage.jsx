import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Sparkles
} from 'lucide-react';

export default function AdminMenuPage() {
  const { restaurant } = useAuth();
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
    if (!restaurant?.id) return;
    try {
      const res = await restaurantAPI.getMenu(restaurant.id);
      const items = res.menu_items || res.items || res || [];
      setMenuItems(items);
    } catch (err) {
      setError(err.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Open modal for add or edit
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

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || item.item_name || '',
      category: item.category || 'Mains',
      price: item.price || '',
      description: item.description || '',
      prep_time_minutes: item.prep_time_minutes || 15,
      is_veg: item.is_veg !== false,
      is_available: item.is_available !== false
    });
    setIsModalOpen(true);
  };

  // Toggle availability
  const handleToggleAvailability = async (item) => {
    try {
      const res = await restaurantAPI.toggleMenuItem(item.id);
      const newAvail = res.is_available !== undefined ? !!res.is_available : !item.is_available;
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: newAvail } : i))
      );
    } catch (err) {
      alert(`Failed to update item availability: ${err.message}`);
    }
  };

  // Save Add/Edit
  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await restaurantAPI.updateMenuItem(restaurant.id, editingItem.id, formData);
        setMenuItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { ...i, ...formData } : i))
        );
      } else {
        const res = await restaurantAPI.addMenuItem(restaurant.id, formData);
        const created = res.menu_item || res.item || { ...formData, id: Date.now() };
        setMenuItems((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Failed to save menu item: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this dish from the menu?')) return;
    try {
      await restaurantAPI.deleteMenuItem(restaurant.id, itemId);
      setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      alert(`Failed to delete menu item: ${err.message}`);
    }
  };

  const categories = ['all', ...Array.from(new Set(menuItems.map((i) => i.category || 'Mains')))];

  const filteredItems = menuItems.filter((item) => {
    if (categoryFilter !== 'all' && (item.category || 'Mains') !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.name || item.item_name || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="font-royal" style={{ fontSize: '1.8rem', color: '#0B352D' }}>
              Menu Catalogue & Availability
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5C6E6A' }}>
              Manage dishes, toggle 86'd out-of-stock items, prices, and prep times for {restaurant?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-gold"
          >
            <Plus size={16} />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Categories & Search */}
        <div className="admin-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: categoryFilter === cat ? '#C49A52' : '#E8E0D2',
                  background: categoryFilter === cat ? '#0B352D' : '#FFFFFF',
                  color: categoryFilter === cat ? '#F8F1DF' : '#1E2927',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#5C6E6A' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
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
            <span style={{ color: '#5C6E6A' }}>Loading menu items...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#5C6E6A' }}>No menu items found.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="admin-card"
                style={{
                  padding: '1.25rem',
                  opacity: item.is_available === false ? 0.65 : 1,
                  borderLeft: `4px solid ${item.is_veg !== false ? '#22C55E' : '#EF4444'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        border: `1.5px solid ${item.is_veg !== false ? '#22C55E' : '#EF4444'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '2px'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: item.is_veg !== false ? '#22C55E' : '#EF4444'
                        }} />
                      </span>
                      <strong style={{ fontSize: '1.05rem', color: '#0B352D' }}>{item.name || item.item_name}</strong>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#5C6E6A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {item.category || 'Mains'}
                    </span>
                  </div>

                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#C49A52' }}>
                    ₹{item.price}
                  </span>
                </div>

                {item.description && (
                  <p style={{ fontSize: '0.82rem', color: '#5C6E6A', marginBottom: '12px', lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.76rem', color: '#5C6E6A', marginBottom: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> Prep: {item.prep_time_minutes || 15} mins
                  </span>
                  <span>
                    Status: <strong style={{ color: item.is_available === false ? '#BE123C' : '#166534' }}>
                      {item.is_available === false ? 'Sold Out (86ed)' : 'In Stock'}
                    </strong>
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E8E0D2' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(item)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: item.is_available === false ? '#166534' : '#BE123C',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {item.is_available === false ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
                    <span>{item.is_available === false ? 'Mark In Stock' : 'Mark Sold Out'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid #E8E0D2',
                        background: '#FFFFFF',
                        color: '#C49A52',
                        cursor: 'pointer'
                      }}
                      title="Edit dish"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid #FECDD3',
                        background: '#FFF1F2',
                        color: '#BE123C',
                        cursor: 'pointer'
                      }}
                      title="Delete dish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div style={{ background: '#0B352D', color: '#F8F1DF', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #C49A52' }}>
                <h3 className="font-royal" style={{ fontSize: '1.15rem' }}>
                  {editingItem ? 'Edit Dish Details' : 'Add New Heritage Dish'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#F8F1DF', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Dish Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ghee Podi Thatte Idli"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E8E0D2' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Category</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Tiffin, Mains, Sweets"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E8E0D2' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="e.g. 120"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E8E0D2' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Prep Time (mins)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.prep_time_minutes}
                      onChange={(e) => setFormData({ ...formData, prep_time_minutes: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E8E0D2' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Dietary</label>
                    <select
                      value={formData.is_veg ? 'veg' : 'non-veg'}
                      onChange={(e) => setFormData({ ...formData, is_veg: e.target.value === 'veg' })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E8E0D2' }}
                    >
                      <option value="veg">Vegetarian (Pure)</option>
                      <option value="non-veg">Non-Vegetarian</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Crispy exterior, soft interior, spiced with heritage chutney podi..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E8E0D2' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #E8E0D2', background: '#FFFFFF', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gold"
                  >
                    {submitting ? 'Saving...' : 'Save Dish'}
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
