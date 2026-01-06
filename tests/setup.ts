/**
 * Test Setup
 * Global test configuration and utilities
 */

// Increase default timeout for generation tests
jest.setTimeout(120000); // 2 minutes

// Add custom matchers if needed
expect.extend({
  toBeValidUrl(received: string) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false
      };
    }
  },

  toBeValidCdnId(received: string) {
    const pass = typeof received === 'string' && received.length > 0;
    return {
      message: () => pass
        ? `expected ${received} not to be a valid CDN ID`
        : `expected ${received} to be a valid CDN ID`,
      pass
    };
  }
});

// Type declarations are in matchers.d.ts
