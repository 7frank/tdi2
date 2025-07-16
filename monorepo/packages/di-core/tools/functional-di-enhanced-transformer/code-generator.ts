// tools/functional-di-enhanced-transformer/code-generator.ts - Generates DI code

import { ExtractedDependency } from "../shared/SharedDependencyExtractor";
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
  generateDICode(dependencies: ExtractedDependency[]): DICodeGenerationResult {
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
}
