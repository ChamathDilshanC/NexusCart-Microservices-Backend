import mongoose, { Schema, Document } from 'mongoose';

export type ProductTemplateLayout = 'carousel' | 'grid' | 'spotlight' | 'sidebar' | 'showcase' | 'bento' | 'marquee';
export type ProductTemplatePosition = 'top' | 'above-grid' | 'bottom' | 'sidebar';
export type ProductTemplateSize = 'small' | 'medium' | 'large' | 'full';

export interface IProductTemplate extends Document {
  name: string;
  layout: ProductTemplateLayout;
  position: ProductTemplatePosition;
  size: ProductTemplateSize;
  isActive: boolean;
  order: number;
  // When true, this template shows every product in the catalog instead of
  // only the ones individually tagged via Product.templateIds.
  applyToAllProducts: boolean;
  // When true (grid layout only), this template's columns/rows govern the
  // main /shop catalog grid's shape instead of the built-in default. Only
  // one template can be the default grid at a time.
  isDefaultGrid: boolean;
  options: {
    carousel: {
      autoAdvance: boolean;
      intervalMs: number;
      showArrows: boolean;
      showDots: boolean;
    };
    // Unlike banner's grid (always static — banner pools are small), a
    // product grid can hold far more tagged products, so it keeps the
    // option to auto-advance through pages instead of showing everything.
    grid: {
      columns: number;
      rows: number;
      autoAdvance: boolean;
      intervalMs: number;
    };
    spotlight: {
      maxListItems: number;
    };
    sidebar: {
      autoAdvance: boolean;
      intervalMs: number;
    };
    showcase: {
      autoAdvance: boolean;
      intervalMs: number;
      showArrows: boolean;
    };
    bento: {
      featuredCount: number;
    };
    marquee: {
      speed: 'slow' | 'normal' | 'fast';
      direction: 'left' | 'right';
      pauseOnHover: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductTemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  layout: { type: String, enum: ['carousel', 'grid', 'spotlight', 'sidebar', 'showcase', 'bento', 'marquee'], default: 'grid' },
  position: { type: String, enum: ['top', 'above-grid', 'bottom', 'sidebar'], default: 'top' },
  size: { type: String, enum: ['small', 'medium', 'large', 'full'], default: 'medium' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  applyToAllProducts: { type: Boolean, default: false },
  isDefaultGrid: { type: Boolean, default: false },
  options: {
    carousel: {
      autoAdvance: { type: Boolean, default: true },
      intervalMs: { type: Number, default: 5000, min: 2000, max: 10000 },
      showArrows: { type: Boolean, default: true },
      showDots: { type: Boolean, default: true }
    },
    grid: {
      columns: { type: Number, enum: [2, 3, 4], default: 4 },
      rows: { type: Number, enum: [1, 2, 3], default: 2 },
      autoAdvance: { type: Boolean, default: true },
      intervalMs: { type: Number, default: 5000, min: 2000, max: 10000 }
    },
    spotlight: {
      maxListItems: { type: Number, default: 4, min: 1, max: 8 }
    },
    sidebar: {
      autoAdvance: { type: Boolean, default: true },
      intervalMs: { type: Number, default: 4000, min: 2000, max: 15000 }
    },
    showcase: {
      autoAdvance: { type: Boolean, default: true },
      intervalMs: { type: Number, default: 5000, min: 2000, max: 10000 },
      showArrows: { type: Boolean, default: true }
    },
    bento: {
      featuredCount: { type: Number, enum: [1, 2], default: 1 }
    },
    marquee: {
      speed: { type: String, enum: ['slow', 'normal', 'fast'], default: 'normal' },
      direction: { type: String, enum: ['left', 'right'], default: 'left' },
      pauseOnHover: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

export default mongoose.model<IProductTemplate>('ProductTemplate', ProductTemplateSchema);
