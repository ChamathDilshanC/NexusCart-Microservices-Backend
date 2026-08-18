import mongoose, { Schema, Document } from 'mongoose';

export type BannerLayout = 'carousel' | 'grid' | 'spotlight';

export interface IBannerSettings extends Document {
  layout: BannerLayout;
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
  };
  createdAt: Date;
  updatedAt: Date;
}

const BannerSettingsSchema: Schema = new Schema({
  layout: { type: String, enum: ['carousel', 'grid', 'spotlight'], default: 'carousel' },
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
    }
  }
}, { timestamps: true });

export default mongoose.model<IBannerSettings>('BannerSettings', BannerSettingsSchema);
