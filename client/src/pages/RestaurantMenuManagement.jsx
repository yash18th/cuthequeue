import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { menuAPI } from '../utils/api';
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';

export default function RestaurantMenuManagement() {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    is_veg: true,
    image: '',
    is_available: true,
    customizations: []
  });

  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  const loadMenu = async () => {
    if (!restaurant?.id) return;
    try {
      const res = await menuAPI.getByRestaurant(restaurant.id);
      setCategories(res.categories || []);
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [restaurant?.id]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      description: '',
      price: '',
      is_veg: true,
      image: '',
      is_available: true,
      customizations: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category_id: item.category_id,
      description: item.description || '',
      price: item.price,
      is_veg: !!item.is_veg,
      image: item.image || '',
      is_available: !!item.is_available,
      customizations: item.customizations || []
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await menuAPI.updateItem(editingItem.id, formData);
      } else {
        await menuAPI.addItem(restaurant.id, formData);
      }
      setIsModalOpen(false);
      loadMenu();
    } catch (err) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await menuAPI.toggleAvailability(item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: i.is_available ? 0 : 1 } : i))
      );
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await menuAPI.deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await menuAPI.addCategory(restaurant.id, { name: newCatName.trim() });
      setNewCatName('');
      setShowAddCat(false);
      loadMenu();
    } catch (err) {
      alert('Failed to create category');
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Menu Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Add, edit food items, adjust prices, and toggle instant availability for customers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCat(!showAddCat)}>
              + Add Category
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              <Plus size={16} /> Add Food Item
            </button>
          </div>
        </div>

        {/* Add Category Drawer/Form */}
        {showAddCat && (
          <form onSubmit={handleCreateCategory} className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'white', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>New Menu Category</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Combos & Specials"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        )}

        {/* Items Table / Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading menu items...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {categories.map((cat) => {
              const catItems = items.filter((i) => i.category_id === cat.id);

              return (
                <div key={cat.id} className="card" style={{ padding: '1.5rem', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                      {cat.name} ({catItems.length})
                    </h3>
                  </div>

                  {catItems.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No items added in this category yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: item.is_available ? 'white' : '#f8fafc',
                            opacity: item.is_available ? 1 : 0.65
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={item.is_veg ? 'veg-indicator' : 'non-veg-indicator'}>
                                  {item.is_veg ? <span className="veg-indicator-dot" /> : <span className="non-veg-indicator-triangle" />}
                                </span>
                                <strong style={{ fontSize: '0.95rem' }}>{item.name}</strong>
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                ₹{item.price}
                              </span>
                            </div>
                          </div>

                          {/* Control Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                              className={`btn btn-sm ${item.is_available ? 'btn-secondary' : 'btn-outline'}`}
                              style={{ fontSize: '0.78rem' }}
                              onClick={() => handleToggleAvailability(item)}
                            >
                              {item.is_available ? '🟢 In Stock' : '🔴 Out of Stock'}
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ color: 'var(--accent-rose)' }}
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Food Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} style={{ padding: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Food Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Crispy Chicken Burger"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Price (₹)</label>
                    <input
                      type="number"
                      step="1"
                      className="input-field"
                      placeholder="149"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Category</label>
                    <select
                      className="input-field"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Dietary Flag</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="is_veg"
                        checked={formData.is_veg === true}
                        onChange={() => setFormData({ ...formData, is_veg: true })}
                      />
                      Vegetarian 🟢
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="is_veg"
                        checked={formData.is_veg === false}
                        onChange={() => setFormData({ ...formData, is_veg: false })}
                      />
                      Non-Vegetarian 🔴
                    </label>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Food Photo URL</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Crispy fried patty with fresh lettuce and sauce..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                  {editingItem ? 'Save Updates' : 'Add to Live Menu'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
