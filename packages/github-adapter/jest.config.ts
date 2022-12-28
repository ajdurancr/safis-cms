export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  clearMocks: true,

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      branches: 82,
      functions: 83,
      lines: 87,
      statements: 87,
    },
  },
  collectCoverageFrom: [
    '**.ts',
    '!**/node_modules/**',
    '!index.ts',
    '!error.ts',
    '!types.ts',
    '!zodSchema.ts',
    '!jest.config.ts',
  ],
  watchPathIgnorePatterns: [
    'jest.config.ts',
  ],
};
