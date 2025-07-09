# View State vs Business State Classification Guide

## 🎨 **View State** (Component/UI Layer)
*State that only affects presentation and user interaction*

### Key Indicators:
- ✅ **Ephemeral** - Lost when component unmounts, doesn't need persistence
- ✅ **UI-specific** - Only relevant to rendering and user interaction
- ✅ **Non-transferable** - Doesn't make sense in other contexts (API, tests, other components)
- ✅ **Immediate feedback** - Changes instantly without business rules
- ✅ **Cosmetic** - Affects how things look, not what they mean

### Examples:

#### ✅ Definitely View State
```typescript
// UI interaction state
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const [hoveredItem, setHoveredItem] = useState<string | null>(null);
const [selectedTab, setSelectedTab] = useState('details');

// Form UI state
const [showPassword, setShowPassword] = useState(false);
const [fieldFocus, setFieldFocus] = useState<string | null>(null);
const [tooltipVisible, setTooltipVisible] = useState(false);

// Loading/async UI feedback
const [isButtonLoading, setIsButtonLoading] = useState(false);
const [animationComplete, setAnimationComplete] = useState(false);

// Layout state
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const [modalOpen, setModalOpen] = useState(false);
const [currentStep, setCurrentStep] = useState(1); // UI wizard step
```

#### ✅ Form Presentation State
```typescript
// These affect HOW the form looks, not WHAT the data means
const [isDirtyHighlighted, setIsDirtyHighlighted] = useState(false);
const [showValidationSummary, setShowValidationSummary] = useState(false);
const [expandedSections, setExpandedSections] = useState<string[]>([]);
const [fieldAnimations, setFieldAnimations] = useState<Record<string, boolean>>({});
```

---

## 🏢 **Business/Domain State** (Service Layer)
*State that represents domain concepts and business rules*

### Key Indicators:
- ✅ **Persistent** - Needs to survive component unmounts, page refreshes
- ✅ **Domain-meaningful** - Represents real business concepts
- ✅ **Transferable** - Makes sense in APIs, other components, tests
- ✅ **Rule-governed** - Changes follow business logic and validation
- ✅ **Semantic** - Affects what the data means, not just how it looks

### Examples:

#### ✅ Definitely Business State
```typescript
// Form data - represents domain entities
interface PatientDemographics {
  firstName: string;
  lastName: string; 
  dateOfBirth: string;
  age: number; // Derived from business rule
}

// Validation results - business rule outcomes
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Business process state
interface FormDAGState {
  currentNode: string;
  completedNodes: string[];
  availableNodes: string[]; // Calculated by business rules
}

// Domain-specific computed state
interface InsuranceEligibility {
  status: 'verified' | 'denied' | 'pending';
  lastChecked: Date;
  provider: string;
}
```

---

## 🤔 **Edge Cases & Gray Areas**

### Contextual Analysis Required:

#### Case 1: Loading States
```typescript
// ❓ Context-dependent
const [isSubmitting, setIsSubmitting] = useState(false);

// 🎨 VIEW STATE if: Just for button spinner, user feedback
// 🏢 BUSINESS STATE if: Prevents duplicate submissions, affects business logic
```

#### Case 2: Selection State
```typescript
// ❓ Context-dependent  
const [selectedItems, setSelectedItems] = useState<string[]>([]);

// 🎨 VIEW STATE if: Multi-select UI for display filtering
// 🏢 BUSINESS STATE if: Items selected for business operation (delete, approve)
```

#### Case 3: Filter/Search State
```typescript
// ❓ Context-dependent
const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState<FilterState>({});

// 🎨 VIEW STATE if: Just for immediate UI filtering, not persisted
// 🏢 BUSINESS STATE if: Affects data fetching, needs URL persistence, affects analytics
```

#### Case 4: Form State During Editing
```typescript
// ❓ Context-dependent
const [draftData, setDraftData] = useState<FormData>({});

// 🎨 VIEW STATE if: Temporary edit state before save/cancel
// 🏢 BUSINESS STATE if: Auto-saved drafts, validation during typing
```

---

## 🔍 **Decision Framework**

### Ask These Questions:

#### 1. **Persistence Test**
- Does this state need to survive component unmounts? → **Business**
- Is it purely ephemeral UI feedback? → **View**

#### 2. **API Test** 
- Would this state be sent to/from an API? → **Business**
- Is it purely for rendering logic? → **View**

