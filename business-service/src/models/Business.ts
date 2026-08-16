import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  vendorId: mongoose.Types.ObjectId;
  businessName: string;
  address: string;
  registrationNumber: string;
  contactNumber: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  slug: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  themeColor: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImageUrl?: string;
  categories: string[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    whatsapp?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema: Schema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true },
  address: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  coverImageUrl: { type: String, default: '' },
  themeColor: { type: String, default: '#0a0a0a' },
  bannerTitle: { type: String, default: '' },
  bannerSubtitle: { type: String, default: '' },
  bannerImageUrl: { type: String, default: '' },
  categories: [{ type: String }],
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' },
    whatsapp: { type: String, default: '' }
  }
}, { timestamps: true });

// Auto-generate slug from businessName before saving
BusinessSchema.pre('save', function(this: IBusiness, next) {
  if (this.isModified('businessName') && !this.slug) {
    this.slug = this.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

export default mongoose.model<IBusiness>('Business', BusinessSchema);
