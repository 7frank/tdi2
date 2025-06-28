// tests/unit/di/context.test.tsx
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { render, renderHook, act } from "@testing-library/react";
import React from "react";

import {
  CompileTimeDIContainer,
  DIContainer,
  DIProvider,
  useDI,
  useService,
  useOptionalService,
  useServices,
  useFunctionalDI,
} from ".";

// Test service mocks
class MockLogger {
  constructor(public prefix: string = "[TEST]") {}
  log(message: string) {
    return `${this.prefix} ${message}`;
  }
}

class MockApiService {
  constructor(private logger?: MockLogger) {}

  async getData(): Promise<string[]> {
    this.logger?.log("Fetching data");
    return ["api-item-1", "api-item-2"];
  }
}

class MockEmailService {
  constructor(private logger: MockLogger, private apiService: MockApiService) {}

  async sendEmail(to: string): Promise<boolean> {
    this.logger.log(`Sending email to ${to}`);
    return true;
  }
}

// Test components
const TestComponentWithDI: React.FC = () => {
  const container = useDI();
  return (
    <div data-testid="container-available">
      {container ? "DI Available" : "No DI"}
    </div>
  );
};

const TestComponentWithService: React.FC<{ token: string }> = ({ token }) => {
  const service = useService<MockLogger>(token);
  return <div data-testid="service-result">{service.log("test message")}</div>;
};

const TestComponentWithOptionalService: React.FC<{ token: string }> = ({
  token,
}) => {
  const service = useOptionalService<MockLogger>(token);
  return (
    <div data-testid="optional-result">
      {service ? service.log("optional test") : "Service not found"}
    </div>
  );
};

const TestComponentWithMultipleServices: React.FC = () => {
  const services = useServices<{
    logger: MockLogger;
    api: MockApiService;
  }>({
    logger: "MockLogger",
    api: "MockApiService",
  });

  return (
    <div data-testid="multiple-services">
      Logger: {services.logger.log("multi-test")} | API:{" "}
      {services.api ? "Available" : "Not Available"}
    </div>
  );
};

const TestComponentWithFunctionalDI: React.FC = () => {
  const services = useFunctionalDI<{
    logger: MockLogger;
    api?: MockApiService;
  }>([
    { key: "logger", token: "MockLogger", optional: false },
    { key: "api", token: "MockApiService", optional: true },
  ]);

  return (
    <div data-testid="functional-di">
      Logger: {services.logger.log("functional")} | API:{" "}
      {services.api ? "Present" : "Missing"}
    </div>
  );
};

const TestComponentOutsideProvider: React.FC = () => {
  try {
    useDI();
    return <div data-testid="no-error">Should not reach here</div>;
  } catch (error) {
    return <div data-testid="error-caught">{(error as Error).message}</div>;
  }
};

