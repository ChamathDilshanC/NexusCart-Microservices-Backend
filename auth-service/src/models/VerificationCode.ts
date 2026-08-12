import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
  email: string;
  code: string; // hashed OTP
  createdAt: Date;
}

const VerificationCodeSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '10m' } // TTL index, document expires in 10 mins
});

export default mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
