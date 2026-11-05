/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.test.{ts,tsx}'],
  setupFiles: ['<rootDir>/jest.polyfills.ts', '<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '\\.(css|svg|png|jpg)$': '<rootDir>/src/tests/helpers/fileMock.ts',
  },
};