import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
  email: string;
  code: string; // hashed OTP
  type: 'registration' | 'reset';
  // Pending user data — only populated for registration type
  pendingName?: string;
  pendingPasswordHash?: string;
  pendingRole?: 'Admin' | 'Vendor' | 'Customer';
  createdAt: Date;
}

const VerificationCodeSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['registration', 'reset'], default: 'registration' },
  pendingName: { type: String },
  pendingPasswordHash: { type: String },
  pendingRole: { type: String, enum: ['Admin', 'Vendor', 'Customer'] },
  createdAt: { type: Date, default: Date.now, expires: '10m' } // TTL index, document expires in 10 mins
});

export default mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
