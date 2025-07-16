// tools/functional-di-enhanced-transformer/code-generator.ts - Generates DI code

import {
  FunctionalDependency,
  TransformationOptions,
  DICodeGenerationResult,
} from "./types";

export class CodeGenerator {
  constructor(private options: TransformationOptions) {}

  /**
   * Generate DI hook calls and services object
   */
  generateDICode(dependencies: FunctionalDependency[]): DICodeGenerationResult {
    const statements: string[] = [];
    const serviceKeys: string[] = [];

    // Generate individual DI hook calls for each service
    for (const dep of dependencies) {
      if (dep.resolvedImplementation) {
        // Use the resolved implementation's sanitized key as the token
        const token = dep.resolvedImplementation.sanitizedKey;
        const hookName = dep.isOptional ? "useOptionalService" : "useService";
        statements.push(
          `            const ${dep.serviceKey} = ${hookName}('${token}');`
        );
        serviceKeys.push(dep.serviceKey);
      } else if (dep.isOptional) {
        // Optional dependency that couldn't be resolved
        statements.push(
          `            const ${dep.serviceKey} = undefined; // Optional dependency not found`
        );
        serviceKeys.push(dep.serviceKey);
      } else {
        // Required dependency that couldn't be resolved - will throw at runtime
        statements.push(
          `            const ${dep.serviceKey} = useService('${dep.sanitizedKey}') as unknown as ${dep.interfaceType};`
        );
        serviceKeys.push(dep.serviceKey);
      }
    }

    // Generate services object with individual service keys
    statements.push(
      `            const services = { ${serviceKeys.join(", ")} };`
    );

    return {
      statements,
      serviceKeys,
    };
  }

  /**
   * Generate individual service hook call
   */
  generateServiceHook(dependency: FunctionalDependency): string {
    if (dependency.resolvedImplementation) {
      const token = dependency.resolvedImplementation.sanitizedKey;
      const hookName = dependency.isOptional
        ? "useOptionalService"
        : "useService";
      return `const ${dependency.serviceKey} = ${hookName}('${token}');`;
    } else if (dependency.isOptional) {
      return `const ${dependency.serviceKey} = undefined; // Optional dependency not found`;
    } else {
      return `const ${dependency.serviceKey} = useService('${dependency.sanitizedKey}'); // Warning: implementation not found`;
    }
  }

  /**
   * Generate services object creation code
   */
  generateServicesObject(serviceKeys: string[]): string {
    return `const services = { ${serviceKeys.join(", ")} };`;
  }

  /**
   * Generate hook import statement
   */
  generateHookImport(relativePath: string): string {
    return `import { useService, useOptionalService } from '${relativePath}';`;
  }

  /**
   * Generate transformation marker comment
   */
  generateTransformationMarker(
    componentName: string,
    configHash: string
  ): string {
    return `// TDI2-TRANSFORMED: ${componentName} - Config: ${configHash} - Generated: ${new Date().toISOString()}`;
  }

  /**
   * Generate error handling for missing dependencies
   */
  generateErrorHandling(dependencies: FunctionalDependency[]): string[] {
    const errorStatements: string[] = [];

    const missingRequired = dependencies.filter(
      (dep) => !dep.resolvedImplementation && !dep.isOptional
    );

    if (missingRequired.length > 0) {
      errorStatements.push(
        `// Warning: The following required dependencies could not be resolved:`
      );
      missingRequired.forEach((dep) => {
        errorStatements.push(`// - ${dep.serviceKey}: ${dep.interfaceType}`);
      });
      errorStatements.push(
        `// These will cause runtime errors if the services are not available`
      );
    }

    return errorStatements;
  }

