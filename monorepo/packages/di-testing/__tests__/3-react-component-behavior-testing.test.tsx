/**
 * @fileoverview React Behavior Testing with Service Injection Control
 * 
 * This test file demonstrates behavior-first testing that combines React Testing Library's
 * user-centric approach with TDI2's deterministic service control. It focuses on testing
 * what users see and do while maintaining precise control over service dependencies.
 * 
 * ## When to Use This Testing Pattern
 * 
 * Use behavior-first testing with DI control when:
 * 
 * 1. **User Experience Testing**: You need to verify the actual user experience and
 *    accessibility of components while controlling service behavior
 * 
 * 2. **Integration Testing**: Testing complete user workflows that span UI interactions
 *    and service orchestration without network dependencies
 * 
 * 3. **Acceptance Testing**: Writing tests that match acceptance criteria and user stories
 *    while maintaining fast, deterministic execution
 * 
 * 4. **Complex UI Logic**: Testing components with rich interactions, loading states,
 *    error handling, and conditional rendering based on service responses
 * 
 * 5. **Accessibility Compliance**: Ensuring components work correctly with screen readers
 *    and keyboard navigation while having controlled service responses
 * 
 * ## What This Tests vs Other Testing Approaches
 * 
 * **Behavior Testing with DI Control** (This approach):
 * - Tests user-observable behavior with deterministic service responses
 * - Combines DOM assertions with service interaction verification  
 * - Focuses on "what the user sees" AND "how services are orchestrated"
 * - Uses accessibility roles and user interactions as primary test interface
 * - Fast execution with no network calls but full UI rendering
 * 
 * **Pure Service Testing** (testing-api-example.test.ts):
 * - Tests business logic without any UI concerns
 * - Fast execution, no DOM rendering
 * - Pure service-to-service interaction testing
 * 
 * **Component Service Testing** (react-component-service-testing.test.tsx):
 * - Tests service orchestration with minimal UI verification
 * - Focuses on service calls rather than user experience
 * - Good for testing component's role as service coordinator
 * 
 * **Traditional RTL + MSW**:
 * - Tests user behavior with network-level mocking
 * - Slower execution due to network simulation
 * - Less deterministic due to network timing and edge cases
 * 
 * ## Key Benefits of This Approach
 * 
 * - **User-Centric**: Tests focus on user-observable behavior and accessibility
 * - **Deterministic**: Service responses are controlled, eliminating flaky network tests
 * - **Fast Feedback**: No network calls or backend dependencies, but full UI rendering
 * - **Comprehensive**: Covers both user experience AND service orchestration
 * - **Maintainable**: Tests break when user experience changes, not implementation details
 * - **Accessible**: Forces testing through accessibility APIs (roles, labels, etc.)
 * - **Enterprise Ready**: Combines familiar RTL patterns with enterprise DI testing
 * 
 * ## TDI2 + RTL Integration Features Demonstrated
 * 
 * - `renderWithDI()`: Helper that combines RTL render with DI service injection
 * - `given()`: Fluent API for setting up service mock behavior (cleaner than __mock__)
 * - `@MockBean` with full DOM rendering and user interactions
 * - `verify()` assertions AFTER user behavior verification
 * - Accessibility-first test queries (roles, labels, descriptions)
 * - Loading states, error handling, and conditional UI testing
 * 
 * ## Testing Patterns Shown
 * 
 * - **Happy Path Behavior**: Users complete tasks successfully with expected UI feedback
 * - **Error State Handling**: Users see appropriate error messages and UI states
 * - **Loading State Management**: UI shows loading indicators and prevents duplicate actions
 * - **Input Validation**: User input handling and form submission behavior
 * - **Accessibility Testing**: Screen reader compatibility and keyboard navigation
 * - **Race Condition Prevention**: Multiple clicks/submissions are handled gracefully
 * 
 * ## Best Practices Demonstrated
 * 
 * 1. **Test user behavior FIRST**, then verify service calls
 * 2. **Use accessibility queries** (roles, labels) as primary selectors
 * 3. **Setup service behavior with `given()`** before user interactions
 * 4. **Assert DOM state changes** that users would observe
 * 5. **Verify service interactions** to ensure proper orchestration
 * 6. **Test error boundaries** and edge cases users might encounter
 * 
 * This approach provides the most comprehensive testing coverage by combining
 * user experience verification with deterministic service control. Use this
 * for critical user workflows and complex interactive components.
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { MockBean, TestContext, createTestInstance, verify, verifyNoInteractions } from "../src";
import type { MockedService } from "../src";

// Helper for behavior-first testing with DI control
export type Inject<T> = T;

export function renderWithDI<P extends object>(
  Component: (props: P) => JSX.Element,
  props: P
) {
  return render(<Component {...props} />);
}

export function given<T extends { __mock__: any }>(mock: T, method: string) {
  return mock.__mock__.when(method);
}

// Service interfaces for our behavior test
export interface SearchService {
  search(query: string): Promise<string[]>;
  getSuggestions(query: string): Promise<string[]>;
}

export interface Analytics {
  track(event: string, props?: Record<string, unknown>): void;
}

// Component under test - simplified interactive search box for behavior testing
export function SearchBox({
  searchService,
  analytics,
}: {
  searchService: Inject<SearchService>;
  analytics: Inject<Analytics>;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);

  async function handleSearch() {
    if (!query.trim()) return;
    
    setError(null);
    setLoading(true);
    analytics.track("search_submitted", { query });
    
    try {
      const searchResults = await searchService.search(query);
      setResults(searchResults || []);
      analytics.track("search_succeeded", { count: (searchResults || []).length, query });
    } catch (e: any) {
      setError(e.message || "Search failed");
      setResults([]);
      analytics.track("search_failed", { query, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  }

  return (
    <div role="search" aria-label="Product search">
      <label htmlFor="search-input">Search Products</label>
      <input
        id="search-input"
        type="search"
        placeholder="Enter product name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-describedby={error ? "search-error" : undefined}
        disabled={loading}
      />
      <button 
        onClick={handleSearch} 
        disabled={loading || !query.trim()}
        aria-label="submit search"
      >
        {loading ? "Searching..." : "Search"}
      </button>
      
      {loading && (
        <div role="status" aria-live="polite">
          Searching for products...
        </div>
      )}
      
      {error && (
        <div role="alert" id="search-error" aria-live="assertive">
          {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div>
          <h2>Search Results ({results.length} found)</h2>
          <ul role="list" aria-label="Search results">
            {results.map((result, index) => (
              <li key={index}>{result}</li>
            ))}
          </ul>
        </div>
      )}
      
      {!loading && !error && query && results.length === 0 && (
        <p aria-live="polite">No results found for "{query}"</p>
      )}
    </div>
  );
}

describe("SearchBox - Behavior-First Testing with DI Control", () => {
  @TestContext({ isolateTest: true, autoReset: true })
  class SearchTestContext {
    @MockBean()
    searchService!: MockedService<SearchService>;

    @MockBean()
    analytics!: MockedService<Analytics>;
  }

  let ctx: SearchTestContext & { __testContext: unknown };

  beforeEach(() => {
    ctx = createTestInstance(SearchTestContext);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows search results after user submits query - complete happy path", async () => {
    // GIVEN - Service will return results for user's search
    given(ctx.searchService, "search").thenReturn(
      Promise.resolve(["MacBook Pro", "MacBook Air", "iMac"])
    );
    given(ctx.analytics, "track").thenReturn(undefined);

    // WHEN - User interacts with search interface
    renderWithDI(SearchBox, {
      searchService: ctx.searchService as any,
      analytics: ctx.analytics as any,
    });

    const searchInput = screen.getByLabelText("Search Products");
    const searchButton = screen.getByRole("button", { name: "submit search" });

    await userEvent.type(searchInput, "MacBook");
    await userEvent.click(searchButton);

    // THEN - User sees results (loading state may be too brief to catch)
    await waitFor(() => {
      expect(screen.getByText("Search Results (3 found)")).toBeInTheDocument();
    });

    // User can see all results
    const resultsList = screen.getByRole("list", { name: "Search results" });
    expect(resultsList).toBeInTheDocument();
    expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
    expect(screen.getByText("MacBook Air")).toBeInTheDocument();
    expect(screen.getByText("iMac")).toBeInTheDocument();

    // Loading state is gone
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // AND - Services were called correctly (verification secondary to behavior)
    verify(ctx.analytics, "track").withArgs("search_submitted", { query: "MacBook" });
    verify(ctx.searchService, "search").withArgs("MacBook");
    verify(ctx.analytics, "track").withArgs("search_succeeded", { 
      count: 3, 
      query: "MacBook" 
    });
  });

  it("displays error message when search fails - user sees helpful feedback", async () => {
    // GIVEN - Service will fail for user's search
    given(ctx.searchService, "search").thenThrow(new Error("Service temporarily unavailable"));
    given(ctx.analytics, "track").thenReturn(undefined);

    renderWithDI(SearchBox, {
      searchService: ctx.searchService as any,
      analytics: ctx.analytics as any,
    });

    // WHEN - User searches for something
    await userEvent.type(screen.getByLabelText("Search Products"), "broken");
    await userEvent.click(screen.getByRole("button", { name: "submit search" }));

    // THEN - User sees error message (accessibility compliant)
    await waitFor(() => {
      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent("Service temporarily unavailable");
      expect(errorMessage).toHaveAttribute("aria-live", "assertive");
    });

    // No results are shown
    expect(screen.queryByRole("list", { name: "Search results" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // AND - Analytics captured the failure
    verify(ctx.analytics, "track").withArgs("search_submitted", { query: "broken" });
    verify(ctx.searchService, "search").withArgs("broken");
    verify(ctx.analytics, "track").withArgs("search_failed", { 
      query: "broken", 
      error: "Service temporarily unavailable" 
    });
  });

  it("handles empty query gracefully - prevents unnecessary service calls", async () => {
    renderWithDI(SearchBox, {
      searchService: ctx.searchService as any,
      analytics: ctx.analytics as any,
    });

    const searchButton = screen.getByRole("button", { name: "submit search" });
    
    // WHEN - User clicks search with empty input
    expect(searchButton).toBeDisabled(); // Button should be disabled for empty query
    
    // User tries to search anyway (button click does nothing)
    await userEvent.click(searchButton);
    
    // THEN - No service calls made, no UI changes
    verifyNoInteractions(ctx.searchService);
    verifyNoInteractions(ctx.analytics);
    
    // No loading or results shown
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Search Results")).not.toBeInTheDocument();
  });

  it("prevents duplicate searches while loading - good UX behavior", async () => {
    // GIVEN - Slow search response
    let resolveSearch: (results: string[]) => void;
    const slowSearchPromise = new Promise<string[]>((resolve) => {
      resolveSearch = resolve;
    });
    given(ctx.searchService, "search").thenReturn(slowSearchPromise);
    given(ctx.analytics, "track").thenReturn(undefined);

    renderWithDI(SearchBox, {
      searchService: ctx.searchService as any,
      analytics: ctx.analytics as any,
    });

    // WHEN - User submits search
    await userEvent.type(screen.getByLabelText("Search Products"), "slow");
    await userEvent.click(screen.getByRole("button", { name: "submit search" }));

    // THEN - Button becomes disabled, user can't spam clicks
    const submitButton = screen.getByRole("button", { name: "submit search" });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Searching...");
    expect(screen.getByRole("status")).toHaveTextContent("Searching for products...");

    // User tries to click multiple times (should be prevented)
    await userEvent.click(submitButton);
    await userEvent.click(submitButton);

    // Complete the search
    resolveSearch!(["Slow Result"]);
    
    await waitFor(() => {
      expect(screen.getByText("Search Results (1 found)")).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent("Search");
    });

    // AND - Only one search call was made despite multiple clicks
    verify(ctx.searchService, "search").once();
  });

  it("supports keyboard navigation - accessibility requirement", async () => {
    // GIVEN - Service ready for search
    given(ctx.searchService, "search").thenReturn(
      Promise.resolve(["Keyboard Result"])
    );
    given(ctx.analytics, "track").thenReturn(undefined);

    renderWithDI(SearchBox, {
      searchService: ctx.searchService as any,
      analytics: ctx.analytics as any,
    });

    // WHEN - User uses keyboard only (accessibility scenario)
    const searchInput = screen.getByLabelText("Search Products");
    
    // Focus and type
    searchInput.focus();
    await userEvent.type(searchInput, "keyboard");
    
    // Submit with Enter key
    await userEvent.keyboard("{Enter}");

    // THEN - Search works via keyboard
    await waitFor(() => {
      expect(screen.getByText("Search Results (1 found)")).toBeInTheDocument();
      expect(screen.getByText("Keyboard Result")).toBeInTheDocument();
    });

    // AND - Services called correctly
    verify(ctx.searchService, "search").withArgs("keyboard");
  });

  it("shows 'no results' message when search returns empty - clear user feedback", async () => {
    // GIVEN - Service returns empty results
    given(ctx.searchService, "search").thenReturn(Promise.resolve([]));
    given(ctx.analytics, "track").thenReturn(undefined);

    renderWithDI(SearchBox, {
      searchService: ctx.searchService as any,
      analytics: ctx.analytics as any,
    });

    // WHEN - User searches for something with no results
    await userEvent.type(screen.getByLabelText("Search Products"), "nonexistent");
    await userEvent.click(screen.getByRole("button", { name: "submit search" }));

    // THEN - User sees helpful no-results message
    await waitFor(() => {
      expect(screen.getByText('No results found for "nonexistent"')).toBeInTheDocument();
    });

    // No results list shown
    expect(screen.queryByRole("list", { name: "Search results" })).not.toBeInTheDocument();
    expect(screen.queryByText("Search Results")).not.toBeInTheDocument();

    // AND - Analytics captured successful search with zero results
    verify(ctx.analytics, "track").withArgs("search_succeeded", { 
      count: 0, 
      query: "nonexistent" 
    });
  });

  it("ignores empty/whitespace searches - prevents unnecessary service calls", async () => {
    renderWithDI(SearchBox, {
      searchService: ctx.searchService as any,
      analytics: ctx.analytics as any,
    });

    const searchButton = screen.getByRole("button", { name: "submit search" });
    
    // WHEN - User tries to search with empty input
    expect(searchButton).toBeDisabled(); // Should start disabled
    
    // Type only whitespace
    await userEvent.type(screen.getByLabelText("Search Products"), "   ");
    expect(searchButton).toBeDisabled(); // Still disabled
    
    await userEvent.click(searchButton); // Click does nothing
    
    // THEN - No service calls made
    verifyNoInteractions(ctx.searchService);
    verifyNoInteractions(ctx.analytics);
    
    // No loading or error states
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});