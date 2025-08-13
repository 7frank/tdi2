import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";

import { MockBean, TestContext, createTestInstance, verify, verifyNoInteractions } from "../src";
import type { MockedService } from "../src";

// Service interfaces
export interface AuthService {
  getCurrentUser(): Promise<{ id: string; name: string } | null>;
  logout(): Promise<void>;
}

export interface FeatureFlags {
  isEnabled(flag: string): boolean;
}

// Type for RSI injection placeholder
export type Inject<T> = T;

// React component with service injection
export function UserBadge({
  authService,
  flags,
}: {
  authService: Inject<AuthService>;
  flags: Inject<FeatureFlags>;
}) {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    authService.getCurrentUser().then((u) => {
      if (!alive) return;
      setUser(u);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [authService]);

  if (loading) return <div role="status">loading</div>;
  if (!user) return <div aria-label="anonymous">Guest</div>;

  const beta = flags.isEnabled("beta");

  async function onLogout() {
    await authService.logout();
  }

  return (
    <div>
      <span aria-label="username">Hello, {user.name}</span>
      {beta && <span aria-label="beta">• Beta</span>}
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

describe("RSI Component Service-Level Testing", () => {
  @TestContext({ isolateTest: true, autoReset: true })
  class UserBadgeTestContext {
    @MockBean()
    authService!: MockedService<AuthService>;

    @MockBean()
    flags!: MockedService<FeatureFlags>;
  }

  let ctx: UserBadgeTestContext & { __testContext: unknown };

  beforeEach(() => {
    ctx = createTestInstance(UserBadgeTestContext);
  });

  it("renders user name and beta badge; verifies service interactions", async () => {
    // Arrange - Setup service behavior via mocks
    ctx.authService.__mock__
      .when("getCurrentUser")
      .thenReturn(Promise.resolve({ id: "u1", name: "Ada" }));
    ctx.authService.__mock__.when("logout").thenReturn(Promise.resolve());

    ctx.flags.__mock__.when("isEnabled").thenReturn(true);

    // Act - Render component with injected services
    render(
      <UserBadge
        authService={ctx.authService as any}
        flags={ctx.flags as any}
      />
    );

    // Assert - Initial loading state
    expect(screen.getByRole("status").textContent).toBe("loading");

    // Wait for async user load and verify final state
    await waitFor(() => expect(screen.getByLabelText("username").textContent).toContain("Ada"));
    expect(screen.getByLabelText("beta").textContent).toBe("• Beta");

    // Act - User interaction
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    // Assert - Service interaction verification
    verify(ctx.authService, "getCurrentUser").once();
    verify(ctx.flags, "isEnabled").withArgs("beta");
    verify(ctx.authService, "logout").once();
  });

  it("renders Guest when no user; ensures minimal service interactions", async () => {
    // Arrange - Simulate no authenticated user
    ctx.authService.__mock__.when("getCurrentUser").thenReturn(Promise.resolve(null));

    // Act
    render(
      <UserBadge
        authService={ctx.authService as any}
        flags={ctx.flags as any}
      />
    );

    // Assert - Guest state displayed
    await waitFor(() => expect(screen.getByLabelText("anonymous").textContent).toBe("Guest"));

    // Assert - Service interactions
    verify(ctx.authService, "getCurrentUser").once();
    verifyNoInteractions(ctx.flags); // No feature flag checks for anonymous users
    verify(ctx.authService, "logout").never(); // No logout button for guests
  });

  it("handles feature flags correctly; shows/hides beta badge", async () => {
    // Arrange - User exists, but beta feature disabled
    ctx.authService.__mock__
      .when("getCurrentUser")
      .thenReturn(Promise.resolve({ id: "u2", name: "Bob" }));
    
    ctx.flags.__mock__.when("isEnabled").thenReturn(false); // Beta disabled

    // Act
    render(
      <UserBadge
        authService={ctx.authService as any}
        flags={ctx.flags as any}
      />
    );

    // Assert - User shown without beta badge
    await waitFor(() => expect(screen.getByLabelText("username").textContent).toContain("Bob"));
    expect(screen.queryByLabelText("beta")).toBeNull(); // Beta badge not present

    // Assert - Service interactions
    verify(ctx.authService, "getCurrentUser").once();
    verify(ctx.flags, "isEnabled").withArgs("beta"); // Still checked, just returned false
  });

  it("propagates logout failures; maintains service call sequence", async () => {
    // Arrange - Setup services with logout failure
    ctx.authService.__mock__
      .when("getCurrentUser")
      .thenReturn(Promise.resolve({ id: "u3", name: "Charlie" }));
    ctx.flags.__mock__.when("isEnabled").thenReturn(false);
    ctx.authService.__mock__.when("logout").thenThrow(new Error("Logout failed"));

    // Act
    render(
      <UserBadge
        authService={ctx.authService as any}
        flags={ctx.flags as any}
      />
    );

    await waitFor(() => screen.getByLabelText("username"));

    // Act - Attempt logout (should not throw to UI, but service call should happen)
    await expect(userEvent.click(screen.getByRole("button", { name: "Logout" }))).resolves.toBeUndefined();

    // Assert - All expected service calls occurred
    verify(ctx.authService, "getCurrentUser").once();
    verify(ctx.flags, "isEnabled").withArgs("beta");
    verify(ctx.authService, "logout").once(); // Called despite failure
  });

  it("handles async loading states correctly", async () => {
    // Arrange - Delayed user load simulation
    let resolveUser: (user: any) => void;
    const userPromise = new Promise<{ id: string; name: string }>((resolve) => {
      resolveUser = resolve;
    });

    ctx.authService.__mock__
      .when("getCurrentUser")
      .thenReturn(userPromise);

    // Act
    render(
      <UserBadge
        authService={ctx.authService as any}
        flags={ctx.flags as any}
      />
    );

    // Assert - Loading state maintained
    expect(screen.getByRole("status").textContent).toBe("loading");
    expect(screen.queryByLabelText("username")).toBeNull();

    // Act - Resolve async user load
    resolveUser!({ id: "u4", name: "Diana" });
    ctx.flags.__mock__.when("isEnabled").thenReturn(true);

    // Assert - UI updates after async completion
    await waitFor(() => expect(screen.getByLabelText("username").textContent).toContain("Diana"));

    // Assert - Service called correctly
    verify(ctx.authService, "getCurrentUser").once();
  });

  it("demonstrates service orchestration over UI behavior testing", async () => {
    // This test highlights TDI2/RSI testing advantage: focus on service coordination
    // rather than DOM manipulation details
    
    // Arrange - Complex service behavior setup
    const mockUser = { id: "enterprise-user", name: "Enterprise Admin" };
    
    ctx.authService.__mock__
      .when("getCurrentUser")
      .thenCall(() => {
        // Simulate logging or side effects during user fetch
        console.log("Fetching user with enterprise permissions");
        return Promise.resolve(mockUser);
      });

    ctx.flags.__mock__
      .when("isEnabled")
      .thenCall((flag: string) => {
        // Simulate complex feature flag logic
        console.log(`Checking feature flag: ${flag}`);
        return flag === "beta" || flag === "enterprise";
      });

    ctx.authService.__mock__
      .when("logout")
      .thenCall(() => {
        console.log("Enterprise logout with audit trail");
        return Promise.resolve();
      });

    // Act
    render(
      <UserBadge
        authService={ctx.authService as any}
        flags={ctx.flags as any}
      />
    );

    await waitFor(() => screen.getByLabelText("username"));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    // Assert - Service orchestration verification (the real value)
    verify(ctx.authService, "getCurrentUser").once();
    verify(ctx.flags, "isEnabled").once(); // Beta flag checked
    verify(ctx.authService, "logout").once();
    
    // This approach tests the component's role as service coordinator
    // rather than testing React-specific rendering details
  });
});