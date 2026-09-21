const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

async function seed() {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const existing = await User.findOne({ username: ADMIN_USERNAME });
  if (!existing) {
    const password_hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await User.create({ username: ADMIN_USERNAME, password_hash, balance: 0, role: 'admin' });
    console.log(`✔ Đã tạo tài khoản admin: ${ADMIN_USERNAME}`);
  } else {
    console.log('ℹ Tài khoản admin đã tồn tại, bỏ qua.');
  }

  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
      { name: 'Áo thun basic', description: 'Áo thun cotton 100%, nhiều màu', price: 150000, stock: 50 },
      { name: 'Quần jean slimfit', description: 'Quần jean nam/nữ dáng slimfit', price: 350000, stock: 30 },
      { name: 'Giày sneaker trắng', description: 'Giày sneaker phong cách tối giản', price: 650000, stock: 20 },
      { name: 'Túi tote canvas', description: 'Túi tote vải canvas bền đẹp', price: 120000, stock: 40 },
      { name: 'Mũ lưỡi trai', description: 'Mũ lưỡi trai unisex', price: 90000, stock: 60 }
    ]);
    console.log('✔ Đã tạo sản phẩm mẫu.');
  } else {
    console.log('ℹ Đã có sản phẩm, bỏ qua tạo mẫu.');
  }
}

module.exports = seed;

// Cho phép chạy độc lập: node seed.js (cần đã require('dotenv').config() và connect DB trước)
if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('./db');
  connectDB()
    .then(seed)
    .then(() => { console.log('Hoàn tất.'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
