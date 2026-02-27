const PDFDocument = require('pdfkit');

function generateReceipt(bill, items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Store Header
    doc.fontSize(20).font('Helvetica-Bold').text('RETAIL STORE', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('123 Main Street, City, State 12345', { align: 'center' });
    doc.text('Phone: (555) 123-4567 | Email: store@example.com', { align: 'center' });
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Receipt Title
    doc.fontSize(16).font('Helvetica-Bold').text('SALES RECEIPT', { align: 'center' });
    doc.moveDown(0.5);

    // Bill Info
    doc.fontSize(10).font('Helvetica');
    doc.text(`Bill Number: ${bill.bill_number}`, 50);
    doc.text(`Date: ${new Date(bill.sale_date).toLocaleString()}`, 50);
    doc.text(`Cashier: ${bill.cashier_name || 'N/A'}`, 50);
    doc.text(`Payment: ${bill.payment_method.toUpperCase()} | Status: ${bill.payment_status.toUpperCase()}`, 50);
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('#', 50, tableTop, { width: 30 });
    doc.text('Product', 80, tableTop, { width: 180 });
    doc.text('SKU', 260, tableTop, { width: 80 });
    doc.text('Qty', 340, tableTop, { width: 40, align: 'right' });
    doc.text('Price', 385, tableTop, { width: 70, align: 'right' });
    doc.text('Total', 460, tableTop, { width: 80, align: 'right' });
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    // Table Rows
    doc.font('Helvetica').fontSize(9);
    items.forEach((item, i) => {
      const y = doc.y;
      doc.text(String(i + 1), 50, y, { width: 30 });
      doc.text(item.product_name || 'Product', 80, y, { width: 180 });
      doc.text(item.sku || '-', 260, y, { width: 80 });
      doc.text(String(item.quantity), 340, y, { width: 40, align: 'right' });
      doc.text(`$${item.unit_price.toFixed(2)}`, 385, y, { width: 70, align: 'right' });
      doc.text(`$${item.line_total.toFixed(2)}`, 460, y, { width: 80, align: 'right' });
      doc.moveDown(0.8);
    });

    // Divider
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Totals
    doc.font('Helvetica').fontSize(10);
    const totalsX = 380;
    doc.text('Subtotal:', totalsX, doc.y, { width: 80 });
    doc.text(`$${bill.subtotal.toFixed(2)}`, 460, doc.y - 12, { width: 80, align: 'right' });
    doc.moveDown(0.4);

    doc.text('Tax:', totalsX, doc.y, { width: 80 });
    doc.text(`$${bill.tax_amount.toFixed(2)}`, 460, doc.y - 12, { width: 80, align: 'right' });
    doc.moveDown(0.4);

    if (bill.discount > 0) {
      doc.text('Discount:', totalsX, doc.y, { width: 80 });
      doc.text(`-$${bill.discount.toFixed(2)}`, 460, doc.y - 12, { width: 80, align: 'right' });
      doc.moveDown(0.4);
    }

    doc.moveTo(380, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', totalsX, doc.y, { width: 80 });
    doc.text(`$${bill.total.toFixed(2)}`, 460, doc.y - 14, { width: 80, align: 'right' });
    doc.moveDown(2);

    // Footer
    doc.font('Helvetica').fontSize(9).fillColor('#666');
    doc.text('Thank you for your purchase!', { align: 'center' });
    doc.text('Please keep this receipt for your records.', { align: 'center' });

    doc.end();
  });
}

module.exports = { generateReceipt };
