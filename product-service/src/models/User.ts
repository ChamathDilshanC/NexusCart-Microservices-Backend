import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Vendor' | 'Customer';
  isVerified: boolean;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Vendor', 'Customer'], default: 'Customer' },
  isVerified: { type: Boolean, default: false },
  name: { type: String }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
