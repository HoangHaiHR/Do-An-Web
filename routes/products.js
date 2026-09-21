const express = require('express');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const products = await Product.find().sort({ created_at: -1 });
  res.json({ products });
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, category, price, stock, image_url } = req.body;
  if (!name || price == null || price < 0) {
    return res.status(400).json({ error: 'Thiếu tên hoặc giá sản phẩm không hợp lệ.' });
  }
  const product = await Product.create({
    name,
    description: description || '',
    category: category || 'Khác',
    price: Math.round(price),
    stock: Math.max(0, stock || 0),
    image_url: image_url || ''
  });
  res.json({ id: product.id });
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });

  const { name, description, category, price, stock, image_url } = req.body;
  if (name != null) existing.name = name;
  if (description != null) existing.description = description;
  if (category != null) existing.category = category;
  if (price != null) existing.price = Math.round(price);
  if (stock != null) existing.stock = Math.max(0, stock);
  if (image_url != null) existing.image_url = image_url;
  await existing.save();
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
