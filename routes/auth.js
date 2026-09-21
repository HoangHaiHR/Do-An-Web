const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) {
      return res.status(400).json({
        error: 'Tên đăng nhập tối thiểu 3 ký tự, mật khẩu tối thiểu 6 ký tự.'
      });
    }
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại.' });

    const password_hash = bcrypt.hashSync(password, 10);
    const user = await User.create({ username, password_hash, balance: 0, role: 'user' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: user.toJSON() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: user.toJSON() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  res.json({ user: user.toJSON() });
});

module.exports = router;
