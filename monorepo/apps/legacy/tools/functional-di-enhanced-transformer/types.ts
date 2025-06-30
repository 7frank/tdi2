// tools/functional-di-enhanced-transformer/types.ts - Type definitions

import type { InterfaceImplementation } from "../interface-resolver/interface-resolver-types";

export interface FunctionalDependency {
  serviceKey: string;
  interfaceType: string;
  sanitizedKey: string;
  isOptional: boolean;
  resolvedImplementation?: InterfaceImplementation;
}

export interface TransformationOptions {
  srcDir?: string;
  outputDir?: string;
  generateDebugFiles?: boolean;
  verbose?: boolean;
  customSuffix?: string;
}

export interface DICodeGenerationResult {
  statements: string[];
  serviceKeys: string[];
}

export interface ParameterAnalysisResult {
  hasServicesProperty: boolean;
  dependencies: FunctionalDependency[];
  nonServiceProperties: string[];
}

export interface TypeResolutionContext {
  sourceFile: any; // SourceFile from ts-morph
  currentTypeName: string;
  searchedPaths: Set<string>;
}

export interface TransformationContext {
  sourceFile: any; // SourceFile from ts-morph
  componentName: string;
  dependencies: FunctionalDependency[];
  hasDestructuring: boolean;
}