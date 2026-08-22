import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = { _id: decoded.id, id: decoded.id, role: decoded.role }; // map both _id and id for controller compatibility
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

// Server-to-server calls (e.g. payment-service marking an order paid after
// PayHere's webhook confirms payment) carry no customer JWT at all, so they
// authenticate with a shared secret instead of authenticate/authorizeRole.
export const authenticateInternal = (req: AuthRequest, res: Response, next: NextFunction) => {
  const key = req.header('x-internal-key');
  if (!key || key !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ message: 'Invalid internal service key' });
  }
  next();
};
