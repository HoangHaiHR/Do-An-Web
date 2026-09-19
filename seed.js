require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

function run() {
  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(ADMIN_USERNAME);
  if (!existing) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    db.prepare(
      'INSERT INTO users (username, password_hash, balance, role) VALUES (?, ?, ?, ?)'
    ).run(ADMIN_USERNAME, hash, 0, 'admin');
    console.log(`✔ Đã tạo tài khoản admin: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  } else {
    console.log('ℹ Tài khoản admin đã tồn tại, bỏ qua.');
  }

  const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (count === 0) {
    const products = [
      ['Áo thun basic', 'Áo thun cotton 100%, nhiều màu', 150000, 50, ''],
      ['Quần jean slimfit', 'Quần jean nam/nữ dáng slimfit', 350000, 30, ''],
      ['Giày sneaker trắng', 'Giày sneaker phong cách tối giản', 650000, 20, ''],
      ['Túi tote canvas', 'Túi tote vải canvas bền đẹp', 120000, 40, ''],
      ['Mũ lưỡi trai', 'Mũ lưỡi trai unisex', 90000, 60, '']
    ];
    const insert = db.prepare(
      'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)'
    );
    for (const p of products) insert.run(...p);
    console.log(`✔ Đã tạo ${products.length} sản phẩm mẫu.`);
  } else {
    console.log('ℹ Đã có sản phẩm, bỏ qua tạo mẫu.');
  }
}

run();
