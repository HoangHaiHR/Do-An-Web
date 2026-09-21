const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const Deposit = require('../models/Deposit');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  const users = await User.find().sort({ created_at: -1 });
  res.json({ users });
});

router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  const [totalUsers, totalOrders, pendingDeposits, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Deposit.countDocuments({ status: 'pending' }),
    Order.aggregate([{ $group: { _id: null, sum: { $sum: '$total' } } }])
  ]);
  res.json({
    totalUsers,
    totalOrders,
    revenue: revenueAgg[0]?.sum || 0,
    pendingDeposits
  });
});

module.exports = router;
