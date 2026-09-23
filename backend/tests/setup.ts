// Loaded via `tsx --import` before any test module so the Prisma singleton
// is created against TEST_DATABASE_URL instead of the development database.
import 'dotenv/config';

process.env.NODE_ENV = 'test';
