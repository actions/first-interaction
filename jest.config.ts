import type { Config } from 'jest'

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['dist', 'node_modules'],
  coverageReporters: ['json-summary', 'lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['js', 'ts'],
  preset: 'ts-jest',
  reporters: ['default', 'jest-junit'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['dist', 'node_modules'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.eslint.json' }]
  },
  verbose: true
}

export default config
