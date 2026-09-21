const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password_hash: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password_hash;
  }
});

module.exports = mongoose.model('User', userSchema);
