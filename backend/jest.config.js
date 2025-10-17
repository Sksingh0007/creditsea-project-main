module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "models/**/*.js",
    "routes/**/*.js",
    "utils/**/*.js",
    "!node_modules/**",
    "!tests/**",
  ],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
