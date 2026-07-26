import { MongoClient, Db } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Returns a connected MongoClient promise.
 * Guard is inside this function so the module can be imported at build time
 * without throwing when MONGODB_URI is not set (e.g. during next build
 * static analysis / page data collection).
 */
function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local');
  }

  if (process.env.NODE_ENV === 'development') {
    // Reuse across HMR reloads in development
    if (!global._mongoClientPromise) {
      const c = new MongoClient(uri);
      global._mongoClientPromise = c.connect();
    }
    return global._mongoClientPromise!;
  }

  // Production: new client per cold start
  const c = new MongoClient(uri);
  return c.connect();
}

export async function connectDB(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || 'confirmed_db');
}

export default { connectDB };
