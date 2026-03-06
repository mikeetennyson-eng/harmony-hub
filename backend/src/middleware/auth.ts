import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';

interface AuthRequest extends Request {
  user?: any;
}

const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Auth middleware - checking token');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.log('Auth failed: No token provided');
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log('Auth failed: User not found');
      res.status(401).json({ message: 'User not found' });
      return;
    }

    console.log('Auth success: User', user._id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};

export { auth, adminAuth };
export default auth;