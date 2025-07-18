// tools/functional-di-enhanced-transformer/__tests__/transformation.test.ts
import { describe, it, expect } from 'bun:test';
import { TransformationTestFramework, defineTransformationTest } from '../test-utils/transformation-test-framework';
import * as path from 'path';

const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

describe('Functional DI Transformation Tests', () => {
  
  // Basic inline transformations
  describe('Inline Interface Transformations', () => {

    it('should transform destructured keys and types in parameters', 
      defineTransformationTest('inline-destructured', FIXTURES_DIR)
    );
   

    it('should transform inline interface with destructuring', 
      defineTransformationTest('inline-with-destructuring', FIXTURES_DIR)
    );

    it('should transform inline interface without destructuring', 
      defineTransformationTest('inline-without-destructuring', FIXTURES_DIR)
    );

    it('should transform inline interface with all required services', 
      defineTransformationTest('inline-all-required', FIXTURES_DIR)
    );

    it('should transform inline interface with mixed dependencies', 
      defineTransformationTest('inline-mixed-deps', FIXTURES_DIR)
    );
  });

  // Separate interface transformations
  describe('Separate Interface Transformations', () => {
    it('should transform component with separate interface file', 
      defineTransformationTest('separate-interface', FIXTURES_DIR)
    );

    it('should transform arrow function with separate interface', 
      defineTransformationTest('separate-interface-arrow', FIXTURES_DIR)
    );

    it('should handle imported interfaces correctly', 
      defineTransformationTest('imported-interface', FIXTURES_DIR)
    );
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle components with complex generics', 
      defineTransformationTest('complex-generics', FIXTURES_DIR)
    );

    it('should handle missing dependencies gracefully', 
      defineTransformationTest('missing-dependencies', FIXTURES_DIR)
    );

    it('should handle deeply nested destructuring', 
      defineTransformationTest('deep-destructuring', FIXTURES_DIR)
    );
  });

  // Custom test with detailed verification
  describe('Custom Verification Tests', () => {
    it.skip('should provide detailed transformation information', async () => {
      const framework = new TransformationTestFramework({
        fixtureDir: FIXTURES_DIR,
        verbose: true,
        updateSnapshots: false
      });

      const results = await framework.runFixtureTests('complex-component');
      
      expect(results).toHaveLength(1);
      const result = results[0];
      
      // Verify transformation structure
      expect(result.output).toContain('useService');
      expect(result.output).toContain('const services = {');
      expect(result.dependencies.length).toBeGreaterThan(0);
      
      // Verify specific dependencies
      const requiredDeps = result.dependencies.filter(d => d.type === 'required');
      const optionalDeps = result.dependencies.filter(d => d.type === 'optional');
      
      expect(requiredDeps.length).toBeGreaterThan(0);
      expect(optionalDeps.length).toBeGreaterThanOrEqual(0);
    });
  });

  // Snapshot update utility test
  describe('Snapshot Management', () => {
    it.skip('should update snapshots when requested', async () => {
      const framework = new TransformationTestFramework({
        fixtureDir: FIXTURES_DIR,
        verbose: true,
        updateSnapshots: true // This will update snapshots
      });

      // This test can be used to regenerate all snapshots
      const results = await framework.runFixtureTests('snapshot-update-test');
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// Example of testing with specific configuration
describe('Transformation with Custom Options', () => {
  it.skip('should handle verbose transformation', async () => {
    const framework = new TransformationTestFramework({
      fixtureDir: FIXTURES_DIR,
      verbose: true,
      updateSnapshots: false
    });

    const result = await framework.runSingleFixtureTest(
      path.join(FIXTURES_DIR, 'verbose-example.basic.input.tsx')
    );

    expect(result.componentName).toBe('VerboseExampleComponent');
    expect(result.output).toContain('useService');
  });
});