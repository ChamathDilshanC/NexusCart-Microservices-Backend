import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement {
  type: 'IN' | 'OUT';
  quantity: number;
  note?: string;
  createdAt: Date;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  stockHistory: IStockMovement[];
  category: string;
  imageUrl?: string;
  images: string[];
  isFeatured: boolean;
  templateIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  // Capped to the most recent 50 adjustments (see adjustStock) — a running
  // log, not a full audit trail.
  stockHistory: { type: [stockMovementSchema], default: [] },
  category: { type: String, required: true },
  imageUrl: { type: String },
  images: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  // Which product template(s) this product shows under. Empty = none (opt-in tagging).
  templateIds: [{ type: Schema.Types.ObjectId, ref: 'ProductTemplate', default: [] }]
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
