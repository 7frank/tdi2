# @tdi2/di-testing

Testing utilities for the TDI2 dependency injection framework, providing three distinct testing approaches for different scenarios. Inspired by Spring Boot's testing capabilities with enterprise-grade patterns.

## Installation

```bash
bun add -D @tdi2/di-testing
```

## Overview

TDI2 Testing provides three complementary testing approaches, each optimized for specific testing scenarios:

| Testing Approach | Best For | Focus |
|------------------|----------|-------|
| **🔧 Pure Service Testing** | Business logic, domain services | Service-to-service orchestration |
| **⚛️ React Service Testing** | Component service integration | Service calls from React components |
| **👤 React Behavior Testing** | User workflows, accessibility | User experience + service verification |

## Quick Start Examples

Choose your testing approach based on what you're testing:

### 🔧 Pure Service Testing
Test business logic without UI dependencies:

```typescript
import { MockBean, TestContext, createTestInstance, verify } from "@tdi2/di-testing";

@TestContext({ isolateTest: true })
class OrderServiceTest {
  @MockBean()
  paymentService!: MockedService<PaymentService>;
  
  @MockBean() 
  emailService!: MockedService<EmailService>;
}

it("processes order with payment and notification", async () => {
  const ctx = createTestInstance(OrderServiceTest);
  
  // Setup service behavior
  ctx.paymentService.__mock__.when('processPayment').thenReturn(Promise.resolve(true));
  ctx.emailService.__mock__.when('sendConfirmation').thenReturn(Promise.resolve());
  
  // Test business logic
  const orderService = new OrderService(ctx.paymentService, ctx.emailService);
  const result = await orderService.processOrder(orderData);
  
  // Verify service interactions
  verify(ctx.paymentService, 'processPayment').once();
  verify(ctx.emailService, 'sendConfirmation').withArgs(orderData.customerEmail);
});
```

### ⚛️ React Service Testing  
Test React components focusing on service orchestration:

```typescript
import { ReactServiceTesting, MockBean, TestContext } from "@tdi2/di-testing";

@TestContext({ isolateTest: true })
class UserProfileTest {
  @MockBean()
  userService!: MockedService<UserService>;
}

it("loads user data on mount", async () => {
  const ctx = createTestInstance(UserProfileTest);
  
  ctx.userService.__mock__.when('getCurrentUser')
    .thenReturn(Promise.resolve({ id: '1', name: 'John' }));
  
  ReactServiceTesting.renderWithServices(UserProfile, {
    userService: ctx.userService
  });
  
  // Verify service called during component lifecycle
  await ReactServiceTesting.waitForServiceCall(ctx.userService, 'getCurrentUser');
  verify(ctx.userService, 'getCurrentUser').once();
});
```

### 👤 React Behavior Testing
Test user workflows with full DOM interaction:

```typescript  
import { ReactBehaviorTesting, MockBean, TestContext } from "@tdi2/di-testing";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

@TestContext({ isolateTest: true })
class SearchTest {
  @MockBean()
  searchService!: MockedService<SearchService>;
}

it("shows results when user searches", async () => {
  const ctx = createTestInstance(SearchTest);
  
  // Setup service to return results
  ReactBehaviorTesting.given(ctx.searchService, 'search')
    .thenReturn(Promise.resolve(['Result 1', 'Result 2']));
  
  ReactBehaviorTesting.renderWithDI(SearchBox, {
    searchService: ctx.searchService
  });
  
  // User interactions
  await userEvent.type(screen.getByLabelText('Search'), 'test query');
  await userEvent.click(screen.getByRole('button', { name: 'Search' }));
  
  // User sees results
  await waitFor(() => {
    expect(screen.getByText('Result 1')).toBeInTheDocument();
    expect(screen.getByText('Result 2')).toBeInTheDocument();
  });
  
  // Service was called correctly
  ReactBehaviorTesting.andServiceWasCalled(ctx.searchService, 'search', {
    withArgs: ['test query']
  });
});
```

## Testing Approaches in Detail

### 🔧 Pure Service Testing

**When to use:** Testing business services, domain logic, and service orchestration without any UI concerns.

**Key utilities:**
```typescript
import { ServiceTesting } from "@tdi2/di-testing";

// Test complex service workflows
ServiceTesting.createServiceScenario({
  given: async () => {
    mockPaymentService.__mock__.when('charge').thenReturn(Promise.resolve());
  },
  when: async () => {
    return await orderService.processPayment(orderData);
  },
  then: async (result) => {
    expect(result.success).toBe(true);
    verify(mockPaymentService, 'charge').once();
  }
});

// Verify service call sequences  
ServiceTesting.verifyServiceSequence([
  { service: mockPaymentService, method: 'validateCard' },
  { service: mockPaymentService, method: 'charge' },
  { service: mockEmailService, method: 'sendReceipt' }
]);

// Test business rules
ServiceTesting.validateBusinessRules({
  'Order total must be positive': () => order.total > 0,
  'Customer must exist': () => order.customerId !== null
});
```

