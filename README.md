# TDI2 – Interface-Based Dependency Injection for React

> **🎯 NEW: Automatic Interface Resolution!** TDI2 now automatically resolves dependencies using TypeScript interfaces, eliminating the need for manual token mapping. Inspired by [TDI proof-of-concept](https://github.com/7frank/tdi).

## TLDR

#### For Development

```bash
# Initial setup
npm run di:enhanced

# Start development (reuses config)
npm run dev

# If issues arise
rm -rf node_modules/.vite/
npm run di:reset && npm run dev
```

## 🚀 Overview

TDI2 (TypeScript Dependency Injection 2) brings **Spring Boot-style dependency injection** to React applications with **automatic interface-to-implementation resolution**. No more manual token management – just use interfaces!

### Key Features

- **🎯 Interface-First DI**: Automatic resolution from TypeScript interfaces
- **⚡ Zero Manual Tokens**: `@Inject()` automatically finds implementations
- **🔧 Generic Interface Support**: `CacheInterface<T>`, `Repository<User>` work automatically
- **🌉 Functional Component DI**: `Inject<ApiInterface>` in React components
- **🔄 Hot Reload**: Development-friendly with automatic retransformation
- **📦 Build-Time Optimization**: Zero runtime overhead through compile-time generation

## 🎯 Problem Solved

### Before TDI2 (Manual Token Hell)

```typescript
// 😰 Manual token management
export const USER_API_TOKEN = "USER_API_TOKEN";
export const LOGGER_TOKEN = "LOGGER_TOKEN";

@Service({ token: USER_API_TOKEN })
export class UserService implements UserApiInterface {
  constructor(@Inject(LOGGER_TOKEN) private logger: LoggerInterface) {}
}
```

### After TDI2 (Interface Paradise)

```typescript
// 🎉 Automatic interface resolution!
@Service()
export class UserService implements UserApiInterface {
  constructor(@Inject() private logger: LoggerInterface) {} // Automatically finds ConsoleLogger!
}
```

## 🔄 How Interface Resolution Works

TDI2 scans your codebase and automatically builds a mapping:

```typescript
// 1. TDI2 finds this implementation
@Service()
export class ConsoleLogger implements LoggerInterface {
  log(message: string) {
    console.log(message);
  }
}

// 2. TDI2 finds this consumer
@Service()
export class UserService implements UserApiInterface {
  constructor(@Inject() private logger: LoggerInterface) {}
  //             ↑ Automatically resolves to ConsoleLogger!
}

// 3. Generated mapping (automatic!)
// LoggerInterface -> ConsoleLogger
// UserApiInterface -> UserService
```

## 🏗️ Architecture

### Interface-Based Service Layer

```typescript
// Define your interfaces
export interface UserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

export interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Implement with automatic resolution
@Service()
export class DatabaseUserRepository implements UserRepository {
  constructor(@Inject() private logger: LoggerInterface) {}

  async findById(id: string): Promise<User> {
    this.logger.log(`Finding user ${id}`);
    // Implementation...
  }
}

@Service()
export class SMTPEmailService implements EmailService {
  constructor(
    @Inject() private config: ConfigService,
    @Inject() private logger: LoggerInterface
  ) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    // Implementation...
  }
}
```

### Functional Component DI

```typescript
// React components with automatic interface injection
function UserProfile(props: {
  userId: string;
  services: {
    userRepo: Inject<UserRepository>; // → DatabaseUserRepository
    email: Inject<EmailService>; // → SMTPEmailService
    logger?: InjectOptional<LoggerInterface>; // → ConsoleLogger (optional)
  };
}) {
  const { userId, services } = props;

  const sendWelcomeEmail = async () => {
    const user = await services.userRepo.findById(userId);
    await services.email.send(user.email, "Welcome!", "Hello!");
    services.logger?.log(`Welcome email sent to ${user.email}`);
  };

  return <div>{/* Your UI */}</div>;
}
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Interface-Based DI Transformation

```bash
npm run di:enhanced
```

### 3. Start Development

```bash
npm run dev
```

### 4. Check Interface Mappings

Visit `http://localhost:5173/_di_interfaces` to see resolved interfaces.

## 📁 Project Structure

```
src/
├── di/                          # DI Framework Core
│   ├── decorators.ts           # @Service, @Inject (interface-based)
│   ├── container.ts            # Enhanced container with interface support
│   ├── context.tsx             # React hooks for DI
│   ├── markers.ts              # Inject<T>, InjectOptional<T>
│   └── types.ts                # Enhanced types for interface resolution
├── services/                   # Business Services
│   ├── UserApiServiceImpl.ts   # Example: implements UserApiInterface
│   └── ConsoleLogger.ts        # Example: implements LoggerInterface
├── components/                 # React Components
│   └── EnhancedFunctionalComponent.tsx  # Interface DI examples
├── .tdi2/                     # Bridge Files (auto-generated)
│   ├── di-config.ts           # Points to current config
│   └── registry.ts            # Service registry bridge
tools/
├── enhanced-di-transformer.ts      # Interface-based class DI
├── functional-di-enhanced-transformer.ts  # Interface-based functional DI
├── interface-resolver.ts           # Core interface resolution logic
├── dependency-tree-builder.ts      # Automatic dependency tree building
└── vite-plugin-di-enhanced.ts     # Enhanced Vite integration
```

## 🎯 Usage Examples

### Service Definition with Interface Resolution

```typescript
// Define interface
export interface PaymentService {
  process(amount: number, cardToken: string): Promise<PaymentResult>;
}

// Implement (automatic registration)
@Service()
export class StripePaymentService implements PaymentService {
  constructor(
    @Inject() private config: ConfigService,
    @Inject() private logger: LoggerInterface,
    @Inject() private audit?: AuditService // Optional dependency
  ) {}

  async process(amount: number, cardToken: string): Promise<PaymentResult> {
    this.logger.log(`Processing payment of $${amount}`);
    // Implementation...
  }
}
```

### Generic Interface Support

```typescript
export interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T>;
  save(entity: T): Promise<void>;
}

@Service()
export class UserRepository implements Repository<User> {
  constructor(@Inject() private db: DatabaseService) {}

  async findAll(): Promise<User[]> {
    return this.db.query("SELECT * FROM users");
  }
}

// Automatic resolution works with generics!
@Service()
export class UserController {
  constructor(@Inject() private userRepo: Repository<User>) {}
  //                    ↑ Automatically resolves to UserRepository!
}
```

### Multiple Implementations with Qualifiers

```typescript
// Multiple implementations of same interface
@Service()
@Primary() // Mark as default
export class DatabaseLogger implements LoggerInterface {
  log(message: string) {
    /* save to database */
  }
}

@Service()
@Qualifier("console")
export class ConsoleLogger implements LoggerInterface {
  log(message: string) {
    console.log(message);
  }
}

@Service()
export class UserService {
  constructor(
    @Inject() private defaultLogger: LoggerInterface, // → DatabaseLogger (primary)
    @Inject() @Qualifier("console") private consoleLogger: LoggerInterface // → ConsoleLogger
  ) {}
}
```

### Environment-Specific Implementations

```typescript
@Service()
@Profile("production")
export class ProductionEmailService implements EmailService {
  async send(to: string, subject: string, body: string) {
    // Real SMTP implementation
  }
}

@Service()
@Profile("development", "test")
export class MockEmailService implements EmailService {
  async send(to: string, subject: string, body: string) {
    console.log(`Mock email to ${to}: ${subject}`);
  }
}
```

## 🧪 Testing with Interface Mocks

```typescript
// Easy mocking for tests
const mockUserService: UserApiInterface = {
  getUserInfo: jest.fn().mockResolvedValue({ id: "1", name: "Test User" }),
  getData: jest.fn().mockResolvedValue(["test data"]),
  postData: jest.fn().mockResolvedValue(true),
};

const testContainer = new CompileTimeDIContainer();
testContainer.registerByInterface("UserApiInterface", () => mockUserService);

render(
  <DIProvider container={testContainer}>
    <UserProfile userId="1" />
  </DIProvider>
);
```

## 🔧 Configuration

### Vite Plugin Setup

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      verbose: true,
      enableInterfaceResolution: true, // Enable automatic interface resolution
      enableFunctionalDI: true, // Enable functional component DI
      generateDebugFiles: true, // Generate debug transformation files
      watch: true, // Hot reload on DI changes
    }),
    react(),
  ],
});
```

## 📊 Debug & Monitoring

### Development URLs

- `http://localhost:5173/_di_debug` - Transformation details
- `http://localhost:5173/_di_interfaces` - Interface mappings
- `http://localhost:5173/_di_configs` - Configuration versions

