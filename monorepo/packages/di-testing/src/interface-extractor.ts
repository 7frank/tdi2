// Simple interface extractor for testing framework
// Extracts interface types from MockedService<T> property declarations

import { Project, SourceFile, ClassDeclaration } from "ts-morph";

export interface MockBeanInterface {
  propertyName: string;
  interfaceType: string;
  isOptional: boolean;
}

/**
 * Simple interface extractor for testing @MockBean properties
 * Analyzes test class TypeScript source to extract interface types
 */
export class TestInterfaceExtractor {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        target: 99, // Latest
      },
    });
  }

  /**
   * Extract interface types from @MockBean properties in test class source
   */
  extractMockBeanInterfaces(classSource: string, className: string): MockBeanInterface[] {
    try {
      // Create source file from class source
      const sourceFile = this.project.createSourceFile("test.ts", classSource);
      
      // Find the test class
      const classDecl = sourceFile.getClass(className);
      if (!classDecl) {
        return [];
      }

      const interfaces: MockBeanInterface[] = [];

      // Analyze each property for MockedService<T> types
      for (const property of classDecl.getProperties()) {
        const propertyName = property.getName();
        const typeNode = property.getTypeNode();
        
        if (typeNode) {
          const typeText = typeNode.getText();
          
          // Look for MockedService<InterfaceType> pattern
          const mockServiceMatch = typeText.match(/MockedService<(.+)>/);
          if (mockServiceMatch) {
            const interfaceType = mockServiceMatch[1];
            const isOptional = property.hasQuestionToken();
            
            interfaces.push({
              propertyName,
              interfaceType,
              isOptional
            });
          }
        }
      }

      return interfaces;
    } catch (error) {
      console.warn("Failed to extract interfaces from test class:", error);
      return [];
    }
  }

  /**
   * Extract interface name from generic type
   * e.g. "UserServiceInterface" from "MockedService<UserServiceInterface>"
   */
  extractInterfaceName(genericType: string): string | null {
    const match = genericType.match(/MockedService<(.+)>/);
    return match ? match[1] : null;
  }

  /**
   * Convert interface type to service key
   * e.g. "UserServiceInterface" -> "UserService" or "userService"
   */
  interfaceToServiceKey(interfaceType: string, propertyName: string): string {
    // Use property name as service key - this follows the interface-based DI pattern
    // where the property name in the component matches the service identity
    return propertyName;
  }
}