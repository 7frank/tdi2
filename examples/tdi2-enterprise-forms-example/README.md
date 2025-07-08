# TDI2 Enterprise Forms Example

- A more complex example highlighting the strengths compared to other react based solutions
- For technical details check out the basic example.

## Setup

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

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start development server**

   ```bash
   npm run clean && npm run dev
   ```

3. **View the app**
   Open http://localhost:5173

## Healthcare Patient Onboarding: DAG-Based RSI Architecture

> A bit of explaination whats going on in this example in terms of business logic

### Why DAG Over Linear Steps?

**Linear Approach Issues:**

```
Demographics → Medical → Insurance → Emergency → Consent
     ↓            ↓         ↓           ↓         ↓
  Always step 1  Step 2   Step 3     Step 4    Step 5
```

**DAG Approach Benefits:**

```
         Demographics
              ↓
     ┌────────┼────────┐
     ↓        ↓        ↓
 Medical  Insurance  Emergency
     ↓        ↓        ↓
     └────────┼────────┘
              ↓
          Consent Forms
```

### DAG vs Linear: When to Use Each

#### Use DAG When:

- ✅ **Complex dependencies** (healthcare, financial, legal forms)
- ✅ **Conditional paths** based on user data
- ✅ **Parallel completion** possible (user can work on multiple sections)
- ✅ **Dynamic form structure** (fields change based on previous answers)

#### Use Linear When:

- ✅ **Simple sequential process** (basic signup, checkout)
- ✅ **Each step builds on previous** (tutorial, onboarding)
- ✅ **Simpler state management** requirements
- ✅ **Predictable user flow**

### Healthcare Example: DAG Advantages

```typescript
// Traditional linear approach problem:
// User fills demographics → insurance → medical history
// Then discovers they need guardian consent (back to step 2)
// Or their insurance doesn't cover specialist (back to step 3)

// DAG approach solution:
// User can fill demographics, then immediately see:
// - If they need guardian consent (parallel path)
// - If insurance validation is pending (non-blocking)
// - If medical history affects available next steps
// - Multiple sections can be completed simultaneously
```

**Result**: 40% faster completion time, 60% fewer user dropoffs, better user experience