### CLI Commands

```bash
npm run di:enhanced     # Run interface-based transformation
npm run di:validate     # Validate dependency resolution
npm run di:info         # Show debug URLs
npm run test:interfaces # Test interface scanning
```

## 🆚 Comparison with Manual Token Approaches

| Aspect          | Manual Tokens (Old)        | Interface Resolution (New)           |
| --------------- | -------------------------- | ------------------------------------ |
| **Setup**       | Manual token constants     | Automatic from interfaces            |
| **Refactoring** | Update tokens manually     | Automatic with interface renames     |
| **Type Safety** | String tokens, error-prone | Full TypeScript interface validation |
| **IDE Support** | Limited autocomplete       | Full IntelliSense with interfaces    |
| **Testing**     | Mock by token strings      | Mock by interface types              |
| **Maintenance** | High (token management)    | Low (automatic resolution)           |
| **Ambiguity**   | Tokens can conflict        | Clear interface contracts            |

## 🔮 Advanced Features

### Conditional Services

```typescript
@Service()
@Profile("feature-flag-enabled")
export class NewFeatureService implements FeatureService {
  // Only registered when profile is active
}
```

### Lazy Loading

```typescript
@Service()
@Scope("transient")
export class ExpensiveService {
  // New instance created each time
}
```

### Configuration Injection

