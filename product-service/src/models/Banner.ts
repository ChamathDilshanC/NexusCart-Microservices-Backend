import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  productId?: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  templateIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String },
  // Optional: when set, the banner links straight to this product instead of linkUrl.
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  // Which banner template(s) this banner shows under. Empty = every template.
  templateIds: [{ type: Schema.Types.ObjectId, ref: 'BannerTemplate', default: [] }]
}, { timestamps: true });

export default mongoose.model<IBanner>('Banner', BannerSchema);
