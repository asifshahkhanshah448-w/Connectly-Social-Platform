import mongoose from 'mongoose';

let mongoMemoryServerInstance = null;
let cachedPromise = null;

export function connectDB() {
  // If already connected, reuse active connection immediately
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  // If a connection attempt is already in-flight, return the existing promise
  if (cachedPromise) {
    return cachedPromise;
  }

  cachedPromise = (async () => {
    const isVercel = Boolean(process.env.VERCEL);
    const isProduction = process.env.NODE_ENV === 'production' || isVercel;
    const uri = process.env.MONGODB_URI;

    let fallbackDbName;
    if (uri) {
      try {
        const parsedUri = new URL(uri);
        const cleanPath = parsedUri.pathname.replace(/^\/+/, '').trim();
        if (!cleanPath) {
          fallbackDbName = 'connectly';
        }
      } catch {
        // Leave undefined if URI uses a custom non-URL format
      }
    }

    // In production or on Vercel: strictly enforce real MongoDB Atlas connection
    if (isProduction) {
      if (!uri || uri.includes('<username>') || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
        throw new Error(
          'CRITICAL: MONGODB_URI is required in production. Please set your MongoDB Atlas connection string in Vercel Environment Variables.'
        );
      }

      console.log('Connecting to MongoDB Atlas (Production Serverless Mode)...');
      await mongoose.connect(uri, {
        ...(fallbackDbName ? { dbName: fallbackDbName } : {}),
        bufferCommands: false,
        serverSelectionTimeoutMS: 7000,
      });
      console.log('Connected to MongoDB Atlas successfully.');
      return mongoose.connection;
    }

    // Development / Local environment: Use Atlas URI if configured, else fallback to embedded Mongo
    if (uri && !uri.includes('<username>') && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))) {
      try {
        console.log('Connecting to configured MongoDB URI (Development Mode)...');
        await mongoose.connect(uri, {
          ...(fallbackDbName ? { dbName: fallbackDbName } : {}),
          serverSelectionTimeoutMS: 5000,
        });
        console.log('Connected to MongoDB successfully.');
        return mongoose.connection;
      } catch (err) {
        console.warn('Could not connect to external MongoDB URI in dev, falling back to embedded Mongo daemon:', err.message);
      }
    }

    // Fallback to in-process embedded MongoDB daemon for local offline development only
    try {
      console.log('Starting in-process MongoDB instance (Development only)...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      if (!mongoMemoryServerInstance) {
        mongoMemoryServerInstance = await MongoMemoryServer.create();
      }
      const memoryUri = mongoMemoryServerInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to local development MongoDB at ${memoryUri}`);
      return mongoose.connection;
    } catch (err) {
      console.error('Failed to initialize MongoDB connection:', err);
      throw err;
    }
  })().catch((err) => {
    cachedPromise = null;
    throw err;
  });

  return cachedPromise;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  cachedPromise = null;
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
    mongoMemoryServerInstance = null;
  }
}
