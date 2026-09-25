// Loaded via `tsx --import` before any test module so the Prisma singleton
// is created against TEST_DATABASE_URL instead of the development database.
import 'dotenv/config';

process.env.NODE_ENV = 'test';

// Tests run as if no installer is hosted yet, whatever the developer's .env says
// (an empty value also stops env.ts's dotenv call from filling it in).
process.env.DESKTOP_DOWNLOAD_URL = '';
