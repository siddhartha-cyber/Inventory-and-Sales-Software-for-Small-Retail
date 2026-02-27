const express = require('express');
const { db } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get stock overview
router.get('/stock', authenticate, (req, res) => {
  const { category_id, status } = req.query;
  let sql = `SELECT p.id, p.name, p.sku, p.stock_qty, p.reorder_level, p.status,
             c.name as category_name,
             CASE
               WHEN p.stock_qty = 0 THEN 'out_of_stock'
               WHEN p.stock_qty <= p.reorder_level THEN 'low_stock'
               ELSE 'in_stock'
             END as stock_status
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.status = 'active'`;
  const params = [];

  if (category_id) {
    sql += ` AND p.category_id = ?`;
    params.push(category_id);
  }
  if (status === 'low_stock') {
    sql += ` AND p.stock_qty > 0 AND p.stock_qty <= p.reorder_level`;
  } else if (status === 'out_of_stock') {
    sql += ` AND p.stock_qty = 0`;
  }

  sql += ` ORDER BY p.stock_qty ASC`;
  const stock = db.prepare(sql).all(...params);
  res.json(stock);
});

// Manual stock adjustment (Admin only)
router.post('/adjust', authenticate, requireAdmin, (req, res) => {
  const { product_id, quantity_change, reason } = req.body;

  if (!product_id || quantity_change === undefined || !reason) {
    return res.status(400).json({ error: 'Product ID, quantity change, and reason are required' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const newQty = product.stock_qty + quantity_change;
  if (newQty < 0) {
    return res.status(400).json({ error: 'Stock cannot go below zero' });
  }

  const adjust = db.transaction(() => {
    db.prepare('UPDATE products SET stock_qty = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newQty, product_id);
    db.prepare(
      `INSERT INTO stock_movements (product_id, type, quantity_change, reason, user_id)
       VALUES (?, 'adjustment', ?, ?, ?)`
    ).run(product_id, quantity_change, reason, req.user.id);

    return db.prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`
    ).get(product_id);
  });

  const updated = adjust();
  res.json(updated);
});

// Get low stock alerts
router.get('/alerts', authenticate, (req, res) => {
  const alerts = db.prepare(
    `SELECT p.id, p.name, p.sku, p.stock_qty, p.reorder_level, c.name as category_name,
     CASE WHEN p.stock_qty = 0 THEN 'out_of_stock' ELSE 'low_stock' END as alert_type
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.status = 'active' AND p.stock_qty <= p.reorder_level
     ORDER BY p.stock_qty ASC`
  ).all();
  res.json(alerts);
});

module.exports = router;
