import mongoose, { Schema, Document } from 'mongoose';

export type ProductTemplatePosition = 'top' | 'above-grid' | 'bottom';

export interface IProductTemplate extends Document {
  name: string;
  position: ProductTemplatePosition;
  autoAdvance: boolean;
  intervalMs: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductTemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  position: { type: String, enum: ['top', 'above-grid', 'bottom'], default: 'top' },
  autoAdvance: { type: Boolean, default: true },
  intervalMs: { type: Number, default: 5000, min: 2000, max: 10000 },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IProductTemplate>('ProductTemplate', ProductTemplateSchema);
