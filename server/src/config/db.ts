import mongoose from 'mongoose';
import { env } from './env';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log(`[Database] Connected to primary MONGODB_URI: ${conn.connection.host}`);
    
    // Safely drop legacy indexes on salarypayments
    try {
      if (conn.connection.db) {
        const collections = await conn.connection.db.listCollections({ name: 'salarypayments' }).toArray();
        if (collections.length > 0) {
          await conn.connection.db.collection('salarypayments').dropIndexes();
          console.log('[Database] Dropped legacy indexes on salarypayments collection.');
        }
      }
    } catch (err) {
      console.warn('[Database] Ignored index drop error on primary:', err);
    }

    return conn;
  } catch (error) {
    console.warn(`[Database Notice] External MongoDB not reachable at ${env.MONGODB_URI}. Initializing persistent In-Memory MongoDB Server...`);
    try {
      const dbPath = path.join(__dirname, '../../.mongo_data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      if (!mongoMemoryServer) {
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbPath: dbPath,
            storageEngine: 'wiredTiger'
          }
        });
      }

      const mongoUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`[Database] Persistent In-Memory MongoDB running & connected at: ${mongoUri}`);

      // Safely drop legacy indexes on salarypayments
      try {
        if (conn.connection.db) {
          const collections = await conn.connection.db.listCollections({ name: 'salarypayments' }).toArray();
          if (collections.length > 0) {
            await conn.connection.db.collection('salarypayments').dropIndexes();
            console.log('[Database] Dropped legacy indexes on salarypayments collection.');
          }
        }
      } catch (err) {
        console.warn('[Database] Ignored index drop error on in-memory db:', err);
      }

      return conn;
    } catch (memError) {
      console.warn('[Database Fallback] Retrying lightweight in-memory instance without disk storage engine...', memError);
      try {
        if (!mongoMemoryServer) {
          mongoMemoryServer = await MongoMemoryServer.create();
        }
        const mongoUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(mongoUri);
        console.log(`[Database] In-Memory MongoDB Server running & connected at: ${mongoUri}`);

        // Safely drop legacy indexes on salarypayments
        try {
          if (conn.connection.db) {
            const collections = await conn.connection.db.listCollections({ name: 'salarypayments' }).toArray();
            if (collections.length > 0) {
              await conn.connection.db.collection('salarypayments').dropIndexes();
              console.log('[Database] Dropped legacy indexes on salarypayments collection.');
            }
          }
        } catch (err) {
          console.warn('[Database] Ignored index drop error on lightweight in-memory db:', err);
        }

        return conn;
      } catch (fatalErr) {
        console.error('[Database Fatal Error] Failed to initialize database server:', fatalErr);
        throw fatalErr;
      }
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