  /**
   * Generate debug information
   */
  generateDebugInfo(dependencies: FunctionalDependency[]): string[] {
    if (!this.options.verbose) return [];

    const debugStatements: string[] = [];
    debugStatements.push(`// DI Debug Information:`);
    debugStatements.push(`// Total dependencies: ${dependencies.length}`);

    const resolved = dependencies.filter((dep) => dep.resolvedImplementation);
    const optional = dependencies.filter((dep) => dep.isOptional);
    const missing = dependencies.filter(
      (dep) => !dep.resolvedImplementation && !dep.isOptional
    );

    debugStatements.push(
      `// Resolved: ${resolved.length}, Optional: ${optional.length}, Missing: ${missing.length}`
    );

    if (resolved.length > 0) {
      debugStatements.push(`// Resolved dependencies:`);
      resolved.forEach((dep) => {
        debugStatements.push(
          `//   ${dep.serviceKey}: ${dep.interfaceType} -> ${dep.resolvedImplementation?.implementationClass}`
        );
      });
    }

    if (missing.length > 0) {
      debugStatements.push(`// Missing dependencies:`);
      missing.forEach((dep) => {
        debugStatements.push(`//   ${dep.serviceKey}: ${dep.interfaceType}`);
      });
    }

    return debugStatements;
  }

  /**
   * Generate validation checks
   */
  generateValidationChecks(dependencies: FunctionalDependency[]): string[] {
    const validationStatements: string[] = [];

    const requiredDependencies = dependencies.filter((dep) => !dep.isOptional);

    if (requiredDependencies.length > 0) {
      validationStatements.push(
        `// Runtime validation for required dependencies`
      );
      requiredDependencies.forEach((dep) => {
        validationStatements.push(
          `if (!${dep.serviceKey}) throw new Error('Required service ${dep.serviceKey} (${dep.interfaceType}) is not available');`
        );
      });
    }

    return validationStatements;
  }

  /**
   * Generate performance monitoring
   */
  generatePerformanceMonitoring(componentName: string): string[] {
    if (!this.options.verbose) return [];

    return [
      `// Performance monitoring for ${componentName}`,
      `const diStartTime = performance.now();`,
      `React.useEffect(() => {`,
      `  const diEndTime = performance.now();`,
      `  console.log(\`DI resolution for ${componentName}: \${diEndTime - diStartTime}ms\`);`,
      `}, []);`,
    ];
  }

  /**
   * Generate complete DI transformation code
   */
  generateCompleteTransformation(
    dependencies: FunctionalDependency[],
    componentName: string,
    configHash?: string
  ): string[] {
    const allStatements: string[] = [];

    // Add transformation marker
    if (configHash) {
      allStatements.push(
        this.generateTransformationMarker(componentName, configHash)
      );
    }

    // Add debug info
    const debugInfo = this.generateDebugInfo(dependencies);
    allStatements.push(...debugInfo);

    // Add error handling comments
    const errorHandling = this.generateErrorHandling(dependencies);
    allStatements.push(...errorHandling);

    // Add main DI code
    const diCode = this.generateDICode(dependencies);
    allStatements.push(...diCode.statements);

    // Add validation checks
    const validationChecks = this.generateValidationChecks(dependencies);
    allStatements.push(...validationChecks);

    // Add performance monitoring
    const performanceMonitoring =
      this.generatePerformanceMonitoring(componentName);
    allStatements.push(...performanceMonitoring);

    return allStatements;
  }

  /**
   * Generate minimal DI transformation (production mode)
   */
  generateMinimalTransformation(
    dependencies: FunctionalDependency[]
  ): string[] {
    const diCode = this.generateDICode(dependencies);
    return diCode.statements;
  }

  /**
   * Validate generated code syntax
   */
  validateGeneratedCode(code: string[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const line of code) {
      // Basic syntax validation
      if (line.includes("const ") && !line.includes(" = ")) {
        errors.push(`Invalid const declaration: ${line}`);
      }

      if (line.includes("useService(") && !line.includes("'")) {
        errors.push(`useService call missing quotes: ${line}`);
      }

      // Check for balanced braces in services object
      if (line.includes("const services = {")) {
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push(`Unbalanced braces in services object: ${line}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
