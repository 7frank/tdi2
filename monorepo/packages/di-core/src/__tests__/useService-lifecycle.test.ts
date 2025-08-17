// Test for useService lifecycle behavior
import { describe, it, expect, jest } from "bun:test";
import React from "react";
import { renderHook, cleanup } from "@testing-library/react-hooks";
import { DIProvider, useService, useOptionalService } from "../context";
import { CompileTimeDIContainer } from "../container";
import type { OnMount, OnUnmount } from "../types";

// Mock service that implements lifecycle interfaces
class TestService implements OnMount, OnUnmount {
  value = "test";
  onMountCalled = false;
  onUnmountCalled = false;
  abortSignal: AbortSignal | null = null;

  async onMount(options?: { signal?: AbortSignal }) {
    this.onMountCalled = true;
    this.abortSignal = options?.signal || null;
  }

  async onUnmount() {
    this.onUnmountCalled = true;
  }
}

// Mock service without lifecycle interfaces
class SimpleService {
  value = "simple";
}

describe("useService Lifecycle Integration", () => {
  let container: CompileTimeDIContainer;
  let testService: TestService;
  let simpleService: SimpleService;

  beforeEach(() => {
    container = new CompileTimeDIContainer();
    testService = new TestService();
    simpleService = new SimpleService();
    
    container.register("TestService", () => testService);
    container.register("SimpleService", () => simpleService);
  });

  afterEach(() => {
    cleanup();
  });

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <DIProvider container={container}>{children}</DIProvider>
  );

  it("should call onMount when service implements OnMount interface", async () => {
    const { result, unmount } = renderHook(
      () => useService("TestService"),
      { wrapper: createWrapper }
    );

    // Service should be resolved
    expect(result.current).toBeDefined();
    expect(result.current.value).toBe("test");

    // Wait for useEffect to run
    await new Promise(resolve => setTimeout(resolve, 0));

    // onMount should have been called
    expect(testService.onMountCalled).toBe(true);
    expect(testService.abortSignal).toBeInstanceOf(AbortSignal);

    unmount();
  });

  it("should call onUnmount when component unmounts", async () => {
    const { result, unmount } = renderHook(
      () => useService("TestService"),
      { wrapper: createWrapper }
    );

    expect(result.current).toBeDefined();

    // Wait for mount effect
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(testService.onMountCalled).toBe(true);

    // Unmount component
    unmount();

    // Wait for unmount effect
    await new Promise(resolve => setTimeout(resolve, 0));

    // onUnmount should have been called
    expect(testService.onUnmountCalled).toBe(true);
  });

  it("should not call lifecycle methods for services without lifecycle interfaces", async () => {
    const { result, unmount } = renderHook(
      () => useService("SimpleService"),
      { wrapper: createWrapper }
    );

    expect(result.current).toBeDefined();
    expect(result.current.value).toBe("simple");

    // Wait for potential effects
    await new Promise(resolve => setTimeout(resolve, 0));

    // No lifecycle methods should exist
    expect((result.current as any).onMount).toBeUndefined();
    expect((result.current as any).onUnmount).toBeUndefined();

    unmount();
  });

  it("should handle lifecycle for optional services", async () => {
    const { result, unmount } = renderHook(
      () => useOptionalService("TestService"),
      { wrapper: createWrapper }
    );

    expect(result.current).toBeDefined();
    expect((result.current as any).value).toBe("test");

    // Wait for mount effect
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(testService.onMountCalled).toBe(true);

    unmount();

    // Wait for unmount effect
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(testService.onUnmountCalled).toBe(true);
  });

  it("should not call lifecycle for undefined optional services", async () => {
    const { result, unmount } = renderHook(
      () => useOptionalService("NonExistentService"),
      { wrapper: createWrapper }
    );

    expect(result.current).toBeUndefined();

    // Wait for potential effects
    await new Promise(resolve => setTimeout(resolve, 0));

    // No lifecycle should be called since service is undefined
    unmount();
  });

  it("should abort onMount signal when component unmounts", async () => {
    const { unmount } = renderHook(
      () => useService("TestService"),
      { wrapper: createWrapper }
    );

    // Wait for mount effect
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(testService.onMountCalled).toBe(true);
    expect(testService.abortSignal?.aborted).toBe(false);

    // Unmount should abort the signal
    unmount();
    
    expect(testService.abortSignal?.aborted).toBe(true);
  });
});