import mongoose, { Schema, Document } from 'mongoose';

export type BannerLayout = 'carousel' | 'grid' | 'spotlight';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  layouts: BannerLayout[];
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  // Which layout(s) this banner shows under. Empty = all layouts.
  layouts: { type: [String], enum: ['carousel', 'grid', 'spotlight'], default: [] }
}, { timestamps: true });

export default mongoose.model<IBanner>('Banner', BannerSchema);
