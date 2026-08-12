import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User';
import VerificationCode from '../models/VerificationCode';
import { sendOTP } from '../utils/email';
import { generateToken } from '../utils/jwt';
import mongoose from 'mongoose';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash, name, role });
    await user.save();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Save OTP to DB
    await VerificationCode.findOneAndUpdate(
      { email },
      { code: otpHash, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email
    await sendOTP(email, otp);

    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const record = await VerificationCode.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isValid = await bcrypt.compare(otp, record.code);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified
    await User.findOneAndUpdate({ email }, { isVerified: true });
    
    // Delete OTP record
    await VerificationCode.deleteOne({ email });

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Fix: Proper casting to string for TS
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString(), user.role);
    res.status(200).json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  res.status(200).json(req.user);
};
