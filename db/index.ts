import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

// Import all schema tables
import * as authSchema from './schema/auth';
import * as restaurantSchema from './schema/restaurant';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...authSchema,
    ...restaurantSchema,
  },
});

// Export all schema tables for easy access
export * from './schema/auth';
export * from './schema/restaurant';