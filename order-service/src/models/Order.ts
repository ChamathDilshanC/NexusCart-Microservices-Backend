import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  customerEmail: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  // Display-only metadata: totalAmount/item.price stay in the store's base
  // currency (used for revenue totals, payment processing, etc.) — currency
  // and exchangeRate just record what the customer had selected at checkout,
  // so order emails can render in that currency instead of the base one.
  currency: { type: String, default: 'USD' },
  exchangeRate: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
