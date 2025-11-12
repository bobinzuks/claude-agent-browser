/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jsdom|parse5)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts' // Entry points excluded
  ],
  coverageThreshold: {
    global: {
      branches: 63,
      functions: 68,
      lines: 72,
      statements: 72
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  collectCoverage: false, // Enable with --coverage flag
  testTimeout: 10000
};
