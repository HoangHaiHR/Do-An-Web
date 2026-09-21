const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Thiếu MONGODB_URI trong file .env — xem README.md để lấy connection string từ MongoDB Atlas.'
    );
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('✔ Đã kết nối MongoDB');
}

module.exports = connectDB;
