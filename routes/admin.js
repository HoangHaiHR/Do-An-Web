const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = db
    .prepare('SELECT id, username, role, balance, created_at FROM users ORDER BY id DESC')
    .all();
  res.json({ users });
});

router.get('/stats', requireAuth, requireAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const totalOrders = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(total),0) s FROM orders").get().s;
  const pendingDeposits = db
    .prepare("SELECT COUNT(*) c FROM deposits WHERE status='pending'").get().c;
  res.json({ totalUsers, totalOrders, revenue, pendingDeposits });
});

module.exports = router;
