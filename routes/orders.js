const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng trống.' });
  }

  const session = await mongoose.startSession();
  try {
    let orderId, total;
    await session.withTransaction(async () => {
      const user = await User.findById(req.user.id).session(session);
      total = 0;
      const lineItems = [];

      for (const it of items) {
        const product = await Product.findById(it.product_id).session(session);
        if (!product) throw new Error(`Sản phẩm không tồn tại.`);
        const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
        if (product.stock < qty) throw new Error(`"${product.name}" không đủ hàng trong kho.`);
        total += product.price * qty;
        lineItems.push({ product, qty });
      }

      if (user.balance < total) {
        throw new Error('Số dư không đủ. Vui lòng nạp tiền trước khi đặt hàng.');
      }

      const order = await Order.create(
        [
          {
            user: user._id,
            total,
            status: 'completed',
            items: lineItems.map(({ product, qty }) => ({
              product: product._id,
              product_name: product.name,
              quantity: qty,
              price: product.price
            }))
          }
        ],
        { session }
      );
      orderId = order[0].id;

      for (const { product, qty } of lineItems) {
        product.stock -= qty;
        await product.save({ session });
      }

      user.balance -= total;
      await user.save({ session });
    });

    res.json({ ok: true, orderId, total });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ created_at: -1 });
  res.json({ orders });
});

module.exports = router;
