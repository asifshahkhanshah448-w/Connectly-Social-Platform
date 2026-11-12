import jwt from 'jsonwebtoken';
import { JWT_SECRET, store, IUser, connectDB } from './db';
import User from '@/models/User';

export interface TokenPayload {
  id: string;
  username: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: { id: string; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: Request): Promise<IUser | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;

  // Try MongoDB if available
  const db = await connectDB();
  if (db) {
    try {
      const userDoc = await User.findById(payload.id).select('-password').lean();
      if (userDoc) {
        return {
          _id: (userDoc._id as string | { toString(): string }).toString(),
          name: userDoc.name,
          username: userDoc.username,
          email: userDoc.email,
          profilePicture: userDoc.profilePicture,
          bio: userDoc.bio,
          createdAt: new Date(userDoc.createdAt).toISOString(),
        };
      }
    } catch (e) {
      console.warn('Error fetching user from Mongo:', e);
    }
  }

  // Fallback to store
  const found = store?.users.find((u) => u._id === payload.id);
  if (!found) return null;
  const safeUser = { ...found };
  delete safeUser.password;
  return safeUser as IUser;
}
