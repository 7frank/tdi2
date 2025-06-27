// eslint-tdi2-plugin.js - Enhanced TDI2 ESLint Plugin
// This should be a separate package or local plugin file

const tdi2Plugin = {
  rules: {
    // Enhanced rule to detect DI components and suppress missing services errors
    "detect-di-components": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Detect TDI2 DI components and handle services prop validation",
          category: "TDI2",
          recommended: true,
        },
        messages: {
          diComponentNeedsTransformer:
            'Component "{{name}}" uses DI markers but may need transformer. Run "npm run di:enhanced".',
          diComponentDetected:
            'DI component detected: "{{name}}" - services will be auto-injected.',
          servicesIgnored:
            'Services prop ignored for DI component "{{name}}" - handled by transformer.',
        },
        schema: [
          {
            type: "object",
            properties: {
              suppressMissingServicesError: {
                type: "boolean",
                default: true,
              },
              strictMode: {
                type: "boolean", 
                default: false,
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const options = context.options[0] || {};
        const suppressMissingServices = options.suppressMissingServicesError !== false;
        const strictMode = options.strictMode === true;
        
        let diComponents = new Map(); // Store component info
        let sourceCode = context.getSourceCode();

        // Helper: Check if type contains DI markers
        function containsDIMarkers(typeText) {
          if (!typeText) return false;
          return typeText.includes("Inject<") || 
                 typeText.includes("InjectOptional<") ||
                 typeText.includes("services:");
        }

        // Helper: Extract DI services from type
        function extractDIServices(typeText) {
          if (!typeText) return [];
          
          const services = [];
          const serviceMatches = typeText.matchAll(/(\w+):\s*(InjectOptional?<[^>]+>)/g);
          
          for (const match of serviceMatches) {
            services.push({
              name: match[1],
              type: match[2],
              isOptional: match[2].includes("InjectOptional"),
            });
          }
          
          return services;
        }

        // Helper: Check if function/component uses DI
        function analyzeFunction(node, name) {
          const params = node.params || [];
          if (params.length === 0) return null;

          const firstParam = params[0];
          let hasServicesWithDI = false;
          let diServices = [];

          // Check parameter type annotation
          if (firstParam.typeAnnotation && firstParam.typeAnnotation.typeAnnotation) {
            const typeText = sourceCode.getText(firstParam.typeAnnotation.typeAnnotation);
            
            if (containsDIMarkers(typeText)) {
              hasServicesWithDI = true;
              diServices = extractDIServices(typeText);
            }
          }

          if (hasServicesWithDI) {
            return {
              name: name || "AnonymousComponent",
              node,
              services: diServices,
              hasTransformerComment: sourceCode.getText().includes("TDI2-TRANSFORMED") ||
                                   sourceCode.getText().includes("Auto-generated"),
            };
          }

          return null;
        }

        return {
          // Detect function declarations with DI
          FunctionDeclaration(node) {
            const analysis = analyzeFunction(node, node.id?.name);
            if (analysis) {
              diComponents.set(analysis.name, analysis);
              
              context.report({
                node,
                messageId: analysis.hasTransformerComment ? "diComponentDetected" : "diComponentNeedsTransformer",
                data: { name: analysis.name },
              });
            }
          },

          // Detect arrow functions in variable declarations
          VariableDeclarator(node) {
            if (node.init && (node.init.type === "ArrowFunctionExpression" || 
                             node.init.type === "FunctionExpression")) {
              const analysis = analyzeFunction(node.init, node.id?.name);
              if (analysis) {
                diComponents.set(analysis.name, analysis);
                
                context.report({
                  node: node.init,
                  messageId: analysis.hasTransformerComment ? "diComponentDetected" : "diComponentNeedsTransformer",
                  data: { name: analysis.name },
                });
              }
            }
          },

          // Check JSX usage and suppress missing services errors
          JSXElement(node) {
            const elementName = node.openingElement.name.name;
            const diComponent = diComponents.get(elementName);
            
            if (diComponent && suppressMissingServices) {
              const hasServicesAttr = node.openingElement.attributes.some(
                (attr) => attr.type === "JSXAttribute" && attr.name?.name === "services"
              );

              // Don't require services prop for DI components
              if (!hasServicesAttr && !strictMode) {
                context.report({
                  node: node.openingElement,
                  messageId: "servicesIgnored",
                  data: { name: elementName },
                });
              }
            }
          },

          // Suppress TypeScript errors for missing services prop
          "Program:exit"() {
            // This runs after all nodes are processed
            // Mark DI components so other rules can ignore them
            for (const [name, component] of diComponents) {
              // Store in context for other rules to access
              if (!context.parserServices?.diComponents) {
                if (context.parserServices) {
                  context.parserServices.diComponents = new Set();
                }
              }
              if (context.parserServices?.diComponents) {
                context.parserServices.diComponents.add(name);
              }
            }
          },
        };
      },
    },

    // Rule to suppress TypeScript prop validation errors for DI components
    "suppress-di-prop-errors": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Suppress TypeScript prop errors for DI components",
          category: "TDI2",
        },
        messages: {
          ignoredForDI: "Property validation ignored for DI component",
        },
      },
      create(context) {
        return {
          JSXElement(node) {
            const elementName = node.openingElement.name.name;
            
            // Check if this is a known DI component
            const diComponents = context.parserServices?.diComponents;
            if (diComponents && diComponents.has(elementName)) {
              // This component uses DI, suppress prop validation
              const hasServicesAttr = node.openingElement.attributes.some(
                (attr) => attr.type === "JSXAttribute" && attr.name?.name === "services"
              );
              
              if (!hasServicesAttr) {
                // Add a special comment or directive to suppress TS errors
                context.report({
                  node: node.openingElement,
                  messageId: "ignoredForDI",
                  fix(fixer) {
                    // Add a comment to suppress TS errors
                    return fixer.insertTextBefore(
                      node,
                      "/* @ts-expect-error - DI component, services auto-injected */\n      "
                    );
                  },
                });
              }
            }
          },
        };
      },
    },

    // Rule to require DI transformer setup
    "require-di-transformer": {
      meta: {
        type: "problem",
        docs: {
          description: "Ensure TDI2 transformer is properly configured",
        },
        messages: {
          missingTransformerComment:
            'File uses DI but missing transformer indicator. Run "npm run di:enhanced".',
          transformerOutdated:
            'DI transformer output may be outdated. Run "npm run di:enhanced".',
        },
        schema: [
          {
            type: "object",
            properties: {
              requireTransformerComment: {
                type: "boolean",
                default: true,
              },
            },
          },
        ],
      },
      create(context) {
        const options = context.options[0] || {};
        const requireComment = options.requireTransformerComment !== false;

        return {
          Program(node) {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText();

            const usesDI = text.includes("Inject<") || 
                          text.includes("InjectOptional<") ||
                          text.includes("services:");

            if (usesDI && requireComment) {
              const hasTransformerIndicator = text.includes("TDI2-TRANSFORMED") ||
                                            text.includes("Auto-generated") ||
                                            text.includes("di-transformed");

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

    // Rule to validate DI marker usage
    "validate-di-markers": {
      meta: {
        type: "error",
        docs: {
          description: "Validate correct usage of DI markers",
        },
        messages: {
          invalidMarkerUsage: "Inject<> markers should only be used in services property",
          missingServicesProperty: "DI markers detected but no services property found",
          invalidServiceType: "Service '{{service}}' has invalid DI marker type",
        },
      },
      create(context) {
        return {
          TSTypeReference(node) {
            const sourceCode = context.getSourceCode();
            const typeText = sourceCode.getText(node);
            
            if (typeText.includes("Inject<") || typeText.includes("InjectOptional<")) {
              // Check if this is within a services property
              let parent = node.parent;
              let isInServicesProperty = false;
              
              while (parent) {
                if (parent.type === "TSPropertySignature" && 
                    parent.key && parent.key.name === "services") {
                  isInServicesProperty = true;
                  break;
                }
                parent = parent.parent;
              }
              
              if (!isInServicesProperty) {
                context.report({
                  node,
                  messageId: "invalidMarkerUsage",
                });
              }
            }
          },
        };
      },
    },
  },

  // Processor to handle .tsx files specially
  processors: {
    ".tsx": {
      preprocess(text, filename) {
        // Add special preprocessing for DI components
        if (text.includes("Inject<") || text.includes("InjectOptional<")) {
          // Mark file as using DI
          return [
            {
              text: `// TDI2-DI-FILE\n${text}`,
              filename: filename,
            },
          ];
        }
        return [{ text, filename }];
      },
      
      postprocess(messages, filename) {
        // Filter out specific TypeScript errors for DI components
        return messages[0].filter(message => {
          // Suppress "Property 'services' is missing" errors for DI components
          if (message.message && 
              message.message.includes("Property") && 
              message.message.includes("services") &&
              message.message.includes("missing")) {
            // Check if this is a DI component
            const sourceCode = message.source || "";
            if (sourceCode.includes("Inject<") || sourceCode.includes("InjectOptional<")) {
              return false; // Suppress this error
            }
          }
          
          return true; // Keep other errors
        });
      },
    },
  },
};

export default tdi2Plugin;