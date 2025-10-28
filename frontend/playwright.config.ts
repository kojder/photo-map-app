import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd ../backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=e2e',
      port: 8080,
      timeout: 120 * 1000,
      reuseExistingServer: true,
      env: {
        DB_HOST: 'localhost',
        DB_PORT: '5433',
        DB_NAME: 'photomap_test',
        DB_USERNAME: 'photomap_test',
        DB_PASSWORD: 'test123',
        SECURITY_ENABLED: 'true',
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'admin123',
      },
    },
    {
      command: 'npm run start',
      port: 4200,
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
  ],
});
