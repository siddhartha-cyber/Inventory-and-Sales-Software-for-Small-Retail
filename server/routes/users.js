const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// List all users (Admin only)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// Create user (Admin only)
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }
  if (!['admin', 'sales'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or sales' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, hash, role);
    const user = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    throw e;
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, password, role, status } = req.body;

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  }

  db.prepare(
    `UPDATE users SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      role = COALESCE(?, role),
      status = COALESCE(?, status)
     WHERE id = ?`
  ).run(name || null, email || null, role || null, status || null, req.params.id);

  const updated = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?')
    .get(req.params.id);
  res.json(updated);
});

module.exports = router;