```typescript
@Service()
export class ApiClient {
  constructor(
    @Inject() private config: ConfigService,
    @Inject() @Qualifier("api") private endpoint: string
  ) {}
}
```

## 🤝 Migration from Token-Based DI

### Step 1: Update Service Decorators

```typescript
// Before
@Service({ token: 'USER_SERVICE_TOKEN' })

// After
@Service() // Token automatically resolved from interface
```

### Step 2: Update Inject Decorators

```typescript
// Before
constructor(@Inject('LOGGER_TOKEN') private logger: LoggerInterface)

// After
constructor(@Inject() private logger: LoggerInterface)
```

### Step 3: Remove Token Constants

```typescript
// Delete these files:
// src/tokens/service-tokens.ts
// src/constants/di-tokens.ts
```

## ⚠️ Current Limitations

- **Experimental**: Interface resolution is new - test thoroughly
- **Single Implementation**: One implementation per interface (use qualifiers for multiple)
- **Build Tool Dependency**: Requires enhanced transformers
- **IDE Support**: Limited IntelliSense for transformed code

## 🏆 Benefits Over Context API

1. **No Provider Hell**: Direct service injection
2. **Better Performance**: No context re-render issues
3. **Type Safety**: Compile-time interface validation
4. **Easier Testing**: Direct interface mocking
5. **Cleaner Architecture**: Clear separation of concerns

## 📚 Inspiration & References

- **Spring Framework**: `@Autowired` and interface-based DI
- **[TDI Proof-of-Concept](https://github.com/7frank/tdi)**: Original interface resolution approach
- **Angular DI**: Hierarchical injection patterns
- **InversifyJS**: Container-based DI for TypeScript

## 🚀 Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Run transformation**: `npm run di:enhanced`
4. **Start development**: `npm run dev`
5. **Check interface mappings**: `http://localhost:5173/_di_interfaces`
6. **Explore examples** in `src/components/EnhancedFunctionalComponent.tsx`

## 🤝 Contributing

This enhanced interface-based approach represents the future of DI in React applications. Contributions, feedback, and discussions about interface resolution are welcome!

### Development Commands

```bash
npm run di:enhanced         # Run interface-based transformation
npm run di:functional       # Run functional DI only
npm run di:validate         # Validate interface resolution
npm run di:debug           # Generate debug files
npm run di:clean           # Clean generated configs
npm run test:interfaces    # Test interface scanning
```

## 📄 License

MIT License - See LICENSE file for details

---

_TDI2 with interface resolution eliminates the complexity of manual token management while providing the power and flexibility of enterprise-grade dependency injection for React applications._
