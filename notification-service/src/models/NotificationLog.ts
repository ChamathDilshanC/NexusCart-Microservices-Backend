import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['SENT', 'SKIPPED', 'FAILED'], default: 'SENT' },
}, { timestamps: true });

export default mongoose.model('NotificationLog', notificationLogSchema);
