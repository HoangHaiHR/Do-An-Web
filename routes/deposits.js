const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// User: tạo yêu cầu nạp tiền (chờ admin duyệt)
router.post('/', requireAuth, (req, res) => {
  const { amount, method, note } = req.body;
  const amt = Math.round(Number(amount));
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Số tiền không hợp lệ.' });

  const result = db
    .prepare(
      'INSERT INTO deposits (user_id, amount, method, note, status) VALUES (?, ?, ?, ?, ?)'
    )
    .run(req.user.id, amt, method || 'bank_transfer', note || '', 'pending');
  res.json({ ok: true, id: result.lastInsertRowid });
});

// User: xem lịch sử nạp tiền của chính mình
router.get('/me', requireAuth, (req, res) => {
  const deposits = db
    .prepare('SELECT * FROM deposits WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  res.json({ deposits });
});

// Admin: xem tất cả yêu cầu (mặc định: đang chờ)
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const status = req.query.status || 'pending';
  const rows =
    status === 'all'
      ? db
          .prepare(
            `SELECT d.*, u.username FROM deposits d JOIN users u ON u.id = d.user_id ORDER BY d.id DESC`
          )
          .all()
      : db
          .prepare(
            `SELECT d.*, u.username FROM deposits d JOIN users u ON u.id = d.user_id WHERE d.status = ? ORDER BY d.id DESC`
          )
          .all(status);
  res.json({ deposits: rows });
});

// Admin: duyệt yêu cầu -> cộng tiền vào balance user
router.post('/:id/approve', requireAuth, requireAdmin, (req, res) => {
  const approve = db.transaction(() => {
    const dep = db.prepare('SELECT * FROM deposits WHERE id = ?').get(req.params.id);
    if (!dep) throw new Error('Không tìm thấy yêu cầu.');
    if (dep.status !== 'pending') throw new Error('Yêu cầu này đã được xử lý.');

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(
      dep.amount,
      dep.user_id
    );
    db.prepare(
      `UPDATE deposits SET status='approved', processed_at=datetime('now'), processed_by=? WHERE id=?`
    ).run(req.user.id, dep.id);
  });

  try {
    approve();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Admin: từ chối yêu cầu
router.post('/:id/reject', requireAuth, requireAdmin, (req, res) => {
  const dep = db.prepare('SELECT * FROM deposits WHERE id = ?').get(req.params.id);
  if (!dep) return res.status(404).json({ error: 'Không tìm thấy yêu cầu.' });
  if (dep.status !== 'pending') return res.status(400).json({ error: 'Yêu cầu này đã được xử lý.' });

  db.prepare(
    `UPDATE deposits SET status='rejected', processed_at=datetime('now'), processed_by=? WHERE id=?`
  ).run(req.user.id, dep.id);
  res.json({ ok: true });
});

module.exports = router;
