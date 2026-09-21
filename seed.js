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
      {
        name: 'Áo thun basic',
        description: 'Áo thun cotton 100%, form rộng vừa, mềm mịn và thấm hút tốt. Phù hợp mặc hàng ngày hoặc phối đồ streetwear.',
        category: 'Áo',
        price: 150000,
        stock: 50,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'
      },
      {
        name: 'Quần jean slimfit',
        description: 'Quần jean dáng slimfit, chất denim co giãn nhẹ, dễ phối cùng giày sneaker hoặc boots.',
        category: 'Quần',
        price: 350000,
        stock: 30,
        image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80'
      },
      {
        name: 'Giày sneaker trắng',
        description: 'Giày sneaker phong cách tối giản, đế cao su bền, dễ kết hợp với hầu hết trang phục hàng ngày.',
        category: 'Giày',
        price: 650000,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80'
      },
      {
        name: 'Túi tote canvas',
        description: 'Túi tote vải canvas dày dặn, quai đeo chắc chắn, đủ rộng để đựng laptop 13-14 inch.',
        category: 'Túi',
        price: 120000,
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80'
      },
      {
        name: 'Mũ lưỡi trai',
        description: 'Mũ lưỡi trai unisex, có khoá điều chỉnh phía sau, phù hợp cả nam và nữ.',
        category: 'Mũ',
        price: 90000,
        stock: 60,
        image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80'
      }
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