### ⚛️ React Service Testing

**When to use:** Testing React components that coordinate multiple services, focusing on service interaction rather than user experience.

**Key utilities:**
```typescript
import { ReactServiceTesting } from "@tdi2/di-testing";

// Render component with service injection
const { container } = ReactServiceTesting.renderWithServices(OrderSummary, {
  orderService: mockOrderService,
  paymentService: mockPaymentService
});

// Verify component made expected service calls
ReactServiceTesting.verifyComponentServiceCalls([
  { service: mockOrderService, method: 'getOrder', expectedCalls: 1 },
  { service: mockPaymentService, method: 'getPaymentStatus', expectedCalls: 1 }
]);

// Wait for async service calls during component lifecycle
await ReactServiceTesting.waitForServiceCall(mockOrderService, 'loadOrderDetails');
```

### 👤 React Behavior Testing  

**When to use:** Testing complete user workflows, accessibility, and user experience while controlling service dependencies.

**Key utilities:**
```typescript
import { ReactBehaviorTesting } from "@tdi2/di-testing";

// Render component with full DOM and service control
ReactBehaviorTesting.renderWithDI(CheckoutForm, {
  paymentService: mockPaymentService,
  orderService: mockOrderService
});

// Fluent service setup
ReactBehaviorTesting.given(mockPaymentService, 'processPayment')
  .thenReturn(Promise.resolve({ success: true }));

// Common user interactions
await ReactBehaviorTesting.UserInteractions.submitForm({
  'Card Number': '4111111111111111',
  'CVV': '123'
}, 'Complete Purchase');

// Verify both user experience AND service calls
ReactBehaviorTesting.andServiceWasCalled(mockPaymentService, 'processPayment', {
  withArgs: [{ cardNumber: '4111111111111111' }]
});
```

## Import Patterns

### Main Imports (All Testing Approaches)
```typescript
// Core DI testing (backward compatible)
import { MockBean, TestContext, createTestInstance, verify, verifyNoInteractions } from "@tdi2/di-testing";
import type { MockedService } from "@tdi2/di-testing";
```

### Organized by Testing Approach
```typescript
// Pure service testing
import { ServiceTesting } from "@tdi2/di-testing";
const { createServiceScenario, verifyServiceSequence } = ServiceTesting;

// React service testing
import { ReactServiceTesting } from "@tdi2/di-testing";  
const { renderWithServices, waitForServiceCall } = ReactServiceTesting;

// React behavior testing
import { ReactBehaviorTesting } from "@tdi2/di-testing";
const { renderWithDI, given, andServiceWasCalled } = ReactBehaviorTesting;

// Shared utilities
import { SharedTesting } from "@tdi2/di-testing";
const { setupDOM, createTestData, delay } = SharedTesting;
```

### Direct Namespace Imports
```typescript
// Import specific testing utilities directly
import { renderWithDI, given } from "@tdi2/di-testing/react-behavior";
import { createServiceScenario } from "@tdi2/di-testing/service";
import { renderWithServices } from "@tdi2/di-testing/react-service";
import { setupDOM, createTestData } from "@tdi2/di-testing/shared";
```

## DOM Setup for React Testing

For React component testing, you need to set up a DOM environment:

### Option 1: Global Setup (Recommended)
Create `happydom.ts` in your test setup:
```typescript
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import "@testing-library/jest-dom";

GlobalRegistrator.register();
```

Configure in `bunfig.toml`:
```toml
[test]
preload = "./happydom.ts"
```

### Option 2: Programmatic Setup
```typescript
import { SharedTesting } from "@tdi2/di-testing";

beforeAll(() => {
  SharedTesting.setupDOM();
});

afterAll(() => {
  SharedTesting.cleanupDOM();  
});
```

## When to Use Each Testing Approach

| Scenario | Recommended Approach | Why |
|----------|---------------------|-----|
| Testing business logic | 🔧 Pure Service Testing | Fast, focused on domain logic |
| Testing service integration | ⚛️ React Service Testing | Verifies component-service coordination |
| Testing user workflows | 👤 React Behavior Testing | Full user experience validation |
| Testing accessibility | 👤 React Behavior Testing | Screen reader and keyboard navigation |
| Testing complex workflows | 🔧 Pure Service Testing | Service orchestration focus |
| Testing loading states | 👤 React Behavior Testing | User-observable state changes |
| Testing error handling | All approaches | Different perspectives on error flows |

## Features

✅ **Three Testing Approaches** - Service, React Service, React Behavior  
✅ **Spring Boot-Style** - `@MockBean`, `@TestContext`, `verify()` patterns  
✅ **Type-Safe Mocking** - Full TypeScript support with `MockedService<T>`  
✅ **Fluent APIs** - `given().thenReturn()`, `andServiceWasCalled()`  
✅ **DOM Integration** - Happy DOM setup for React testing  
✅ **Accessibility Focus** - Role-based queries and keyboard navigation  
✅ **Enterprise Patterns** - Structured testing for complex applications