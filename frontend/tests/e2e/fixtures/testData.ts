export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || '',
    role: 'ADMIN',
  },
  regularUser: {
    email: 'user@example.com',
    password: process.env.TEST_USER_PASSWORD || 'user123',
    role: 'USER',
  },
};

export const BASE_URL = 'http://localhost:4200';
export const API_BASE_URL = 'http://localhost:8080';
