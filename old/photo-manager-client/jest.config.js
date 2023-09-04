module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
    "^@components/(.*)$": "<rootDir>/src/js/components/$1",
    "^lib/(.*)$": "<rootDir>/src/lib/$1"
  },
  preset: 'ts-jest/presets/js-with-babel',
  testEnvironment: 'jsdom',
  "setupFilesAfterEnv": [
    "<rootDir>/src/jest-setup.js"
  ],
  transform: {'^.+\\.ts?$': 'ts-jest'},
};
