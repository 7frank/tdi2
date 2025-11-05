# TDI2 Enterprise Forms Example

- A more complex example highlighting the strengths compared to other react based solutions
- For technical details check out the basic example.

## 🏥 What This Example Demonstrates

### Core Architecture Patterns

- **DAG-based Form Navigation** - Non-linear form dependencies and conditional unlocking
- **Service-Oriented Architecture** - Clear separation between business logic and UI
- **Reactive State Management** - RxJS streams for real-time validation and updates
- **Enterprise Validation** - JSON Schema validation with async server-side checks
- **Memento Pattern** - Form state snapshots for rollback and recovery

### Healthcare Domain Complexity

- **Patient Demographics** with age-based conditional logic
- **Insurance Validation** with real-time eligibility checking
- **Guardian Consent** automatically required for minors
- **Specialist Referrals** unlocked by medical conditions + insurance type
- **HIPAA Compliance** workflows and consent management

## Download

0. degit or clone the repo by using one of these:

   ```bash
   npx degit 7frank/tdi2/examples/tdi2-enterprise-forms-example tdi2-enterprise-forms-example
   cd di-react-example
   ```

   **or**

   ```bash
   git clone https://github.com/7frank/tdi2.git
   cd  tdi2/examples/tdi2-enterprise-forms-example
   ```

## Run Instructions

```bash
npm install
npm run clean && npm run dev
```

Visit http://localhost:5173 to see the complex form in action.

## 📋 Form Structure (DAG)

```
    Demographics (always available)
         |
    ┌────┼────┐
    ↓    ↓    ↓
Insurance Guardian Emergency
    |    (if <18)  Contacts
    ↓
Medical History
    |
    ↓ (if PPO/POS)
Specialist Referral
    |
    ↓
Financial + HIPAA
```

### ✅ Fully Implemented Forms

1. **Demographics Form**
   - Full validation with nested address objects
   - Age calculation from date of birth
   - Conditional logic for minor detection
   - Real-time field validation

2. **Insurance Form**
   - Complex insurance plan validation
   - Real-time eligibility checking (simulated)
   - Secondary insurance support
   - Plan-specific information display

### 🚧 Placeholder Forms (Click "Next" Only)

3. **Medical History** - Chronic conditions, medications, allergies
4. **Guardian Consent** - Required for patients < 18 years
5. **Specialist Referral** - Unlocked by medical + insurance data
6. **Emergency Contacts** - Emergency contact information
7. **HIPAA Consent** - Privacy and consent management
8. **Financial Responsibility** - Payment and billing setup

## 🏗️ Architecture Deep Dive

### Service Layer Architecture

```typescript
FormDAGService           # DAG navigation and orchestration
├── DemographicsFormService    # Demographics business logic
├── InsuranceFormService       # Insurance validation + eligibility
├── ValidationOrchestratorService  # JSON Schema validation
└── FormStateService          # State snapshots (planned)
```

### Key Design Patterns

#### 1. DAG-Based Navigation

Forms unlock based on dependencies and business rules:

- **Demographics** → unlocks **Insurance** + **Emergency Contacts**
- **Age < 18** → unlocks **Guardian Consent**
- **Insurance Type = PPO/POS** + **Medical History** → unlocks **Specialist Referral**

#### 2. Reactive Validation Streams

```typescript
// Real-time validation with RxJS
this.formData$
  .pipe(
    debounceTime(300),
    distinctUntilChanged(),
    map((data) => this.validateForm())
  )
  .subscribe();
```

#### 3. Service Interface Boundaries

Each domain has clean interfaces enabling testing and swapping:

```typescript
interface DemographicsFormServiceInterface {
  state: { formData; validationResults; isSubmitting };
  updateField(field: string, value: any): void;
  validateForm(): Promise<ValidationResult>;
  submitForm(): Promise<void>;
}
```

### Real-World Enterprise Features

#### Complex Validation Rules

- **Nested object validation** (address, insurance)
- **Cross-field dependencies** (age affects required fields)
- **Async validation** (insurance eligibility API calls)
- **JSON Schema-based** server-side validation

#### Business Logic Examples

```typescript
// Age calculation triggers conditional forms
calculateAge(dateOfBirth: string): number {
  // Real date calculation logic
}

// Insurance eligibility with realistic delay
checkEligibility(): Observable<string> {
  return of('verified').pipe(delay(2000));
}
```

## 🧪 Testing Strategy

### Service Layer Testing

```typescript
describe("DemographicsFormService", () => {
  it("should calculate age correctly", () => {
    const service = new DemographicsFormService();
    const age = service.calculateAge("2000-01-01");
    expect(age).toBe(24); // or current age
  });
});
```

### Component Testing

```typescript
describe('DemographicsForm', () => {
  it('should show minor warning when age < 18', () => {
    const mockService = {
      state: { formData: { age: 16 } }
    };
    render(<DemographicsForm services={{demographicsForm: mockService}} />);
    expect(screen.getByText(/minor patient detected/i)).toBeInTheDocument();
  });
});
```

## 🎯 Enterprise Patterns Demonstrated

### 1. Domain-Driven Design

- Clear domain boundaries (Demographics, Insurance, Medical)
- Service interfaces define domain contracts
- Business rules encapsulated in services

### 2. Event-Driven Architecture

- Forms react to state changes across services
- Navigation unlocks based on completion events
- Validation streams trigger UI updates

### 3. SOLID Principles

- **Single Responsibility**: Each service handles one domain
- **Open/Closed**: Extend via new services, don't modify existing
- **Liskov Substitution**: Interface-based service swapping
- **Interface Segregation**: Focused service contracts
- **Dependency Inversion**: Depend on abstractions

### 4. Enterprise Resilience

- Graceful degradation when validation fails
- Rollback capabilities with state snapshots
- Error boundaries and user feedback
- Async operation handling

## 🎓 Learning Outcomes

This example demonstrates how RSI enables:

1. **Enterprise-scale form complexity** without props hell
2. **Clean service boundaries** for team scalability
3. **Reactive state management** with minimal boilerplate
4. **Business logic separation** from React components
5. **Testable architecture** at every layer
6. **Real-world validation patterns** with async operations

---

**This example showcases how RSI transforms complex enterprise forms from prop-drilling nightmares into clean, maintainable, service-oriented architectures.**
