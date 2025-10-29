import { test as base } from '@playwright/test';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'photomap_test',
  user: process.env.DB_USERNAME || 'photomap_test',
  password: process.env.DB_PASSWORD || 'test123',
};

async function seedTestUsers(client: Client) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is not set');
  }

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(process.env.TEST_USER_PASSWORD || 'user123', 10);

  await client.query(`
    INSERT INTO users (email, password_hash, role, can_view_photos, can_rate, created_at)
    VALUES
      ('admin@example.com', $1, 'ADMIN', true, true, NOW()),
      ('user@example.com', $2, 'USER', true, true, NOW())
    ON CONFLICT (email) DO NOTHING
  `, [adminHash, userHash]);
}

export const test = base.extend({
  db: async ({}, use) => {
    const client = new Client(testDbConfig);
    await client.connect();

    await client.query('TRUNCATE ratings, photos, users RESTART IDENTITY CASCADE');

    await seedTestUsers(client);

    await use(client);

    await client.end();
  },
});

export { expect } from '@playwright/test';
