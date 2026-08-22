import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User';
import VerificationCode from '../models/VerificationCode';
import { sendOTP } from '../utils/email';
import { generateToken } from '../utils/jwt';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

// The only account that ever gets Admin automatically — see googleAuth below.
// Everyone else can only reach Admin via an existing admin promoting them
// (admin-service's updateUserRole), never through self-registration.
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'chamathdilshan.dev@gmail.com';

// register/verifyOTP and googleAuth both used to accept a client-supplied
// `role` and store it as-is — the request body is attacker-controlled, so
// nothing from it may ever reach the User document's role. 'Customer' is
// the only role a public endpoint may ever assign (the User schema's enum
// doesn't even include anything else).
function sanitizeSelfServiceRole(_role: unknown): 'Customer' {
  return 'Customer';
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check DB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Registration Error: MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Also check if there's already a pending registration for this email
    const pendingRegistration = await VerificationCode.findOne({ email, type: 'registration' });
    if (pendingRegistration) {
      return res.status(400).json({ message: 'A registration is already pending for this email. Please verify with the OTP sent earlier.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Save OTP + pending user data to DB (user is NOT created yet)
    await VerificationCode.findOneAndUpdate(
      { email },
      {
        code: otpHash,
        type: 'registration',
        pendingName: name,
        pendingPasswordHash: passwordHash,
        pendingRole: sanitizeSelfServiceRole(role),
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Send email — non-blocking
    try {
      await sendOTP(email, otp);
    } catch (emailError: any) {
      console.error('Email sending failed (pending registration saved):', emailError?.message || emailError);
    }

    res.status(201).json({ message: 'OTP sent to your email. Please verify to complete registration.' });
  } catch (error: any) {
    console.error('Registration Error:', error?.message || error);
    const message = process.env.NODE_ENV === 'production'
      ? 'Error registering user'
      : `Error registering user: ${error?.message || 'Unknown error'}`;
    res.status(500).json({ message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const record = await VerificationCode.findOne({ email, type: 'registration' });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isValid = await bcrypt.compare(otp, record.code);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Only NOW create the User in DB — after OTP is verified
    const user = new User({
      email: record.email,
      name: record.pendingName,
      passwordHash: record.pendingPasswordHash,
      role: record.pendingRole || 'Customer',
      isVerified: true
    });
    await user.save();

    // Delete the pending registration record
    await VerificationCode.deleteOne({ email, type: 'registration' });

    // Generate token and return it so user is logged in immediately
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString(), user.role);
    res.status(200).json({
      message: 'Email verified successfully. Registration complete.',
      token,
      user: { id: user._id, email: user.email, role: user.role, name: user.name, permissions: user.permissions }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
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

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please login with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Fix: Proper casting to string for TS
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString(), user.role);
    res.status(200).json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name, permissions: user.permissions } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential, role } = req.body;
    
    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    const email = payload.email;
    const name = payload.name;
    const googleId = payload.sub;
    
    // Determine Role
    let assignedRole: string = sanitizeSelfServiceRole(role);
    if (email === SUPER_ADMIN_EMAIL) {
      assignedRole = 'Admin';
    }
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (user) {
      // Update googleId if not present (they might have registered via email before)
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Google accounts are implicitly verified
      }
      // Force Admin role if they are the special user, even if they existed as Customer
      if (email === SUPER_ADMIN_EMAIL && user.role !== 'Admin') {
        user.role = 'Admin';
      }
      await user.save();
    } else {
      // Create new user
      user = new User({
        email,
        name,
        googleId,
        role: assignedRole,
        isVerified: true
      });
      await user.save();
    }

    const token = generateToken((user._id as mongoose.Types.ObjectId).toString(), user.role);
    res.status(200).json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name, permissions: user.permissions } });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: 'Error authenticating with Google' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  res.status(200).json(req.user);
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await VerificationCode.findOneAndUpdate(
      { email },
      { code: otpHash, type: 'reset', createdAt: new Date() },
      { upsert: true, new: true }
    );

    try {
      await sendOTP(email, otp, 'reset');
    } catch (emailError: any) {
      console.error('Reset email sending failed:', emailError?.message || emailError);
    }

    res.status(200).json({ message: 'Password reset OTP sent to email' });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: 'Error initiating password reset' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await VerificationCode.findOne({ email, type: 'reset' });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isValid = await bcrypt.compare(otp, record.code);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { passwordHash });
    await VerificationCode.deleteOne({ email, type: 'reset' });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};
