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
  paymentMethod: { type: String, required: true },
  // PayHere's raw status_code from the IPN notify call (e.g. "2" = success,
  // "-1" = cancelled, "-2" = failed) — kept for support/debugging.
  gatewayStatusCode: { type: String }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
