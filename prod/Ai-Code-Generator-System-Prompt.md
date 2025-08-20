
> this file and the propmt stuff is ai slop, but, it might help to have a basic prompt for when creating a new project

- like see example of what i want examples. 
   npx degit 7frank/tdi2/examples/tdi2-basic-example di-react-example
   cd di-react-example

 that and try to add our business logic
-  for view logic/state logic use either hooks or our di pattern where you create a class/controller. view logic caracteristics are that they might need mount/unmount lifecycle hooks / interfaces
- for business logic create  service classes / they are cacacterized to be using onInit or onDestroy lifecyle hooks /interfaces

- we should link to a specific part of the documentation that explicitly explains the framework for ai bots

-the system prompt should not contain the business logic it should contain how later businesss logic should be put together


- so i need you to fix this file to contain a proper "system" promt excempt the business logic. that shows the bot how to degit the existsing example as base line
- then this separate file that explains the bot briefly how the framework is working. reference that from the prompt, so that the bot may look it up
- also look up the 3 test categories in the documentation before, they should be different, also the prompt should be more like (iff the user wants tests, then handle them like the following:)


# TDI2 E-Commerce Application Generation Prompt

Use this prompt to generate a complete TDI2 (TypeScript Dependency Injection 2) e-commerce application with proper autowiring dependency injection.

## Prompt Template

```
Create a complete TDI2 e-commerce application with the following requirements:

### Core Architecture Requirements:
- **TDI2 Autowiring**: Use @Service() decorators for automatic service registration
- **Zero Manual Props**: Components declare services in interfaces, TDI2 auto-injects at build time
- **Reactive State**: Valtio proxies for automatic UI updates
- **Repository Pattern**: Abstract data access layer
- **Service-to-Service DI**: Services inject other services as dependencies

### Project Structure:
```
src/
├── services/           # Business logic with @Service() decorators
├── repositories/       # Data access layer with interfaces
├── components/         # React components with service injection
├── types/             # TypeScript interfaces
├── data/              # Mock data files
├── __tests__/         # Three categories of tests
└── main.tsx           # TDI2 container setup
```

### Services to Create:
1. **ProductService**: Product catalog, search, filtering with ProductRepository dependency
2. **CartService**: Shopping cart management with InventoryService dependency
3. **UserService**: Authentication, profile management with UserRepository dependency  
4. **InventoryService**: Stock management and reservation

### Components with TDI2 Pattern:
```typescript
// Component declares services in props interface
interface ProductListProps {
  services: {
    productService: Inject<ProductServiceInterface>;
    cartService: Inject<CartServiceInterface>;
  };
}

export function ProductList(props: ProductListProps) {
  const { services: { productService, cartService } } = props;
  // TDI2 auto-injects services at build time - no manual prop passing
}
```

### Key TDI2 Setup Files:

**main.tsx**:
```typescript
import { CompileTimeDIContainer } from '@tdi2/di-core/container';
import { DIProvider } from '@tdi2/di-core/context';
import { DI_CONFIG } from './.tdi2/di-config'; // Auto-generated

const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

// Wrap app in DIProvider
<DIProvider container={container}><App /></DIProvider>
```

**Service Example**:
```typescript
@Service()
export class CartService implements CartServiceInterface {
  constructor(
    @Inject() private inventoryService: InventoryServiceInterface
  ) {}
  // Service-to-service dependency injection
}
```

### UI Features:
- **Styling**: Tailwind CSS with responsive design
- **Product Catalog**: Search, filtering, categories, price ranges
- **Shopping Cart**: Add/remove items, quantity management, discount codes
- **User Authentication**: Login/register, profile management, addresses
- **Stock Management**: Real-time availability, stock validation
- **Reactive Updates**: Cart badge, inventory status auto-update

### Testing Strategy (3 Categories):

1. **Service Unit Tests**: 
   - Test business logic in isolation with mocked dependencies
   - Focus on reactive state management and service methods
   ```typescript
   const cartService = new CartService(mockInventoryService);
   await cartService.addItem(mockProduct);
   expect(cartService.state.items).toHaveLength(1);
   ```

2. **Component Behavior Tests**:
   - Test component interactions with mocked service interfaces  
   - Verify UI behavior based on service state
   ```typescript
   render(<ProductList productService={mockProductService} cartService={mockCartService} />);
   fireEvent.click(screen.getByText('Add to Cart'));
   expect(mockCartService.addItem).toHaveBeenCalled();
   ```

3. **DI Integration Tests**:
   - Test full DI container with real service interactions
   - Verify service-to-service communication and constraints
   ```typescript
   const container = new DIContainer();
   const cartService = container.resolve<CartServiceInterface>('CartServiceInterface');
   // Test real service interactions
   ```

### Package.json Scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build", 
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### Important TDI2 Patterns:

**❌ Don't Do (Manual DI)**:
- Manual container.register() calls
- useServices() hooks  
- Manual prop passing of services
- Service resolution in components

**✅ Do This (TDI2 Autowiring)**:
- @Service() decorators for auto-registration
- Declare services in component props interfaces
- Let TDI2 Vite plugin transform components automatically
- Service-to-service constructor injection

### Expected Outcome:
- Complete working e-commerce app
- Zero manual prop passing (TDI2 handles injection)  
- Reactive state updates across all components
- Clean separation: Services (business logic), Components (presentation)
- Comprehensive test coverage for all DI patterns
- Professional Tailwind UI with responsive design

Generate the complete application following these patterns exactly.
```

## Usage Instructions

1. Copy the prompt above and paste it to any AI assistant
2. The AI will generate a complete TDI2 e-commerce application
3. Key files generated:
   - Services with @Service() decorators
   - Components with proper TDI2 service injection interfaces
   - Repository pattern with dependency injection
   - Three categories of focused tests
   - Complete Tailwind UI implementation
   - Proper main.tsx with TDI2 container setup

## Key Differences from Regular React Apps

- **No useState/useEffect** in components - services provide reactive state
- **No prop drilling** - services auto-injected where declared
- **Build-time transformation** - TDI2 Vite plugin handles injection
- **Service-oriented** - business logic lives in services, not components
- **Interface-driven** - TypeScript interfaces define service contracts
- **Automatic registration** - @Service() decorators handle DI setup

This prompt ensures the generated code follows proper TDI2 patterns with autowiring dependency injection.