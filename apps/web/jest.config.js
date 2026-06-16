const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
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
});
