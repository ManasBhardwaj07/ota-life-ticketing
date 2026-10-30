/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: false,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\./.*)\\.js$": "$1",
    "^(\\.\\./.*)\\.js$": "$1",
  },
};
