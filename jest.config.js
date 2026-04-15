module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Component tests use @jest-environment jsdom docblock pragma to override
  // the default node environment. jest-environment-jsdom is installed as a
  // devDependency to support this.
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
