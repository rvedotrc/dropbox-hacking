module.exports = {
  root: true,
  ignorePatterns: [
    "**/jest.config.js",
    "*.auto.ts",
    "*.gen.ts",
    "**/node_modules",
    "**/dist",
    ".yarn",
    ".eslintrc.js",
    "photo-manager-client"
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    "ecmaVersion": "2017"
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "no-constant-condition": "off",
    "no-shadow": "error",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/explicit-module-boundary-types": ["error"],
    // "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "object-shorthand": "error",
    "no-unused-vars": "off",
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  }
};
