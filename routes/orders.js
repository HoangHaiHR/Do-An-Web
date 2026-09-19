const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Đặt hàng: body = { items: [{ product_id, quantity }] }
router.post('/', requireAuth, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng trống.' });
  }

  const placeOrder = db.transaction(() => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    let total = 0;
    const lineItems = [];

    for (const it of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(it.product_id);
      if (!product) throw new Error(`Sản phẩm #${it.product_id} không tồn tại.`);
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      if (product.stock < qty) throw new Error(`"${product.name}" không đủ hàng trong kho.`);
      total += product.price * qty;
      lineItems.push({ product, qty });
    }

    if (user.balance < total) {
      throw new Error('Số dư không đủ. Vui lòng nạp tiền trước khi đặt hàng.');
    }

    const orderResult = db
      .prepare('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)')
      .run(user.id, total, 'completed');
    const orderId = orderResult.lastInsertRowid;

    for (const { product, qty } of lineItems) {
      db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)'
      ).run(orderId, product.id, product.name, qty, product.price);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
    }

    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(total, user.id);
    return { orderId, total };
  });

  try {
    const result = placeOrder();
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  const withItems = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
  }));
  res.json({ orders: withItems });
});

module.exports = router;
