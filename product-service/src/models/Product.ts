import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  images: string[];
  isFeatured: boolean;
  templateIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  imageUrl: { type: String },
  images: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  // Which product template(s) this product shows under. Empty = none (opt-in tagging).
  templateIds: [{ type: Schema.Types.ObjectId, ref: 'ProductTemplate', default: [] }]
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
