const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Công khai - ai cũng xem được danh sách sản phẩm
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json({ products });
});

// Admin: thêm sản phẩm
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  if (!name || price == null || price < 0) {
    return res.status(400).json({ error: 'Thiếu tên hoặc giá sản phẩm không hợp lệ.' });
  }
  const result = db
    .prepare(
      'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name, description || '', Math.round(price), Math.max(0, stock || 0), image_url || '');
  res.json({ id: result.lastInsertRowid });
});

// Admin: sửa sản phẩm
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });

  db.prepare(
    'UPDATE products SET name=?, description=?, price=?, stock=?, image_url=? WHERE id=?'
  ).run(
    name ?? existing.name,
    description ?? existing.description,
    price != null ? Math.round(price) : existing.price,
    stock != null ? Math.max(0, stock) : existing.stock,
    image_url ?? existing.image_url,
    req.params.id
  );
  res.json({ ok: true });
});

// Admin: xoá sản phẩm
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
