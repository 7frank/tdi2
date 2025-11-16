// tools/functional-di-enhanced-transformer/utils.ts - Utility functions

import { Node } from 'ts-morph';
import { FunctionalDependency, TransformationOptions } from './types';

/**
 * Check if a file should be skipped during transformation
 */
export function shouldSkipFile(
  filePath: string,
  options?: { excludePatterns?: string[]; excludeDirs?: string[]; outputDir?: string }
): boolean {
  const normalized = filePath.replace(/\\/g, '/');

  // Default patterns
  const defaultExcludePatterns = ['node_modules', '.d.ts', '.test.', '.spec.'];
  const defaultExcludeDirs = ['node_modules'];

  const excludePatterns = options?.excludePatterns || defaultExcludePatterns;
  const excludeDirs = options?.excludeDirs || defaultExcludeDirs;

  // Skip based on excludeDirs
  for (const dir of excludeDirs) {
    if (normalized.includes(`/${dir}/`) || normalized.includes(`\\${dir}\\`)) {
      return true;
    }
  }

  // Skip outputDir (generated files)
  if (options?.outputDir) {
    const normalizedOutputDir = options.outputDir.replace(/\\/g, '/');
    const outputDirName = normalizedOutputDir.split('/').pop() || '';
    if (outputDirName && normalized.includes(outputDirName)) {
      return true;
    }
  }

  // Skip based on excludePatterns
  for (const pattern of excludePatterns) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }

  // Also skip 'generated' folder (legacy behavior for backwards compatibility)
  if (normalized.includes('generated')) {
    return true;
  }

  return false;
}

/**
 * Extract component name from function or variable declaration
 */
export function extractComponentName(node: any): string {
  if (Node.isFunctionDeclaration(node)) {
    return node.getName() || 'AnonymousFunction';
  }
  
  if (Node.isVariableDeclaration(node)) {
    return node.getName() || 'AnonymousComponent';
  }
  
  return 'UnknownComponent';
}

/**
 * Check if a parameter has DI markers
 */
export function hasDIMarkers(parameterNode: any): boolean {
  const typeNode = parameterNode.getTypeNode();
  if (!typeNode) return false;
  
  const typeText = typeNode.getText();
  return typeText.includes('Inject<') || typeText.includes('InjectOptional<');
}

/**
 * Check if a type is a DI marker type
 */
export function isDIMarkerType(typeText: string): boolean {
  return /^(InjectOptional?)<.+>$/.test(typeText.trim());
}

/**
 * Extract interface name from DI marker
 */
export function extractInterfaceFromMarker(markerType: string): string | null {
  const match = markerType.match(/^(InjectOptional?)<(.+)>$/);
  return match ? match[2] : null;
}

/**
 * Check if a dependency is optional
 */
export function isOptionalDependency(markerType: string): boolean {
  return markerType.startsWith('InjectOptional<');
}

/**
 * Sanitize service key for safe usage
 */