describe("DI Context and Hooks", () => {
  let container: CompileTimeDIContainer;

  beforeEach(() => {
    container = new CompileTimeDIContainer();

    // Register test services
    container.register(
      "MockLogger",
      () => new MockLogger("[TEST]"),
      "singleton"
    );
    container.register(
      "MockApiService",
      () => new MockApiService(),
      "singleton"
    );
    container.register(
      "MockEmailService",
      () => {
        const logger = container.resolve<MockLogger>("MockLogger");
        const api = container.resolve<MockApiService>("MockApiService");
        return new MockEmailService(logger, api);
      },
      "singleton"
    );
  });

  describe("Feature: DIProvider Context Management", () => {
    describe("Given a React component tree with DIProvider", () => {
      it("When rendering with container, Then should provide DI context to children", () => {
        // Given & When
        const { getByTestId } = render(
          <DIProvider container={container}>
            <TestComponentWithDI />
          </DIProvider>
        );

        // Then
        expect(getByTestId("container-available")).toHaveTextContent(
          "DI Available"
        );
      });

      it("When rendering without explicit container, Then should create default container", () => {
        // Given & When
        const { getByTestId } = render(
          <DIProvider>
            <TestComponentWithDI />
          </DIProvider>
        );

        // Then
        expect(getByTestId("container-available")).toHaveTextContent(
          "DI Available"
        );
      });

      it("When component is outside provider, Then should throw descriptive error", () => {
        // Given & When
        const { getByTestId } = render(<TestComponentOutsideProvider />);

        // Then
        expect(getByTestId("error-caught")).toHaveTextContent(
          "useDI must be used within a DIProvider"
        );
      });
    });

    describe("Given nested DIProvider scenarios", () => {
      it("When providers are nested, Then inner provider should take precedence", () => {
        // Given
        const outerContainer = new CompileTimeDIContainer();
        const innerContainer = new CompileTimeDIContainer();

        outerContainer.register("MockLogger", () => new MockLogger("[OUTER]"));
        innerContainer.register("MockLogger", () => new MockLogger("[INNER]"));

        // When
        const { getByTestId } = render(
          <DIProvider container={outerContainer}>
            <DIProvider container={innerContainer}>
              <TestComponentWithService token="MockLogger" />
            </DIProvider>
          </DIProvider>
        );

        // Then
        expect(getByTestId("service-result")).toHaveTextContent(
          "[INNER] test message"
        );
      });
    });
  });

  describe("Feature: useDI Hook", () => {
    describe("Given a component using useDI hook", () => {
      it("When hook is called within provider, Then should return container instance", () => {
        // Given & When
        const { result } = renderHook(() => useDI(), {
          wrapper: ({ children }) => (
            <DIProvider container={container}>{children}</DIProvider>
          ),
        });

        // Then
        expect(result.current).toBe(container);
        expect(result.current).toBeInstanceOf(CompileTimeDIContainer);
      });

      it("When hook is called outside provider, Then should throw error", () => {
        // Given & When & Then
        expect(() => {
          renderHook(() => useDI());
        }).toThrow("useDI must be used within a DIProvider");
      });
    });
  });

  describe("Feature: useService Hook", () => {
    describe("Given registered services in container", () => {
      it("When resolving existing service, Then should return service instance", () => {
        // Given & When
        const { getByTestId } = render(
          <DIProvider container={container}>
            <TestComponentWithService token="MockLogger" />
          </DIProvider>
        );

        // Then
        expect(getByTestId("service-result")).toHaveTextContent(
          "[TEST] test message"
        );
      });

      it("When resolving with string token, Then should work correctly", () => {
        // Given & When
        const { result } = renderHook(
          () => useService<MockLogger>("MockLogger"),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current).toBeInstanceOf(MockLogger);
        expect(result.current.prefix).toBe("[TEST]");
      });

      it("When resolving with symbol token, Then should work correctly", () => {
        // Given
        const SYMBOL_TOKEN = Symbol("SymbolService");
        container.register(SYMBOL_TOKEN, () => new MockLogger("[SYMBOL]"));

        // When
        const { result } = renderHook(
          () => useService<MockLogger>(SYMBOL_TOKEN),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current.prefix).toBe("[SYMBOL]");
      });

      it("When resolving non-existent service, Then should throw error", () => {
        // Given & When & Then
        expect(() => {
          renderHook(() => useService("NonExistentService"), {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          });
        }).toThrow("Service not registered: NonExistentService");
      });
    });

    describe("Given service scoping behavior", () => {
      it("When resolving singleton multiple times, Then should return same instance", () => {
        // Given & When
        const { result: result1 } = renderHook(
          () => useService<MockLogger>("MockLogger"),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        const { result: result2 } = renderHook(
          () => useService<MockLogger>("MockLogger"),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result1.current).toBe(result2.current);
      });

      it("When resolving transient multiple times, Then should return different instances", () => {
        // Given
        container.register(
          "TransientLogger",
          () => new MockLogger("[TRANSIENT]"),
          "transient"
        );

        // When
        const { result: result1 } = renderHook(
          () => useService<MockLogger>("TransientLogger"),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        const { result: result2 } = renderHook(
          () => useService<MockLogger>("TransientLogger"),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result1.current).not.toBe(result2.current);
        expect(result1.current.prefix).toBe("[TRANSIENT]");
        expect(result2.current.prefix).toBe("[TRANSIENT]");
      });
    });
  });

  describe("Feature: useOptionalService Hook", () => {
    describe("Given optional service resolution", () => {
      it("When service exists, Then should return service instance", () => {
        // Given & When
        const { getByTestId } = render(
          <DIProvider container={container}>
            <TestComponentWithOptionalService token="MockLogger" />
          </DIProvider>
        );

        // Then
        expect(getByTestId("optional-result")).toHaveTextContent(
          "[TEST] optional test"
        );
      });

      it("When service does not exist, Then should return undefined", () => {
        // Given & When
        const { getByTestId } = render(
          <DIProvider container={container}>
            <TestComponentWithOptionalService token="NonExistentService" />
          </DIProvider>
        );

        // Then
        expect(getByTestId("optional-result")).toHaveTextContent(
          "Service not found"
        );
      });

      it("When using hook directly, Then should handle missing services gracefully", () => {
        // Given & When
        const { result } = renderHook(
          () => useOptionalService<MockLogger>("MissingService"),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current).toBeUndefined();
      });

      it("When service registration changes, Then should reflect updates", () => {
        // Given
        const { result, rerender } = renderHook(
          () => useOptionalService<MockLogger>("DynamicService"),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Initially should be undefined
        expect(result.current).toBeUndefined();

        // When - Register the service
        act(() => {
          container.register(
            "DynamicService",
            () => new MockLogger("[DYNAMIC]")
          );
        });

        rerender();

        // Then - Should now be available
        expect(result.current).toBeInstanceOf(MockLogger);
        expect(result.current?.prefix).toBe("[DYNAMIC]");
      });
    });

    describe("Given error handling scenarios", () => {
      it("When container.has() throws, Then should return undefined", () => {
        // Given
        const faultyContainer = {
          ...container,
          has: mock(() => {
            throw new Error("Container error");
          }),
          resolve: mock(() => new MockLogger("[FAULTY]")),
        } as unknown as DIContainer;

        // When
        const { result } = renderHook(
          () => useOptionalService<MockLogger>("TestService"),
          {
            wrapper: ({ children }) => (
              <DIProvider container={faultyContainer}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current).toBeUndefined();
      });
    });
  });

  describe("Feature: useServices Hook", () => {
    describe("Given multiple service resolution", () => {
      it("When all services exist, Then should return object with all services", () => {
        // Given & When
        const { getByTestId } = render(
          <DIProvider container={container}>
            <TestComponentWithMultipleServices />
          </DIProvider>
        );

        // Then
        const text = getByTestId("multiple-services").textContent;
        expect(text).toContain("[TEST] multi-test");
        expect(text).toContain("API: Available");
      });

      it("When using hook directly, Then should resolve all services correctly", () => {
        // Given & When
        const { result } = renderHook(
          () =>
            useServices<{
              logger: MockLogger;
              api: MockApiService;
              email: MockEmailService;
            }>({
              logger: "MockLogger",
              api: "MockApiService",
              email: "MockEmailService",
            }),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current.logger).toBeInstanceOf(MockLogger);
        expect(result.current.api).toBeInstanceOf(MockApiService);
        expect(result.current.email).toBeInstanceOf(MockEmailService);
      });

      it("When one service is missing, Then should throw for that service", () => {
        // Given & When & Then
        expect(() => {
          renderHook(
            () =>
              useServices<{
                logger: MockLogger;
                missing: any;
              }>({
                logger: "MockLogger",
                missing: "NonExistentService",
              }),
            {
              wrapper: ({ children }) => (
                <DIProvider container={container}>{children}</DIProvider>
              ),
            }
          );
        }).toThrow("Service not registered: NonExistentService");
      });

      it("When using symbol tokens, Then should work correctly", () => {
        // Given
        const LOGGER_SYMBOL = Symbol("LoggerSymbol");
        const API_SYMBOL = Symbol("ApiSymbol");

        container.register(
          LOGGER_SYMBOL,
          () => new MockLogger("[SYMBOL-LOGGER]")
        );
        container.register(API_SYMBOL, () => new MockApiService());

        // When
        const { result } = renderHook(
          () =>
            useServices<{
              logger: MockLogger;
              api: MockApiService;
            }>({
              logger: LOGGER_SYMBOL,
              api: API_SYMBOL,
            }),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current.logger.prefix).toBe("[SYMBOL-LOGGER]");
        expect(result.current.api).toBeInstanceOf(MockApiService);
      });
    });
  });

  describe("Feature: useFunctionalDI Hook", () => {
    describe("Given functional DI dependency configuration", () => {
      it("When all dependencies are available, Then should resolve correctly", () => {
        // Given & When
        const { getByTestId } = render(
          <DIProvider container={container}>
            <TestComponentWithFunctionalDI />
          </DIProvider>
        );

        // Then
        const text = getByTestId("functional-di").textContent;
        expect(text).toContain("[TEST] functional");
        expect(text).toContain("API: Present");
      });

      it("When required dependency is missing, Then should throw error", () => {
        // Given & When & Then
        expect(() => {
          renderHook(
            () =>
              useFunctionalDI<{
                logger: MockLogger;
              }>([{ key: "logger", token: "MissingLogger", optional: false }]),
            {
              wrapper: ({ children }) => (
                <DIProvider container={container}>{children}</DIProvider>
              ),
            }
          );
        }).toThrow("Service not registered: MissingLogger");
      });

      it("When optional dependency is missing, Then should handle gracefully", () => {
        // Given & When
        const { result } = renderHook(
          () =>
            useFunctionalDI<{
              logger: MockLogger;
              optional?: MockApiService;
            }>([
              { key: "logger", token: "MockLogger", optional: false },
              { key: "optional", token: "MissingOptional", optional: true },
            ]),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current.logger).toBeInstanceOf(MockLogger);
        expect(result.current.optional).toBeUndefined();
      });

      it("When mix of required and optional dependencies, Then should handle correctly", () => {
        // Given
        container.register("OptionalCache", () => ({
          get: mock(),
          set: mock(),
        }));

        // When
        const { result } = renderHook(
          () =>
            useFunctionalDI<{
              logger: MockLogger;
              api: MockApiService;
              cache?: any;
              missing?: any;
            }>([
              { key: "logger", token: "MockLogger", optional: false },
              { key: "api", token: "MockApiService", optional: false },
              { key: "cache", token: "OptionalCache", optional: true },
              { key: "missing", token: "DoesNotExist", optional: true },
            ]),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current.logger).toBeInstanceOf(MockLogger);
        expect(result.current.api).toBeInstanceOf(MockApiService);
        expect(result.current.cache).toBeDefined();
        expect(result.current.missing).toBeUndefined();
      });
    });

    describe("Given complex dependency scenarios", () => {
      it("When dependencies have their own dependencies, Then should resolve transitively", async () => {
        // Given - EmailService depends on Logger and ApiService

        // When
        const { result } = renderHook(
          () =>
            useFunctionalDI<{
              email: MockEmailService;
            }>([{ key: "email", token: "MockEmailService", optional: false }]),
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current.email).toBeInstanceOf(MockEmailService);

        // Test that transitive dependencies work
        const emailResult = await result.current.email.sendEmail(
          "test@example.com"
        );
        expect(emailResult).toBe(true);
      });
    });
  });

  describe("Feature: Hook Re-rendering and Performance", () => {
    describe("Given React re-rendering scenarios", () => {
      it("When component re-renders, Then should maintain same service instances for singletons", () => {
        // Given
        let renderCount = 0;
        const TestComponent: React.FC = () => {
          renderCount++;
          const logger = useService<MockLogger>("MockLogger");
          return (
            <div data-testid="render-count">
              {renderCount}: {logger.prefix}
            </div>
          );
        };

        // When
        const { getByTestId, rerender } = render(
          <DIProvider container={container}>
            <TestComponent />
          </DIProvider>
        );

        const firstRender = getByTestId("render-count").textContent;

        rerender(
          <DIProvider container={container}>
            <TestComponent />
          </DIProvider>
        );

        const secondRender = getByTestId("render-count").textContent;

        // Then
        expect(firstRender).toBe("1: [TEST]");
        expect(secondRender).toBe("2: [TEST]");
        // Service instance should be the same (singleton behavior)
      });

      it("When container changes, Then should use new container services", () => {
        // Given
        const newContainer = new CompileTimeDIContainer();
        newContainer.register("MockLogger", () => new MockLogger("[NEW]"));

        const TestComponent: React.FC = () => {
          const logger = useService<MockLogger>("MockLogger");
          return <div data-testid="logger-prefix">{logger.prefix}</div>;
        };

        // When
        const { getByTestId, rerender } = render(
          <DIProvider container={container}>
            <TestComponent />
          </DIProvider>
        );

        expect(getByTestId("logger-prefix")).toHaveTextContent("[TEST]");

        rerender(
          <DIProvider container={newContainer}>
            <TestComponent />
          </DIProvider>
        );

        // Then
        expect(getByTestId("logger-prefix")).toHaveTextContent("[NEW]");
      });
    });
  });

  describe("Feature: Error Boundaries and Recovery", () => {
    describe("Given error scenarios in service resolution", () => {
      it("When service constructor throws, Then should propagate error", () => {
        // Given
        container.register("ThrowingService", () => {
          throw new Error("Service construction failed");
        });

        // When & Then
        expect(() => {
          renderHook(() => useService("ThrowingService"), {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          });
        }).toThrow("Service construction failed");
      });

      it("When container itself throws, Then should propagate container error", () => {
        // Given
        const faultyContainer = {
          resolve: mock(() => {
            throw new Error("Container is broken");
          }),
          has: mock(() => true),
        } as unknown as DIContainer;

        // When & Then
        expect(() => {
          renderHook(() => useService("AnyService"), {
            wrapper: ({ children }) => (
              <DIProvider container={faultyContainer}>{children}</DIProvider>
            ),
          });
        }).toThrow("Container is broken");
      });
    });
  });

  describe("Feature: TypeScript Type Safety", () => {
    describe("Given properly typed service usage", () => {
      it("When using typed hooks, Then should maintain type safety", () => {
        // Given & When
        const { result } = renderHook(
          () => {
            const logger = useService<MockLogger>("MockLogger");
            const optionalApi =
              useOptionalService<MockApiService>("MockApiService");

            return {
              loggerType: typeof logger.log,
              loggerPrefix: logger.prefix,
              apiType: optionalApi ? typeof optionalApi.getData : undefined,
            };
          },
          {
            wrapper: ({ children }) => (
              <DIProvider container={container}>{children}</DIProvider>
            ),
          }
        );

        // Then
        expect(result.current.loggerType).toBe("function");
        expect(result.current.loggerPrefix).toBe("[TEST]");
        expect(result.current.apiType).toBe("function");
      });
    });
  });
});
