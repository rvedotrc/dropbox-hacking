import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "no-irregular-whitespace": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/require-await": "off",

      // *So* many false positives...
      // and also wildly unhelpful error messages.
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      // -declaration-merging
      // -enum-comparison
      // -function-type
      "@typescript-eslint/no-unsafe-member-access": "off",
      // -return
      // -type-assertion
      // -unary-minus
    },
  },
  {
    ignores: [
      "coverage/**",
      "data/**",
      "public/dist/**",
      ".prettierrc.ts",
      "eslint.config.mjs",
      "jest.config.js",
      "webpack.config.js",
    ],
  },
);
