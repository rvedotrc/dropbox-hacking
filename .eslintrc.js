module.exports = {
  root: true,
  ignorePatterns: ["**/jest.config.js", "*.auto.ts", "*.gen.ts", "**/node_modules", "**/dist", ".yarn", ".eslintrc.js"],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "no-constant-condition": 0,
    "no-shadow": 1,
    "@typescript-eslint/ban-ts-ignore": 0,
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/explicit-module-boundary-types": ["error"],
    "@typescript-eslint/no-inferrable-types": "off",
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
