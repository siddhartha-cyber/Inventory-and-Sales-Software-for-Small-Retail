const express = require('express');
const { db } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    throw e;
  }
});

router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, status } = req.body;
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  db.prepare('UPDATE categories SET name = COALESCE(?, name), status = COALESCE(?, status) WHERE id = ?')
    .run(name || null, status || null, req.params.id);

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
