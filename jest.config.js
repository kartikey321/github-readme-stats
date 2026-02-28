export default {
  clearMocks: true,
  transform: {},
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/tests/setup.js"],
  coverageProvider: "v8",
  modulePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/tests/E2E/",
  ],
};
