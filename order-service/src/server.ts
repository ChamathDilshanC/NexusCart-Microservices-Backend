import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';

dotenv.config({ path: '../.env' });

const PORT = 5005;
const MONGODB_URI = process.env.MONGODB_URI as string;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('order-service: Connected to MongoDB'))
    .catch((err) => console.error('Database error:', err));
}

app.listen(PORT, () => {
  console.log(`order-service is running on port ${PORT}`);
});
