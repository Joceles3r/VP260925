/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
        },
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
  ],
  collectCoverageFrom: [
    'server/**/*.ts',
    'shared/**/*.ts',
    'client/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.config.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  verbose: true,
  // Timeout pour tests longs
  testTimeout: 10000,
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
