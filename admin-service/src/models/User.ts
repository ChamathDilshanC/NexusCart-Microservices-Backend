import mongoose, { Schema, Document } from 'mongoose';

// Section-level access within the admin console for an Admin account. The
// super admin always has full access regardless of this list — see
// requirePermission in middleware/auth.ts — this only matters for other
// admins. Kept in sync with auth-service's copy of this same list.
export const ADMIN_PERMISSIONS = ['products', 'orders', 'banners', 'promotions', 'settings'] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: 'Admin' | 'Customer';
  permissions: AdminPermission[];
  isVerified: boolean;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  googleId: { type: String },
  role: { type: String, enum: ['Admin', 'Customer'], default: 'Customer' },
  permissions: { type: [String], enum: ADMIN_PERMISSIONS, default: [] },
  isVerified: { type: Boolean, default: false },
  name: { type: String }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
