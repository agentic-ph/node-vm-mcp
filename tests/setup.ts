/**
 * Test setup file for the MCP Server
 *
 * This file is run before all tests to set up the testing environment.
 */

import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
};

// Set up global test timeout
vi.setConfig({
  testTimeout: 10000, // 10 seconds
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Global test utilities