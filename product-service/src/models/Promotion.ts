import mongoose, { Schema, Document } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';
export type PromotionScope = 'all' | 'category' | 'products';

export interface IPromotion extends Document {
  name: string;
  discountType: DiscountType;
  discountValue: number;
  scope: PromotionScope;
  category?: string;
  productIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema: Schema = new Schema({
  name: { type: String, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  scope: { type: String, enum: ['all', 'category', 'products'], required: true },
  category: { type: String },
  productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);
