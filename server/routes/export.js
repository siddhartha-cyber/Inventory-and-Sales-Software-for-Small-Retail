const express = require('express');
const XLSX = require('xlsx');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Generic export helper
function exportData(res, data, filename, format) {
  if (format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    return res.send(csv);
  }

  // Default to xlsx
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
  res.send(Buffer.from(buffer));
}

// Export daily sales
router.get('/daily-sales', authenticate, (req, res) => {
  const { date, format } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const data = db.prepare(
    `SELECT sb.bill_number, sb.sale_date, sb.subtotal, sb.tax_amount, sb.discount,
     sb.total, sb.payment_method, sb.payment_status, u.name as cashier
     FROM sales_bills sb JOIN users u ON sb.user_id = u.id
     WHERE DATE(sb.sale_date) = ? AND sb.status = 'completed'
     ORDER BY sb.sale_date`
  ).all(targetDate);

  exportData(res, data, `daily-sales-${targetDate}`, format || 'xlsx');
});

// Export stock report
router.get('/stock', authenticate, (req, res) => {
  const { format } = req.query;

  const data = db.prepare(
    `SELECT p.name as Product, p.sku as SKU, c.name as Category,
     p.stock_qty as "Stock Qty", p.reorder_level as "Reorder Level",
     p.purchase_price as "Purchase Price", p.selling_price as "Selling Price",
     CASE WHEN p.stock_qty = 0 THEN 'Out of Stock'
          WHEN p.stock_qty <= p.reorder_level THEN 'Low Stock'
          ELSE 'In Stock' END as Status
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.status = 'active' ORDER BY p.name`
  ).all();

  exportData(res, data, 'stock-report', format || 'xlsx');
});

// Export product sales
router.get('/product-sales', authenticate, (req, res) => {
  const { start_date, end_date, format } = req.query;

  let sql = `SELECT p.name as Product, p.sku as SKU, c.name as Category,
             SUM(sbi.quantity) as "Units Sold", SUM(sbi.line_total) as Revenue
             FROM sales_bill_items sbi
             JOIN sales_bills sb ON sbi.bill_id = sb.id
             JOIN products p ON sbi.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE sb.status = 'completed'`;
  const params = [];

  if (start_date) { sql += ` AND DATE(sb.sale_date) >= ?`; params.push(start_date); }
  if (end_date) { sql += ` AND DATE(sb.sale_date) <= ?`; params.push(end_date); }

  sql += ` GROUP BY p.id ORDER BY Revenue DESC`;

  const data = db.prepare(sql).all(...params);
  exportData(res, data, 'product-sales', format || 'xlsx');
});

module.exports = router;
