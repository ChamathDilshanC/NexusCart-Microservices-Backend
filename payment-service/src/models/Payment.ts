import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  transactionId: { type: String, required: true, unique: true },
  paymentMethod: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
