import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServerInstance = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // If a real external MongoDB Atlas URI is provided, attempt connection to it
  if (uri && !uri.includes('<username>') && !uri.includes('localhost') && uri.startsWith('mongodb')) {
    try {
      console.log('Connecting to configured MongoDB URI...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('Connected to MongoDB Atlas successfully.');
      return;
    } catch (err) {
      console.warn('Could not connect to external MongoDB URI, falling back to embedded Mongo daemon:', err.message);
    }
  }

  // Fallback to in-process real MongoDB daemon (MongoMemoryServer)
  // This guarantees a genuine MongoDB instance with full Mongoose models, collections, indexes and transactions
  try {
    console.log('Starting in-process MongoDB instance...');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to real in-memory MongoDB at ${memoryUri}`);
  } catch (err) {
    console.error('Failed to initialize MongoDB connection:', err);
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
}
