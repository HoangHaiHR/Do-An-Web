const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, default: 'bank_transfer' },
    note: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    processed_at: { type: Date, default: null },
    processed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

depositSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

module.exports = mongoose.model('Deposit', depositSchema);
