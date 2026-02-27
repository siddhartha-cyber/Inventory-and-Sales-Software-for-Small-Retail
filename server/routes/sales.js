const express = require('express');
const { db } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Generate bill number
function generateBillNumber() {
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const last = db.prepare(
    "SELECT bill_number FROM sales_bills WHERE bill_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`${prefix}%`);

  let seq = 1;
  if (last) {
    const parts = last.bill_number.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

// Create a new sale/bill
router.post('/', authenticate, (req, res) => {
  const { items, payment_method, payment_status, discount, discount_type } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'At least one item is required' });
  }
  if (!payment_method) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  const createSale = db.transaction(() => {
    const billNumber = generateBillNumber();
    let subtotal = 0;
    let totalTax = 0;

    // Validate all items first
    const lineItems = [];
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(item.product_id, 'active');
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found or inactive`);
      }
      if (product.stock_qty < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_qty}`);
      }

      const lineSubtotal = product.selling_price * item.quantity;
      const lineTax = lineSubtotal * (product.tax_pct / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      totalTax += lineTax;

      lineItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.selling_price,
        tax_pct: product.tax_pct,
        line_total: lineTotal
      });
    }

    // Calculate discount
    let discountAmount = 0;
    const dType = discount_type || 'flat';
    if (discount && discount > 0) {
      discountAmount = dType === 'percentage' ? (subtotal * discount / 100) : discount;
    }

    const total = subtotal + totalTax - discountAmount;

    // Create bill
    const billResult = db.prepare(
      `INSERT INTO sales_bills (bill_number, subtotal, tax_amount, discount, discount_type, total, payment_method, payment_status, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(billNumber, subtotal, totalTax, discountAmount, dType, total, payment_method, payment_status || 'paid', req.user.id);

    const billId = billResult.lastInsertRowid;

    // Insert items and deduct stock
    for (const li of lineItems) {
      db.prepare(
        `INSERT INTO sales_bill_items (bill_id, product_id, quantity, unit_price, tax_pct, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(billId, li.product_id, li.quantity, li.unit_price, li.tax_pct, li.line_total);

      // Deduct stock
      db.prepare('UPDATE products SET stock_qty = stock_qty - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(li.quantity, li.product_id);

      // Log stock movement
      db.prepare(
        `INSERT INTO stock_movements (product_id, type, quantity_change, reason, user_id)
         VALUES (?, 'sale', ?, ?, ?)`
      ).run(li.product_id, -li.quantity, `Sale: ${billNumber}`, req.user.id);
    }

    // Return full bill
    const bill = db.prepare('SELECT * FROM sales_bills WHERE id = ?').get(billId);
    const billItems = db.prepare(
      `SELECT sbi.*, p.name as product_name, p.sku
       FROM sales_bill_items sbi
       JOIN products p ON sbi.product_id = p.id
       WHERE sbi.bill_id = ?`
    ).all(billId);

    return { ...bill, items: billItems };
  });

  try {
    const sale = createSale();
    res.status(201).json(sale);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all bills with pagination
router.get('/', authenticate, (req, res) => {
  const { page = 1, limit = 20, date, status } = req.query;
  const offset = (page - 1) * limit;

  let countSql = 'SELECT COUNT(*) as total FROM sales_bills WHERE 1=1';
  let sql = `SELECT sb.*, u.name as cashier_name FROM sales_bills sb
             JOIN users u ON sb.user_id = u.id WHERE 1=1`;
  const params = [];

  if (date) {
    sql += ` AND DATE(sb.sale_date) = ?`;
    countSql += ` AND DATE(sale_date) = ?`;
    params.push(date);
  }
  if (status) {
    sql += ` AND sb.status = ?`;
    countSql += ` AND status = ?`;
    params.push(status);
  }

  const { total } = db.prepare(countSql).get(...params);
  sql += ` ORDER BY sb.sale_date DESC LIMIT ? OFFSET ?`;

  const bills = db.prepare(sql).all(...params, parseInt(limit), offset);
  res.json({ bills, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// Get single bill with items
router.get('/:id', authenticate, (req, res) => {
  const bill = db.prepare(
    `SELECT sb.*, u.name as cashier_name FROM sales_bills sb
     JOIN users u ON sb.user_id = u.id WHERE sb.id = ?`
  ).get(req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  const items = db.prepare(
    `SELECT sbi.*, p.name as product_name, p.sku
     FROM sales_bill_items sbi
     JOIN products p ON sbi.product_id = p.id
     WHERE sbi.bill_id = ?`
  ).all(bill.id);

  res.json({ ...bill, items });
});

// Cancel a bill (Admin only)
router.post('/:id/cancel', authenticate, requireAdmin, (req, res) => {
  const bill = db.prepare('SELECT * FROM sales_bills WHERE id = ?').get(req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  if (bill.status === 'cancelled') return res.status(400).json({ error: 'Bill is already cancelled' });

  const cancelBill = db.transaction(() => {
    db.prepare("UPDATE sales_bills SET status = 'cancelled' WHERE id = ?").run(bill.id);

    // Reverse stock for each item
    const items = db.prepare('SELECT * FROM sales_bill_items WHERE bill_id = ?').all(bill.id);
    for (const item of items) {
      db.prepare('UPDATE products SET stock_qty = stock_qty + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(item.quantity, item.product_id);
      db.prepare(
        `INSERT INTO stock_movements (product_id, type, quantity_change, reason, user_id)
         VALUES (?, 'cancellation', ?, ?, ?)`
      ).run(item.product_id, item.quantity, `Cancellation: ${bill.bill_number}`, req.user.id);
    }

    return db.prepare(
      `SELECT sb.*, u.name as cashier_name FROM sales_bills sb
       JOIN users u ON sb.user_id = u.id WHERE sb.id = ?`
    ).get(bill.id);
  });

  const cancelled = cancelBill();
  res.json(cancelled);
});

module.exports = router;
