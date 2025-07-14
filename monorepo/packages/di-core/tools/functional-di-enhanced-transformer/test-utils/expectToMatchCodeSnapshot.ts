// tools/functional-di-enhanced-transformer/test-utils/expectToMatchCodeSnapshot.ts
import {expect} from "bun:test"
import { Project } from "ts-morph";

/**
 * Standalone utility for code snapshot testing with TypeScript formatting normalization
 */

// Create a singleton project for formatting
const formattingProject = new Project({ 
  useInMemoryFileSystem: true,
  compilerOptions: {
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    jsx: 1 // React JSX
  }
});

let fileCounter = 0;

/**
 * Normalize code using TypeScript's built-in formatting
 */
function normalizeCode(code: string): string {
  try {
    // Create a unique filename to avoid conflicts
    const fileName = `temp-${++fileCounter}.tsx`;
    
    // Parse and format the code using TypeScript
    const sourceFile = formattingProject.createSourceFile(fileName, code, { overwrite: true });
    const formatted = sourceFile.getFullText();
    
    // Clean up
    sourceFile.delete();
    
    return formatted.trim();
  } catch (error) {
    // If TypeScript parsing fails, return the original code trimmed
    console.warn('TypeScript formatting failed, using original code:', error);
    return code.trim();
  }
}

/**
 * Custom snapshot matcher that normalizes code formatting before comparison
 * 
 * Usage:
 *   expectToMatchCodeSnapshot(actualCode, 'snapshot-name');
 *   expectToMatchCodeSnapshot(actualCode); // uses default snapshot name
 */
export function expectToMatchCodeSnapshot(
  actualCode: string, 
  snapshotName?: string
): void {
  // Normalize the code using TypeScript formatting
  const normalizedCode = normalizeCode(actualCode);
  
  // Use the regular toMatchSnapshot with normalized code
  if (snapshotName) {
    expect(normalizedCode).toMatchSnapshot(snapshotName);
  } else {
    expect(normalizedCode).toMatchSnapshot();
  }
}

/**
 * Alternative version that returns the expectation for chaining
 * 
 * Usage:
 *   expectCodeSnapshot(actualCode).toMatchSnapshot('snapshot-name');
 */
export function expectCodeSnapshot(actualCode: string) {
  const normalizedCode = normalizeCode(actualCode);
  return expect(normalizedCode);
}

/**
 * Utility to just normalize code without testing (useful for debugging)
 */
export function formatCode(code: string): string {
  return normalizeCode(code);
}

/**
 * Compare two code snippets and show if they would match after normalization
 */
export function wouldCodesMatch(code1: string, code2: string): boolean {
  const normalized1 = normalizeCode(code1);
  const normalized2 = normalizeCode(code2);
  return normalized1 === normalized2;
}

/**
 * Show the normalized version of code (for debugging)
 */
export function showNormalizedCode(code: string): void {
  console.log('Normalized code:');
  console.log('================');
  console.log(normalizeCode(code));
  console.log('================');
}