import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { AdminPermission } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = { _id: decoded.id, id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'chamathdilshan.dev@gmail.com';

// Section-level gate, layered on top of authenticate. The JWT only carries
// role, not permissions (same reason updateUserRole in admin.controller.ts
// re-fetches the acting admin's record instead of trusting the token) —
// permissions can change at any time via updateUserPermissions, so this
// always checks the live DB value rather than caching it on req.user.
export const requirePermission = (permission: AdminPermission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    try {
      const user = await User.findById(req.user._id).select('email permissions');
      if (!user) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
      }
      if (user.email === SUPER_ADMIN_EMAIL || user.permissions.includes(permission)) {
        return next();
      }
      return res.status(403).json({ message: `Access denied: missing '${permission}' permission` });
    } catch (error) {
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};
