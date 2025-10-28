const path = require('path')

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/components'],
  testMatch: ['**/?(*.)+(spec|test).tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
  },
  collectCoverageFrom: [
    'components/**/*.tsx',
    '!**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-components.ts'],
  testTimeout: 10000,
  // Handle ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(next|@next)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}

module.exports = config