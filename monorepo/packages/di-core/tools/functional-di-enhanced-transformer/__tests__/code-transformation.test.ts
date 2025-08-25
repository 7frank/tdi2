// tools/functional-di-enhanced-transformer/__tests__/transformation.test.ts
import { describe, it, expect } from "bun:test";
import {
  TransformationTestFramework,
  defineTransformationTest,
} from "../test-utils/transformation-test-framework";
import * as path from "path";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

describe("Functional DI Transformation Tests", () => {
  describe("Tests that compile invalid", () => {
    it(
      "should resolve generic interface when existing",
      defineTransformationTest("1-failed-resolve", FIXTURES_DIR)
    );
  });

  // Basic inline transformations
  describe("Inline Interface Transformations", () => {
    it(
      "should transform destructured keys and types in parameters",
      defineTransformationTest("inline-destructured", FIXTURES_DIR)
    );

    it(
      "should transform inline interface with destructuring",
      defineTransformationTest("inline-with-destructuring", FIXTURES_DIR)
    );

    it(
      "should transform inline interface without destructuring",
      defineTransformationTest("inline-without-destructuring", FIXTURES_DIR)
    );

    it(
      "should transform inline interface with all required services",
      defineTransformationTest("inline-all-required", FIXTURES_DIR)
    );

    it(
      "should transform inline interface with mixed dependencies",
      defineTransformationTest("inline-mixed-deps", FIXTURES_DIR)
    );
  });

  // Separate interface transformations
  describe("Separate Interface Transformations", () => {
    it(
      "should transform component with separate interface file",
      defineTransformationTest("separate-interface", FIXTURES_DIR)
    );

    it(
      "should transform arrow function with separate interface",
      defineTransformationTest("separate-interface-arrow", FIXTURES_DIR)
    );

    it(
      "should handle imported interfaces correctly",
      defineTransformationTest("imported-interface", FIXTURES_DIR)
    );
  });

  // Edge cases
  describe("Edge Cases", () => {
    it(
      "should handle components with complex generics",
      defineTransformationTest("complex-generics", FIXTURES_DIR)
    );

    it(
      "should handle missing dependencies gracefully",
      defineTransformationTest("missing-dependencies", FIXTURES_DIR)
    );

    it(
      "should handle deeply nested destructuring",
      defineTransformationTest("deep-destructuring", FIXTURES_DIR)
    );

    it(
      "should handle more nested destucturing values",
      defineTransformationTest("destructured-services-params", FIXTURES_DIR)
    );
    
    it(
      "should handle secondary destructuring from services",
      defineTransformationTest("secondary-destructuring", FIXTURES_DIR)
    );

    it(
      "should handle nested arrow functions",
      defineTransformationTest("nested-arrow-functions", FIXTURES_DIR)
    );

    it(
      "should handle complex props spreading",
      defineTransformationTest("complex-props-spreading", FIXTURES_DIR)
    );

    it(
      "should handle conditional rendering patterns",
      defineTransformationTest("conditional-rendering", FIXTURES_DIR)
    );

    it(
      "should handle multiple components in one file",
      defineTransformationTest("multiple-components", FIXTURES_DIR)
    );

    // Complex destructuring edge cases, skipped until normalization is improved
    it.skip(
      "should handle nested destructuring with rest parameters",
      defineTransformationTest("nested-destructuring-with-rest", FIXTURES_DIR)
    );

    it.skip(
      "should handle aliasing with rest parameters and DI services",
      defineTransformationTest("aliasing-with-rest-and-di", FIXTURES_DIR)
    );

    it.skip(
      "should handle multiple rest parameters with mixed DI and non-DI",
      defineTransformationTest("multiple-rest-mixed-di", FIXTURES_DIR)
    );

    it.skip(
      "should handle default values with rest parameters and DI",
      defineTransformationTest("defaults-with-rest-and-di", FIXTURES_DIR)
    );

    it.skip(
      "should handle dynamic destructuring patterns",
      defineTransformationTest("dynamic-destructuring", FIXTURES_DIR)
    );
  });

  // Service Lifecycle and Special Cases
  describe("Service Lifecycle and Special Cases", () => {
    it(
      "should handle service lifecycle decorators",
      defineTransformationTest("service-lifecycle-decorators", FIXTURES_DIR)
    );

    it(
      "should handle non-DI services",
      defineTransformationTest("non-di-services", FIXTURES_DIR)
    );

    it(
      "should handle components with no services",
      defineTransformationTest("no-services", FIXTURES_DIR)
    );

    it(
      "should handle empty services configuration",
      defineTransformationTest("empty-services", FIXTURES_DIR)
    );
  });

  // Custom test with detailed verification
  describe("Custom Verification Tests", () => {
    it.skip("should provide detailed transformation information", async () => {
      const framework = new TransformationTestFramework({
        fixtureDir: FIXTURES_DIR,
        verbose: true,
        updateSnapshots: false,
      });

      const results = await framework.runFixtureTests("complex-component");

      expect(results).toHaveLength(1);
      const result = results[0];

      // Verify transformation structure
      expect(result.output).toContain("useService");
      expect(result.output).toContain("const services = {");
      expect(result.dependencies.length).toBeGreaterThan(0);

      // Verify specific dependencies
      const requiredDeps = result.dependencies.filter(
        (d) => d.type === "required"
      );
      const optionalDeps = result.dependencies.filter(
        (d) => d.type === "optional"
      );

      expect(requiredDeps.length).toBeGreaterThan(0);
      expect(optionalDeps.length).toBeGreaterThanOrEqual(0);
    });
  });

  // Snapshot update utility test
  describe("Snapshot Management", () => {
    it("should update snapshots when requested", async () => {
      const framework = new TransformationTestFramework({
        fixtureDir: FIXTURES_DIR,
        verbose: true,
        updateSnapshots: true, // This will update snapshots
      });

      // This test can be used to regenerate all snapshots
      const results = await framework.runFixtureTests("snapshot-update-test");
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// Example of testing with specific configuration
describe("Transformation with Custom Options", () => {
  it("should handle verbose transformation", async () => {
    const framework = new TransformationTestFramework({
      fixtureDir: FIXTURES_DIR,
      verbose: true,
      updateSnapshots: false,
    });

    const result = await framework.runSingleFixtureTest(
      path.join(FIXTURES_DIR, "verbose-example.basic.input.tsx")
    );

    expect(result.componentName).toBe("VerboseExampleComponent");
    expect(result.output).toContain("useService");
  });
});
