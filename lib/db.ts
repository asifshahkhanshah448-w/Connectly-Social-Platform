import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'connectly_super_secret_jwt_key_2026';

// Global cache for Mongoose connection in Next.js
declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    return null;
  }

  if (cached && cached.conn) {
    return cached.conn;
  }

  if (cached && !cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    if (cached && cached.promise) {
      cached.conn = await cached.promise;
    }
  } catch (e) {
    if (cached) cached.promise = null;
    console.warn('MongoDB connection failed, falling back to persistent in-memory store:', e);
    return null;
  }

  return cached ? cached.conn : null;
}

// -------------------------------------------------------------
// Unified Data Types matching Mongoose Models
// -------------------------------------------------------------
export interface IUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  profilePicture: string;
  bio: string;
  createdAt: string;
}

export interface IPost {
  _id: string;
  author: string | IUser;
  content: string;
  image?: string;
  likes: string[]; // user IDs
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  post: string;
  author: string | IUser;
  content: string;
  createdAt: string;
}

export interface IFollow {
  _id: string;
  follower: string; // user ID who follows
  following: string; // user ID who is followed
  createdAt: string;
}

// -------------------------------------------------------------
// In-Memory Persistent Store (with realistic seed data)
// -------------------------------------------------------------
function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return (timestamp + random).slice(0, 24);
}

const DEFAULT_USERS: IUser[] = [
  {
    _id: '654321000000000000000001',
    name: 'Elena Rostova',
    username: 'elena_arch',
    email: 'elena@connectly.app',
    password: bcrypt.hashSync('Password123!', 10),
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Architectural designer & minimalist aesthetic curator. Seeking calm spaces in digital chaos 🌿',
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },
  {
    _id: '654321000000000000000002',
    name: 'Marcus Vance',
    username: 'marcus_v',
    email: 'marcus@connectly.app',
    password: bcrypt.hashSync('Password123!', 10),
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Urban photographer, ceramicist, and slow coffee enthusiast. Based in Copenhagen ☕️',
    createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
  },
  {
    _id: '654321000000000000000003',
    name: 'Sophia Chen',
    username: 'sophia_code',
    email: 'sophia@connectly.app',
    password: bcrypt.hashSync('Password123!', 10),
    profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    bio: 'Full-stack software engineer & typography nerd. Building thoughtful web apps.',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    _id: '654321000000000000000004',
    name: 'Julian Thorne',
    username: 'julian_t',
    email: 'julian@connectly.app',
    password: bcrypt.hashSync('Password123!', 10),
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Editorial writer & botanical explorer. Appreciating quiet afternoons and linen notebooks.',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_POSTS: IPost[] = [
  {
    _id: '754321000000000000000001',
    author: '654321000000000000000001',
    content: 'Morning light striking the concrete gallery walls in Kyoto. There is something deeply grounding about natural textures and uncluttered spaces.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    likes: ['654321000000000000000002', '654321000000000000000003'],
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    _id: '754321000000000000000002',
    author: '654321000000000000000002',
    content: 'Hand-thrown stoneware fresh out of the kiln after a slow 48-hour wood firing. Sage ash glaze creates this soft, misty celadon finish.',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80',
    likes: ['654321000000000000000001', '654321000000000000000003', '654321000000000000000004'],
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    _id: '754321000000000000000003',
    author: '654321000000000000000003',
    content: 'Refactoring our REST APIs to use clean async middleware and strict JWT claims. Beautiful code reads like poetry—minimalist, precise, without unnecessary decoration.',
    likes: ['654321000000000000000001'],
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    _id: '754321000000000000000004',
    author: '654321000000000000000004',
    content: 'Walking through the glasshouse pavilion at dawn. The morning mist over the ferns reminds me why quiet moments are essential before the day begins.',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
    likes: ['654321000000000000000002'],
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_COMMENTS: IComment[] = [
  {
    _id: '854321000000000000000001',
    post: '754321000000000000000001',
    author: '654321000000000000000002',
    content: 'The shadow gradient in this frame is breathtaking Elena. Was this taken near Arashiyama?',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    _id: '854321000000000000000002',
    post: '754321000000000000000001',
    author: '654321000000000000000003',
    content: 'Timeless architectural composition. Pure serenity.',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    _id: '854321000000000000000003',
    post: '754321000000000000000002',
    author: '654321000000000000000001',
    content: 'That celadon glaze is sublime! The mineral crackle adds such character.',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_FOLLOWS: IFollow[] = [
  {
    _id: '954321000000000000000001',
    follower: '654321000000000000000001', // Elena follows Marcus
    following: '654321000000000000000002',
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
  },
  {
    _id: '954321000000000000000002',
    follower: '654321000000000000000002', // Marcus follows Elena
    following: '654321000000000000000001',
    createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
  },
  {
    _id: '954321000000000000000003',
    follower: '654321000000000000000003', // Sophia follows Elena
    following: '654321000000000000000001',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    _id: '954321000000000000000004',
    follower: '654321000000000000000001', // Elena follows Sophia
    following: '654321000000000000000003',
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    _id: '954321000000000000000005',
    follower: '654321000000000000000004', // Julian follows Elena
    following: '654321000000000000000001',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

// Persistent state holder in memory across API route invocations
declare global {
  var connectlyStore: {
    users: IUser[];
    posts: IPost[];
    comments: IComment[];
    follows: IFollow[];
  } | undefined;
}

if (!global.connectlyStore) {
  global.connectlyStore = {
    users: [...DEFAULT_USERS],
    posts: [...DEFAULT_POSTS],
    comments: [...DEFAULT_COMMENTS],
    follows: [...DEFAULT_FOLLOWS],
  };
}

export const store = global.connectlyStore;

export function resetStore() {
  global.connectlyStore = {
    users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
    posts: JSON.parse(JSON.stringify(DEFAULT_POSTS)),
    comments: JSON.parse(JSON.stringify(DEFAULT_COMMENTS)),
    follows: JSON.parse(JSON.stringify(DEFAULT_FOLLOWS)),
  };
  return global.connectlyStore;
}

export { generateId, JWT_SECRET };
