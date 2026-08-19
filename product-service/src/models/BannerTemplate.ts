import mongoose, { Schema, Document } from 'mongoose';

export type BannerLayout = 'carousel' | 'grid' | 'spotlight' | 'sidebar' | 'showcase' | 'bento' | 'marquee';
export type BannerPosition = 'top' | 'above-grid' | 'bottom' | 'sidebar';

export interface IBannerTemplate extends Document {
  name: string;
  layout: BannerLayout;
  position: BannerPosition;
  isActive: boolean;
  order: number;
  options: {
    carousel: {
      autoAdvance: boolean;
      intervalMs: number;
      showArrows: boolean;
      showDots: boolean;
      height: 'compact' | 'standard' | 'tall';
    };
    grid: {
      columns: number;
      aspectRatio: 'landscape' | 'square';
      showSubtitle: boolean;
    };
    spotlight: {
      maxListItems: number;
      showListSubtitle: boolean;
    };
    // Small rail banners fixed to the left+right margins of the page,
    // auto-rotating through every banner tagged to this template.
    sidebar: {
      autoAdvance: boolean;
      intervalMs: number;
    };
    // A row of banners shown at once — two large ones in the center flanked
    // by smaller peeking ones, sliding by one banner at a time.
    showcase: {
      autoAdvance: boolean;
      intervalMs: number;
      showArrows: boolean;
    };
    // Asymmetric grid — the first `featuredCount` banners render as large
    // tiles, the rest fill in as smaller cells around them.
    bento: {
      featuredCount: number;
      showSubtitle: boolean;
    };
    // Continuous auto-scrolling strip of banners, looping infinitely.
    marquee: {
      speed: 'slow' | 'normal' | 'fast';
      direction: 'left' | 'right';
      pauseOnHover: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const BannerTemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  layout: { type: String, enum: ['carousel', 'grid', 'spotlight', 'sidebar', 'showcase', 'bento', 'marquee'], default: 'carousel' },
  position: { type: String, enum: ['top', 'above-grid', 'bottom', 'sidebar'], default: 'top' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  options: {
    carousel: {
      autoAdvance: { type: Boolean, default: true },
      intervalMs: { type: Number, default: 5000, min: 2000, max: 10000 },
      showArrows: { type: Boolean, default: true },
      showDots: { type: Boolean, default: true },
      height: { type: String, enum: ['compact', 'standard', 'tall'], default: 'standard' }
    },
    grid: {
      columns: { type: Number, enum: [2, 3, 4], default: 3 },
      aspectRatio: { type: String, enum: ['landscape', 'square'], default: 'landscape' },
      showSubtitle: { type: Boolean, default: true }
    },
    spotlight: {
      maxListItems: { type: Number, default: 4, min: 1, max: 8 },
      showListSubtitle: { type: Boolean, default: false }
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
      featuredCount: { type: Number, enum: [1, 2], default: 1 },
      showSubtitle: { type: Boolean, default: true }
    },
    marquee: {
      speed: { type: String, enum: ['slow', 'normal', 'fast'], default: 'normal' },
      direction: { type: String, enum: ['left', 'right'], default: 'left' },
      pauseOnHover: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

export default mongoose.model<IBannerTemplate>('BannerTemplate', BannerTemplateSchema);
