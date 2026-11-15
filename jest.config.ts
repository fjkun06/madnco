import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // CSS modules: class names as plain strings (see jest/css-module.js)
    "\\.module\\.css$": "<rootDir>/jest/css-module.js",
    // `server-only` throws outside a React Server Component build; tests run
    // server modules directly, so it becomes a no-op here.
    "^server-only$": "<rootDir>/jest/empty-module.js",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/app/**",
  ],
  coverageReporters: ["text", "text-summary"],
  coveragePathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default config;
