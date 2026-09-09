const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'customer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const validRoles = ['customer', 'restaurant_admin'];
    const assignedRole = validRoles.includes(role) ? role : 'customer';

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), email.toLowerCase().trim(), phone || '', passwordHash, assignedRole);

    const userId = result.lastInsertRowid;

    // If registered as restaurant admin, create a default restaurant entry for them
    let restaurant = null;
    if (assignedRole === 'restaurant_admin') {
      const restResult = db.prepare(`
        INSERT INTO restaurants (name, description, cuisine, address, contact_phone, owner_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `${name}'s Kitchen`,
        'Welcome to our kitchen! Delicious food prepared fast.',
        'Fast Food • Snacks',
        'Campus Food Court',
        phone || '',
        userId
      );
      restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restResult.lastInsertRowid);
    }

    const token = jwt.sign({ id: userId, role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });

    const newUser = db.prepare('SELECT id, name, email, phone, role, avatar, notification_preferences FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        ...newUser,
        notification_preferences: JSON.parse(newUser.notification_preferences || '{}')
      },
      restaurant
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.warn('[Auth] Login attempt rejected: missing email or password');
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      console.warn(`[Auth] Login failed: no user found for email "${cleanEmail}"`);
      return res.status(401).json({ error: 'No account found with this email. Please click "Sign Up" below to create one.' });
    }

    if (user.is_suspended) {
      console.warn(`[Auth] Login rejected: user "${cleanEmail}" (ID: ${user.id}) is suspended`);
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[Auth] Login failed: incorrect password for user "${cleanEmail}" (ID: ${user.id})`);
      return res.status(401).json({ error: 'Incorrect password. Please verify your password or use demo accounts.' });
    }

    console.log(`[Auth] Successful login: "${cleanEmail}" (Role: ${user.role}, ID: ${user.id})`);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    let restaurant = null;
    if (user.role === 'restaurant_admin') {
      restaurant = db.prepare('SELECT * FROM restaurants WHERE owner_id = ?').get(user.id);
    }

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: {
        ...userWithoutPassword,
        notification_preferences: JSON.parse(user.notification_preferences || '{"push":true,"sound":true,"vibration":true}')
      },
      restaurant
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Current user profile + restaurant info
router.get('/me', authenticate, (req, res) => {
  try {
    let restaurant = null;
    if (req.user.role === 'restaurant_admin') {
      restaurant = db.prepare('SELECT * FROM restaurants WHERE owner_id = ?').get(req.user.id);
    }

    res.json({
      user: {
        ...req.user,
        notification_preferences: JSON.parse(req.user.notification_preferences || '{"push":true,"sound":true,"vibration":true}')
      },
      restaurant
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

// Update profile & notification preferences
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, phone, avatar, notification_preferences } = req.body;

    const notifStr = notification_preferences ? JSON.stringify(notification_preferences) : req.user.notification_preferences;

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          avatar = COALESCE(?, avatar),
          notification_preferences = ?
      WHERE id = ?
    `).run(name, phone, avatar, notifStr, req.user.id);

    const updated = db.prepare('SELECT id, name, email, phone, role, avatar, notification_preferences FROM users WHERE id = ?').get(req.user.id);

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updated,
        notification_preferences: JSON.parse(updated.notification_preferences || '{}')
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Reset / Update Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }
    const passwordHash = await bcrypt.hash(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);
    res.json({ message: 'Password updated successfully! You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Quick demo users list for easy 1-click testing
router.get('/demo-users', (req, res) => {
  res.json([
    {
      role: 'customer',
      roleLabel: 'Customer',
      email: 'customer@demo.com',
      password: 'password123',
      name: 'Alex Morgan',
      description: 'Explore menus, place pre-orders, and track queue live'
    },
    {
      role: 'restaurant_admin',
      roleLabel: 'Restaurant Admin (Campus Cafe)',
      email: 'campus@demo.com',
      password: 'password123',
      name: 'Rohan Sharma',
      description: 'Manage live orders, mark ready, scan QR codes & update menu'
    },
    {
      role: 'restaurant_admin',
      roleLabel: 'Restaurant Admin (Spice Corner)',
      email: 'spice@demo.com',
      password: 'password123',
      name: 'Priya Patel',
      description: 'South Indian specialist kitchen management'
    },
    {
      role: 'super_admin',
      roleLabel: 'Super Admin',
      email: 'admin@cutthequeue.com',
      password: 'password123',
      name: 'System Administrator',
      description: 'Platform analytics, manage restaurants, and supervise users'
    }
  ]);
});

module.exports = router;
