// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  if (args[0]?.includes?.('deprecated')) return; // Suppress deprecation warnings
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('deprecated')) return; // Suppress deprecation warnings
  originalConsoleWarn(...args);
};

// Set up global test utilities
global.beforeAll(() => {
  // Any global setup
});

global.afterAll(() => {
  // Any global cleanup
});

// Export test utilities
export const testUtils = {
  // Helper to wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate test JWT token
  generateTestToken: (userId = 'test-user-id', role = 'manager') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, email: 'test@example.com', role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};