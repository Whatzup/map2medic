import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import dotenv from 'dotenv';

dotenv.config();

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool
export const createPool = () => {
  if (!global._postgresPool) {
    const connString = process.env.DATABASE_URL;

    if (connString && connString.trim().length > 0 && !connString.includes('user:password@host')) {
      console.log('Connecting to PostgreSQL via DATABASE_URL...');
      global._postgresPool = new Pool({
        connectionString: connString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 5000,
      });
    } else if (process.env.SQL_HOST && process.env.SQL_HOST.trim().length > 0) {
      console.log('Connecting to PostgreSQL via SQL_HOST configuration...');
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME || 'postgres',
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        max: 10,
        connectionTimeoutMillis: 5000,
      });
    } else {
      console.log('No active PostgreSQL configuration detected. In-memory mode active.');
      global._postgresPool = new Pool({
        host: '0.0.0.0',
        port: 59999,
        connectionTimeoutMillis: 1000,
      });
    }

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (_err) => {
      // Suppress unhandled idle pool errors from crashing the server
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

