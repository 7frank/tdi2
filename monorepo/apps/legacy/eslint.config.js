// eslint.config.js - Updated with enhanced TDI2 rules
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Import the enhanced TDI2 plugin
import tdi2Plugin from "./eslint-tdi2-plugin.js";

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

      // Enhanced TDI2 specific rules
      "tdi2/detect-di-components": [
        "warn",
        {
          suppressMissingServicesError: true,
          strictMode: false, // Set to true for stricter validation
        },
      ],
      "tdi2/suppress-di-prop-errors": "off", // Use with caution
      "tdi2/require-di-transformer": [
        "warn",
        {
          requireTransformerComment: false, // Set to true in CI/production
        },
      ],
      "tdi2/validate-di-markers": "error",

      // Disable TypeScript rules that conflict with DI transformation
      "@typescript-eslint/no-unused-vars": [
        "off",
        {
          argsIgnorePattern: "^_|^services$", // Ignore 'services' parameter
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Allow any types in DI contexts (they're resolved at runtime)
      "@typescript-eslint/no-explicit-any": [
        "off",
        {
          ignoreRestArgs: true,
        },
      ],

      // Relax some rules for DI-related code
      "@typescript-eslint/no-empty-interface": [
        "error",
        {
          allowSingleExtends: true, // Allow marker interfaces
        },
      ],

      // Allow unused parameters in DI service constructors
      "@typescript-eslint/no-unused-parameters": [
        "off",
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_|services",
        },
      ],
    },
    settings: {
      tdi2: {
        transformerRequired: true,
        debugMode: process.env.NODE_ENV === "development",
        suppressMissingServicesErrors: true, // Global setting
      },
      react: {
        version: "detect",
      },
    },
  },
  // Special configuration for transformed files
  {
    files: ["**/*.di-transformed.*", "src/.tdi2/**/*"],
    rules: {
      // Disable all problematic rules for transformed files
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-parameters": "off",
      "tdi2/detect-di-components": "off",
      "tdi2/require-di-transformer": "off",
      "tdi2/validate-di-markers": "off",
    },
  },
  // Special configuration for App.tsx and component files
  {
    files: ["src/App.tsx", "src/components/**/*.{ts,tsx}"],
    rules: {
      // More lenient rules for components using DI
      "@typescript-eslint/no-unused-vars": [
        "off",
        {
          varsIgnorePattern: "^(SERVICES|services)$",
          argsIgnorePattern: "^(services|_)",
        },
      ],
    },
  }
);

// Additional processors for better DI handling
export const diProcessorConfig = {
  files: ["**/*.tsx"],
  processor: "tdi2/.tsx", // Use the TDI2 processor
};