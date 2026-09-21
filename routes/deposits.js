const express = require('express');
const mongoose = require('mongoose');
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { amount, method, note } = req.body;
  const amt = Math.round(Number(amount));
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Số tiền không hợp lệ.' });

  const deposit = await Deposit.create({
    user: req.user.id,
    amount: amt,
    method: method || 'bank_transfer',
    note: note || '',
    status: 'pending'
  });
  res.json({ ok: true, id: deposit.id });
});

router.get('/me', requireAuth, async (req, res) => {
  const deposits = await Deposit.find({ user: req.user.id }).sort({ created_at: -1 });
  res.json({ deposits });
});

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const status = req.query.status || 'pending';
  const filter = status === 'all' ? {} : { status };
  const deposits = await Deposit.find(filter)
    .sort({ created_at: -1 })
    .populate('user', 'username');
  res.json({
    deposits: deposits.map((d) => ({ ...d.toJSON(), username: d.user?.username || '(đã xoá)' }))
  });
});

router.post('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const dep = await Deposit.findById(req.params.id).session(session);
      if (!dep) throw new Error('Không tìm thấy yêu cầu.');
      if (dep.status !== 'pending') throw new Error('Yêu cầu này đã được xử lý.');

      await User.findByIdAndUpdate(
        dep.user,
        { $inc: { balance: dep.amount } },
        { session }
      );
      dep.status = 'approved';
      dep.processed_at = new Date();
      dep.processed_by = req.user.id;
      await dep.save({ session });
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
  }
});

router.post('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const dep = await Deposit.findById(req.params.id);
  if (!dep) return res.status(404).json({ error: 'Không tìm thấy yêu cầu.' });
  if (dep.status !== 'pending') return res.status(400).json({ error: 'Yêu cầu này đã được xử lý.' });

  dep.status = 'rejected';
  dep.processed_at = new Date();
  dep.processed_by = req.user.id;
  await dep.save();
  res.json({ ok: true });
});

module.exports = router;
