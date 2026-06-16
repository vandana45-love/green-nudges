const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });

const customConfig = {
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
  ],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/components/**/*.tsx",
    "!src/**/*.d.ts",
  ],
};

// Async config: merge our setup file AFTER next/jest adds its own entries
module.exports = async () => {
  const config = await createJestConfig(customConfig)();
  return {
    ...config,
    setupFilesAfterEach: [
      ...(config.setupFilesAfterEach ?? []),
      "<rootDir>/jest.setup.ts",
    ],
  };
};
