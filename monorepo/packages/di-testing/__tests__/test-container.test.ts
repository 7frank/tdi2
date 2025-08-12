import { describe, it, expect, beforeEach } from "bun:test";
import { TestContainer } from "../src/test-container";

describe("TestContainer Edge Cases", () => {
  let container: TestContainer;

  beforeEach(() => {
    container = new TestContainer();
  });

  it("should handle mocking non-existent services", () => {
    // This should work - mocking a service that wasn't registered
    const mockImpl = { getData: () => "mock data" };
    
    // Should not throw
    expect(() => {
      container.mockService("NonExistentService", mockImpl);
    }).not.toThrow();

    // Should be able to resolve the mocked service
    const service = container.resolve<{ getData: () => string }>("NonExistentService");
    expect(service.getData()).toBe("mock data");
  });

  it("should handle restoring non-existent services", () => {
    // Should not throw when trying to restore a service that was never mocked
    expect(() => {
      container.restoreService("NonExistentService");
    }).not.toThrow();
  });

  it("should handle symbol tokens correctly", () => {
    const serviceSymbol = Symbol("TestService");
    const mockImpl = { test: () => "symbol mock" };

    container.mockService(serviceSymbol, mockImpl);
    const service = container.resolve<{ test: () => string }>(serviceSymbol);
    
    expect(service.test()).toBe("symbol mock");

    // Should be tracked in overrides
    const overrides = container.getTestOverrides();
    expect(overrides.some(o => o.token === serviceSymbol)).toBe(true);
  });

  it("should create isolated test scopes correctly", () => {
    // Setup original container with mock
    container.mockService("Service1", { value: "original" });
    
    // Create test scope
    const scope = container.createTestScope();
    
    // Override in scope
    scope.mockService("Service1", { value: "scoped" });
    
    // Original should be unchanged
    expect(container.resolve<{ value: string }>("Service1").value).toBe("original");
    expect(scope.resolve<{ value: string }>("Service1").value).toBe("scoped");
  });

  it("should track test overrides correctly", () => {
    container.mockService("Service1", { test: true });
    container.mockService("Service2", { test: false });

    const overrides = container.getTestOverrides();
    
    expect(overrides).toHaveLength(2);
    expect(overrides.map(o => String(o.token))).toContain("Service1");
    expect(overrides.map(o => String(o.token))).toContain("Service2");
  });
});