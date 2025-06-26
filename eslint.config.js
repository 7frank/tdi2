// eslint.config.js - Updated with TDI2 rules
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Import TDI2 plugin (you'd need to create this as a separate package or local plugin)
// For now, here's a simplified inline version
const tdi2Plugin = {
  rules: {
    "detect-di-components": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Detect TDI2 DI components and warn about missing transformer",
        },
        messages: {
          diComponentNeedsTransformer:
            'Component "{{name}}" uses DI markers but services prop is missing. Ensure TDI2 transformer is running.',
          diComponentDetected:
            'DI component detected: "{{name}}" - services will be auto-injected by transformer.',
        },
      },
      create(context) {
        let diComponents = new Set();

        return {
          // Detect function components with Inject<> types
          "FunctionDeclaration, ArrowFunctionExpression"(node) {
            const sourceCode = context.getSourceCode().getText(node);
            if (
              sourceCode.includes("Inject<") ||
              sourceCode.includes("InjectOptional<")
            ) {
              const name =
                node.id?.name || node.parent?.id?.name || "AnonymousComponent";
              diComponents.add(name);
            }
          },

          // Check JSX usage
          JSXElement(node) {
            const elementName = node.openingElement.name.name;
            if (diComponents.has(elementName)) {
              const hasServicesAttr = node.openingElement.attributes.some(
                (attr) =>
                  attr.type === "JSXAttribute" && attr.name?.name === "services"
              );

              if (!hasServicesAttr) {
                context.report({
                  node: node.openingElement,
                  messageId: "diComponentNeedsTransformer",
                  data: { name: elementName },
                });
              }
            }
          },
        };
      },
    },

    "require-di-transformer": {
      meta: {
        type: "problem",
        docs: {
          description: "Ensure TDI2 transformer is properly configured",
        },
        messages: {
          missingTransformerComment:
            'File uses DI but missing transformer indicator comment. Run "npm run di:enhanced".',
        },
      },
      create(context) {
        return {
          Program(node) {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText();

            if (
              (text.includes("Inject<") || text.includes("InjectOptional<")) &&
              !text.includes("TDI2-TRANSFORMED") &&
              !text.includes("Auto-generated transformed file")
            ) {
              const comments = sourceCode.getAllComments();
              const hasTransformerIndicator = comments.some(
                (comment) =>
                  comment.value.includes("TDI2") ||
                  comment.value.includes("Auto-generated")
              );

              if (!hasTransformerIndicator) {
                context.report({
                  node,
                  messageId: "missingTransformerComment",
                  loc: { line: 1, column: 0 },
                });
              }
            }
          },
        };
      },
    },
  },
};

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
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      tdi2: tdi2Plugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TDI2 specific rules
      "tdi2/detect-di-components": "warn",
      "tdi2/require-di-transformer": "warn",

      // Disable TypeScript rules that conflict with DI transformation
      "@typescript-eslint/no-unused-vars": [
        "off",
        {
          argsIgnorePattern: "^_",
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
    },
    settings: {
      tdi2: {
        transformerRequired: true,
        debugMode: process.env.NODE_ENV === "development",
      },
    },
  }
);

// Additional configuration for transformed files
// export const transformedFilesConfig = {
//   files: ["**/*.di-transformed.*", "src/.tdi2/**/*"],
//   rules: {
//     // Disable all rules for transformed files
//     "@typescript-eslint/no-unused-vars": "off",
//     "@typescript-eslint/no-explicit-any": "off",

    
//     "tdi2/detect-di-components": "off",
//     "tdi2/require-di-transformer": "off",
//   },
// };
