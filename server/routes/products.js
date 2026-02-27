const express = require('express');
const { db } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// List products with optional search/filter
router.get('/', authenticate, (req, res) => {
  const { search, category_id, status } = req.query;
  let sql = `SELECT p.*, c.name as category_name FROM products p
             LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    sql += ` AND p.category_id = ?`;
    params.push(category_id);
  }
  if (status) {
    sql += ` AND p.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY p.name`;
  const products = db.prepare(sql).all(...params);
  res.json(products);
});

// Get single product
router.get('/:id', authenticate, (req, res) => {
  const product = db.prepare(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`
  ).get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Create product (Admin only)
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, category_id, sku, purchase_price, selling_price, tax_pct, stock_qty, reorder_level } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Product name and SKU are required' });
  }

  const insertProduct = db.transaction(() => {
    const result = db.prepare(
      `INSERT INTO products (name, category_id, sku, purchase_price, selling_price, tax_pct, stock_qty, reorder_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, category_id || null, sku, purchase_price || 0, selling_price || 0, tax_pct || 0, stock_qty || 0, reorder_level || 10);

    // Log initial stock movement
    if (stock_qty && stock_qty > 0) {
      db.prepare(
        `INSERT INTO stock_movements (product_id, type, quantity_change, reason, user_id)
         VALUES (?, 'initial', ?, 'Initial stock on product creation', ?)`
      ).run(result.lastInsertRowid, stock_qty, req.user.id);
    }

    return db.prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`
    ).get(result.lastInsertRowid);
  });

  try {
    const product = insertProduct();
    res.status(201).json(product);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A product with this SKU already exists' });
    }
    throw e;
  }
});

// Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const { name, category_id, sku, purchase_price, selling_price, tax_pct, reorder_level, status } = req.body;

  try {
    db.prepare(
      `UPDATE products SET
        name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        sku = COALESCE(?, sku),
        purchase_price = COALESCE(?, purchase_price),
        selling_price = COALESCE(?, selling_price),
        tax_pct = COALESCE(?, tax_pct),
        reorder_level = COALESCE(?, reorder_level),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      name || null, category_id !== undefined ? category_id : null, sku || null,
      purchase_price !== undefined ? purchase_price : null,
      selling_price !== undefined ? selling_price : null,
      tax_pct !== undefined ? tax_pct : null,
      reorder_level !== undefined ? reorder_level : null,
      status || null, req.params.id
    );

    const product = db.prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`
    ).get(req.params.id);
    res.json(product);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A product with this SKU already exists' });
    }
    throw e;
  }
});

// Get stock movement history for a product
router.get('/:id/movements', authenticate, (req, res) => {
  const movements = db.prepare(
    `SELECT sm.*, u.name as user_name FROM stock_movements sm
     JOIN users u ON sm.user_id = u.id
     WHERE sm.product_id = ? ORDER BY sm.created_at DESC`
  ).all(req.params.id);
  res.json(movements);
});

module.exports = router;
