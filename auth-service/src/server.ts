import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';

dotenv.config({ path: '../.env' }); // Assuming shared .env in root

const PORT = 5001;
const MONGODB_URI = process.env.MONGODB_URI as string;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Auth Service: Connected to MongoDB'))
    .catch((err) => console.error('Database error:', err));
}

app.listen(PORT, () => {
  console.log(`Auth Service is running on port ${PORT}`);
});
