// eslint.config.js - TDI2 ESLint Configuration
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Import the TDI2 ESLint plugin for interface resolution context
import tdi2Plugin from "@tdi2/eslint-plugin-tdi2";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "src/.tdi2/**",
      "**/di-config.ts",
      "**/*.di-transformed.*",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "tdi2": tdi2Plugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TDI2 interface resolution context rules
      "tdi2/show-interface-resolution": "warn",
      "tdi2/show-implementation-context": "warn",
      "tdi2/show-interface-implementations": "warn",
      "tdi2/show-missing-services-context": "warn",

      // Relax TypeScript rules for DI usage
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_|^services$",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-interface": [
        "error",
        {
          allowSingleExtends: true,
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Special configuration for transformed files
  {
    files: ["**/*.di-transformed.*", "src/.tdi2/**/*"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "tdi2/show-interface-resolution": "off",
      "tdi2/show-implementation-context": "off",
      "tdi2/show-interface-implementations": "off",
    },
  }
);
