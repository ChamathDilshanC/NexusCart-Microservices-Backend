import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  baseCurrency: string;
  supportedCurrencies: string[];
}

const SettingsSchema: Schema = new Schema({
  baseCurrency: { type: String, default: 'USD' },
  supportedCurrencies: { type: [String], default: ['USD', 'LKR', 'EUR', 'GBP', 'INR', 'AUD'] }
}, { timestamps: true });

export default mongoose.model<ISettings>('Settings', SettingsSchema);
