module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { 
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  testMatch: [
    '**/tests/services/**/*.[jt]s?(x)',
    '**/tests/store/**/*.[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/components/',
  ],
};
