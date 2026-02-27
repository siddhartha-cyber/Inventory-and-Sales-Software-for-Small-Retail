const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Dashboard summary
router.get('/dashboard', authenticate, (req, res) => {
  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'").get().count;
  const lowStockItems = db.prepare(
    "SELECT COUNT(*) as count FROM products WHERE status = 'active' AND stock_qty > 0 AND stock_qty <= reorder_level"
  ).get().count;
  const outOfStock = db.prepare(
    "SELECT COUNT(*) as count FROM products WHERE status = 'active' AND stock_qty = 0"
  ).get().count;

  const todaySales = db.prepare(
    "SELECT COALESCE(SUM(total), 0) as total FROM sales_bills WHERE DATE(sale_date) = DATE('now') AND status = 'completed'"
  ).get().total;

  const monthlySales = db.prepare(
    `SELECT COALESCE(SUM(total), 0) as total FROM sales_bills
     WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now') AND status = 'completed'`
  ).get().total;

  const todayTransactions = db.prepare(
    "SELECT COUNT(*) as count FROM sales_bills WHERE DATE(sale_date) = DATE('now') AND status = 'completed'"
  ).get().count;

  const recentSales = db.prepare(
    `SELECT sb.*, u.name as cashier_name FROM sales_bills sb
     JOIN users u ON sb.user_id = u.id
     WHERE sb.status = 'completed'
     ORDER BY sb.sale_date DESC LIMIT 5`
  ).all();

  const lowStockProducts = db.prepare(
    `SELECT p.id, p.name, p.sku, p.stock_qty, p.reorder_level, c.name as category_name
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.status = 'active' AND p.stock_qty <= p.reorder_level
     ORDER BY p.stock_qty ASC LIMIT 10`
  ).all();

  res.json({
    totalProducts,
    lowStockItems,
    outOfStock,
    todaySales,
    monthlySales,
    todayTransactions,
    recentSales,
    lowStockProducts
  });
});

// Daily sales report
router.get('/daily-sales', authenticate, (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const bills = db.prepare(
    `SELECT sb.*, u.name as cashier_name FROM sales_bills sb
     JOIN users u ON sb.user_id = u.id
     WHERE DATE(sb.sale_date) = ? AND sb.status = 'completed'
     ORDER BY sb.sale_date DESC`
  ).all(targetDate);

  const summary = db.prepare(
    `SELECT COUNT(*) as transaction_count, COALESCE(SUM(total), 0) as total_revenue,
     COALESCE(SUM(tax_amount), 0) as total_tax, COALESCE(SUM(discount), 0) as total_discount
     FROM sales_bills WHERE DATE(sale_date) = ? AND status = 'completed'`
  ).get(targetDate);

  res.json({ date: targetDate, bills, summary });
});

// Monthly sales report
router.get('/monthly-sales', authenticate, (req, res) => {
  const { month, year } = req.query;
  const targetMonth = month || String(new Date().getMonth() + 1).padStart(2, '0');
  const targetYear = year || String(new Date().getFullYear());
  const ym = `${targetYear}-${targetMonth}`;

  const dailyTotals = db.prepare(
    `SELECT DATE(sale_date) as date, COUNT(*) as transactions, SUM(total) as revenue
     FROM sales_bills WHERE strftime('%Y-%m', sale_date) = ? AND status = 'completed'
     GROUP BY DATE(sale_date) ORDER BY date`
  ).all(ym);

  const summary = db.prepare(
    `SELECT COUNT(*) as transaction_count, COALESCE(SUM(total), 0) as total_revenue,
     COALESCE(SUM(tax_amount), 0) as total_tax, COALESCE(SUM(discount), 0) as total_discount
     FROM sales_bills WHERE strftime('%Y-%m', sale_date) = ? AND status = 'completed'`
  ).get(ym);

  res.json({ month: ym, dailyTotals, summary });
});

// Product-wise sales report
router.get('/product-sales', authenticate, (req, res) => {
  const { start_date, end_date, category_id } = req.query;

  let sql = `SELECT p.id, p.name, p.sku, c.name as category_name,
             SUM(sbi.quantity) as units_sold, SUM(sbi.line_total) as revenue
             FROM sales_bill_items sbi
             JOIN sales_bills sb ON sbi.bill_id = sb.id
             JOIN products p ON sbi.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE sb.status = 'completed'`;
  const params = [];

  if (start_date) { sql += ` AND DATE(sb.sale_date) >= ?`; params.push(start_date); }
  if (end_date) { sql += ` AND DATE(sb.sale_date) <= ?`; params.push(end_date); }
  if (category_id) { sql += ` AND p.category_id = ?`; params.push(category_id); }

  sql += ` GROUP BY p.id ORDER BY revenue DESC`;

  const products = db.prepare(sql).all(...params);
  res.json(products);
});

// Stock report
router.get('/stock', authenticate, (req, res) => {
  const { category_id } = req.query;
  let sql = `SELECT p.id, p.name, p.sku, p.stock_qty, p.reorder_level,
             p.purchase_price, p.selling_price, c.name as category_name,
             CASE
               WHEN p.stock_qty = 0 THEN 'Out of Stock'
               WHEN p.stock_qty <= p.reorder_level THEN 'Low Stock'
               ELSE 'In Stock'
             END as stock_status
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.status = 'active'`;
  const params = [];

  if (category_id) { sql += ` AND p.category_id = ?`; params.push(category_id); }
  sql += ` ORDER BY p.stock_qty ASC`;

  const stock = db.prepare(sql).all(...params);
  res.json(stock);
});

module.exports = router;
