import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  vendorId: mongoose.Types.ObjectId;
  businessName: string;
  address: string;
  registrationNumber: string;
  contactNumber: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema: Schema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true },
  address: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model<IBusiness>('Business', BusinessSchema);
