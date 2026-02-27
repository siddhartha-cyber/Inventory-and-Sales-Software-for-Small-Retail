const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { generateReceipt } = require('../utils/pdf');

const router = express.Router();

router.get('/:billId', authenticate, async (req, res) => {
  const bill = db.prepare(
    `SELECT sb.*, u.name as cashier_name FROM sales_bills sb
     JOIN users u ON sb.user_id = u.id WHERE sb.id = ?`
  ).get(req.params.billId);

  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  const items = db.prepare(
    `SELECT sbi.*, p.name as product_name, p.sku
     FROM sales_bill_items sbi
     JOIN products p ON sbi.product_id = p.id
     WHERE sbi.bill_id = ?`
  ).all(bill.id);

  try {
    const pdfBuffer = await generateReceipt(bill, items);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${bill.bill_number}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
});

module.exports = router;