export function sanitizeServiceKey(serviceKey: string): string {
  return serviceKey
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate unique key for dependency
 */
export function generateDependencyKey(serviceKey: string, interfaceType: string): string {
  return `${serviceKey}_${sanitizeServiceKey(interfaceType)}`;
}

/**
 * Check if transformation is needed for a component
 */
export function needsTransformation(sourceFile: any): boolean {
  const sourceText = sourceFile.getFullText();
  return sourceText.includes('Inject<') || sourceText.includes('InjectOptional<');
}

/**
 * Get file extension
 */
export function getFileExtension(filePath: string): string {
  const ext = filePath.split('.').pop();
  return ext ? `.${ext}` : '';
}

/**
 * Check if file is a React component file
 */
export function isReactComponentFile(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return ['.tsx', '.jsx'].includes(ext);
}

/**
 * Check if file is a TypeScript file
 */
export function isTypeScriptFile(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return ['.ts', '.tsx'].includes(ext);
}

/**
 * Generate transformation statistics
 */
export function generateTransformationStats(
  dependencies: FunctionalDependency[]
): {
  total: number;
  resolved: number;
  optional: number;
  missing: number;
  requiredMissing: number;
} {
  const total = dependencies.length;
  const resolved = dependencies.filter(dep => dep.resolvedImplementation).length;
  const optional = dependencies.filter(dep => dep.isOptional).length;
  const missing = dependencies.filter(dep => !dep.resolvedImplementation).length;
  const requiredMissing = dependencies.filter(dep => !dep.resolvedImplementation && !dep.isOptional).length;

  return {
    total,
    resolved,
    optional,
    missing,
    requiredMissing
  };
}

/**
 * Validate dependency configuration
 */
export function validateDependencies(dependencies: FunctionalDependency[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const dep of dependencies) {
    // Check for missing required dependencies
    if (!dep.resolvedImplementation && !dep.isOptional) {
      errors.push(`Required dependency '${dep.serviceKey}' (${dep.interfaceType}) has no implementation`);
    }

    // Check for missing optional dependencies
    if (!dep.resolvedImplementation && dep.isOptional) {
      warnings.push(`Optional dependency '${dep.serviceKey}' (${dep.interfaceType}) has no implementation`);
    }

    // Check for invalid service keys
    if (!isValidServiceKey(dep.serviceKey)) {
      errors.push(`Invalid service key '${dep.serviceKey}' - must be a valid JavaScript identifier`);
    }

    // Check for duplicate service keys
    const duplicates = dependencies.filter(d => d.serviceKey === dep.serviceKey);
    if (duplicates.length > 1) {
      errors.push(`Duplicate service key '${dep.serviceKey}' found`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if service key is valid JavaScript identifier
 */
export function isValidServiceKey(serviceKey: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(serviceKey);
}

/**
 * Generate hook name for dependency
 */
export function generateHookName(dependency: FunctionalDependency): string {
  return dependency.isOptional ? 'useOptionalService' : 'useService';
}

/**
 * Generate service token for dependency
 */
export function generateServiceToken(dependency: FunctionalDependency): string {
  return dependency.resolvedImplementation 
    ? dependency.resolvedImplementation.sanitizedKey 
    : dependency.sanitizedKey;
}

/**
 * Check if node is a React functional component
 */
export function isReactFunctionalComponent(node: any): boolean {
  if (!Node.isFunctionDeclaration(node) && !Node.isArrowFunction(node)) {
    return false;
  }

  // Check if it returns JSX
  const body = Node.isFunctionDeclaration(node) ? node.getBody() : node.getBody();
  if (!body) return false;

  const bodyText = body.getText();
  return bodyText.includes('return') && (
    bodyText.includes('<') || 
    bodyText.includes('React.createElement') ||
    bodyText.includes('jsx')
  );
}

/**
 * Extract JSX elements from component body
 */
export function extractJSXElements(body: any): string[] {
  const bodyText = body.getText();
  const jsxElements: string[] = [];
  
  // Simple regex to find JSX elements (basic implementation)
  const jsxPattern = /<(\w+)[^>]*>/g;
  let match;
  
  while ((match = jsxPattern.exec(bodyText)) !== null) {
    jsxElements.push(match[1]);
  }
  
  return [...new Set(jsxElements)]; // Remove duplicates
}

/**
 * Generate import path for DI context
 */
export function generateDIContextImportPath(currentFilePath: string, srcDir: string): string {
  const path = require('path');
  const currentDir = path.dirname(currentFilePath);
  const diContextPath = path.join(srcDir, 'di', 'context');
  
  const relativePath = path.relative(currentDir, diContextPath)
    .replace(/\\/g, '/');
  
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

/**
 * Check if import already exists in source file
 */
export function hasImport(sourceFile: any, moduleSpecifier: string, importName?: string): boolean {
  const imports = sourceFile.getImportDeclarations();
  
  for (const importDecl of imports) {
    if (importDecl.getModuleSpecifierValue() === moduleSpecifier) {
      if (!importName) return true;
      
      const namedImports = importDecl.getNamedImports();
      return namedImports.some((ni: any) => ni.getName() === importName);
    }
  }
  
  return false;
}

/**
 * Get relative path between two files
 */
export function getRelativePath(from: string, to: string): string {
  const path = require('path');
  return path.relative(path.dirname(from), to).replace(/\\/g, '/');
}

/**
 * Normalize file path for cross-platform compatibility
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Check if path is relative import
 */
export function isRelativeImport(modulePath: string): boolean {
  return modulePath.startsWith('./') || modulePath.startsWith('../');
}

/**
 * Extract directory from file path
 */
export function getDirectory(filePath: string): string {
  const path = require('path');
  return path.dirname(filePath);
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const path = require('path');
  const basename = path.basename(filePath);
  return basename.replace(/\.[^/.]+$/, "");
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  const fs = require('fs');
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Deep clone object (simple implementation)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Create safe identifier from string
 */
export function createSafeIdentifier(input: string): string {
  return input
    .replace(/[^\w]/g, '_')
    .replace(/^(\d)/, '_$1') // Ensure doesn't start with number
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Format bytes for human reading
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Generate timestamp string
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create hash from string (simple implementation)
 */
export function createHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(null, args);
    }, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}