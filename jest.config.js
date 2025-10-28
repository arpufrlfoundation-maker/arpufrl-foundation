const path = require('path')

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }],
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'models/**/*.ts',
    '!**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
  // Load test environment variables
  setupFiles: ['<rootDir>/tests/env-setup.js'],
  // Handle ES modules
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth/core|@auth/mongodb-adapter)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
}

module.exports = config