#### 3. **Test Suite Test**
- Would you write unit tests for this state's business logic? → **Business**  
- Would you only test it in UI/integration tests? → **View**

#### 4. **Transfer Test**
- Could this state be useful in other components/contexts? → **Business**
- Is it specific to this one component's rendering? → **View**

#### 5. **Business Rule Test**
- Does changing this state trigger business validation/calculations? → **Business**
- Does it only affect visual appearance? → **View**

---

## 📋 **Practical Classification Examples**

### Healthcare Form Context:

```typescript
// 🎨 VIEW STATE
const [showMinorWarning, setShowMinorWarning] = useState(false); // UI feedback
const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({}); // Error highlighting
const [formExpanded, setFormExpanded] = useState(true); // Accordion state
const [saveButtonAnimating, setSaveButtonAnimating] = useState(false); // Animation

// 🏢 BUSINESS STATE  
const [patientData, setPatientData] = useState<PatientDemographics>({}); // Domain entity
const [validationResults, setValidationResults] = useState<ValidationResult>(null); // Business rules
const [isMinor, setIsMinor] = useState(false); // Derived business logic
const [eligibilityStatus, setEligibilityStatus] = useState<EligibilityStatus>('pending'); // External service state

// 🤔 CONTEXT-DEPENDENT
const [isDirty, setIsDirty] = useState(false); 
// → Business if: Prevents data loss, triggers auto-save
// → View if: Just for UI indication, no business impact

const [currentFormStep, setCurrentFormStep] = useState(1);
// → Business if: Part of workflow state, affects available actions  
// → View if: Just for progress display, no business rules
```

---

## 🎯 **Architecture Recommendations**

### Where to Place Each Type:

#### 🎨 View State → React Component State
```typescript
function FormComponent() {
  const [showTooltip, setShowTooltip] = useState(false); // ✅ Local state
  const [fieldFocus, setFieldFocus] = useState<string | null>(null); // ✅ Local state
  
  return (
    <div>
      {/* UI rendering logic */}
    </div>
  );
}
```

#### 🏢 Business State → Service Layer
```typescript
@Service()
class DemographicsFormService {
  // ✅ Business state in service
  private formDataSubject = new BehaviorSubject<PatientDemographics>({});
  private validationResultsSubject = new BehaviorSubject<ValidationResult>(null);
  
  // ✅ Business logic methods
  updateField(field: string, value: any): void { /* ... */ }
  validateForm(): Promise<ValidationResult> { /* ... */ }
}
```

#### 🤔 Hybrid State → Context or Shared Service
```typescript
// For state that's business-relevant but UI-scoped
const FormUIContext = createContext({
  isDirty: false,
  currentStep: 1,
  // ... other contextual state
});
```

---

## 🚦 **Anti-Patterns to Avoid**

### ❌ Business State in Components
```typescript
// DON'T: Business validation in component
function FormComponent() {
  const [errors, setErrors] = useState([]);
  
  const validateSSN = (ssn: string) => {
    // Complex business validation logic in component
    if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
      setErrors(prev => [...prev, 'Invalid SSN format']);
    }
  };
}
```

### ❌ View State in Services  
```typescript
// DON'T: UI state in business service
@Service()
class FormService {
  private tooltipVisibleSubject = new BehaviorSubject(false); // ❌ Not business concern
  private buttonHoverSubject = new BehaviorSubject(false);    // ❌ Pure UI state
}
```

### ❌ Mixed Concerns
```typescript
// DON'T: Mixing view and business state
const [formState, setFormState] = useState({
  patientData: {},        // 🏢 Business state
  showTooltip: false,     // 🎨 View state - should be separate!
  validationErrors: [],   // 🏢 Business state  
  fieldFocus: null        // 🎨 View state - should be separate!
});
```

---

## ✅ **Summary Decision Tree**

```
Is this state...
├── Only for visual feedback/interaction?
│   └── 🎨 VIEW STATE (Component)
├── Representing domain data/business rules?
│   └── 🏢 BUSINESS STATE (Service)  
├── UI-scoped but affects business logic?
│   └── 🤔 CONTEXT STATE (React Context/Shared Service)
└── Unclear?
    └── Apply the 5 tests above ⬆️
```

The key is to think about **who cares** about the state:
- Only the UI? → View State
- The business domain? → Business State  
- Both, but scoped to UI flow? → Context State