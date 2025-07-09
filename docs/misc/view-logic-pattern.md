# View Logic Patterns: Service vs Presenter vs Reducer

## 🎯 **When View Logic Gets Complex**

### **Signs You Need an Abstraction:**
- Multiple components share the same view logic
- Complex UI state transformations
- View state has business rules (conditional visibility, validation modes)
- Cross-component UI coordination
- Reusable UI patterns

## 🏗️ **Option 1: View Service (RSI Pattern)**

### **Best For:** Shared view logic across multiple components

```typescript
@Service()
class FormViewService {
  state = {
    // Shared view state
    validationDisplayMode: 'inline' as 'inline' | 'summary' | 'modal',
    sectionStates: new Map<string, string[]>(),
    fieldVisibility: new Map<string, Record<string, boolean>>(),
    animationStates: new Map<string, Record<string, boolean>>(),
    
    // UI coordination
    focusedForm: null as string | null,
    globalTheme: 'healthcare-professional',
    accessibilityMode: false
  };

  // Direct methods - RSI KISS style
  toggleSection(formId: string, sectionId: string): void {
    const current = this.state.sectionStates.get(formId) || [];
    if (current.includes(sectionId)) {
      this.state.sectionStates.set(formId, current.filter(id => id !== sectionId));
    } else {
      this.state.sectionStates.set(formId, [...current, sectionId]);
    }
  }

  setValidationMode(mode: 'inline' | 'summary' | 'modal'): void {
    this.state.validationDisplayMode = mode;
  }

  showFieldWithAnimation(formId: string, fieldId: string): void {
    // Complex view logic
    const visibility = this.state.fieldVisibility.get(formId) || {};
    const animations = this.state.animationStates.get(formId) || {};
    
    visibility[fieldId] = true;
    animations[fieldId] = true;
    
    this.state.fieldVisibility.set(formId, visibility);
    this.state.animationStates.set(formId, animations);
    
    // Reset animation after delay
    setTimeout(() => {
      const newAnimations = this.state.animationStates.get(formId) || {};
      newAnimations[fieldId] = false;
      this.state.animationStates.set(formId, newAnimations);
    }, 300);
  }

  // Complex view calculations
  getFieldClasses(formId: string, fieldId: string): string[] {
    const visibility = this.state.fieldVisibility.get(formId) || {};
    const animations = this.state.animationStates.get(formId) || {};
    
    const classes = [];
    if (visibility[fieldId]) classes.push('visible');
    if (animations[fieldId]) classes.push('animate-in');
    if (this.state.accessibilityMode) classes.push('accessible');
    
    return classes;
  }

  shouldShowField(formId: string, fieldId: string, businessData: any): boolean {
    // View logic that depends on business data
    const baseVisibility = this.state.fieldVisibility.get(formId)?.[fieldId] ?? true;
    
    // Healthcare-specific view rules
    if (fieldId === 'ssn' && this.state.accessibilityMode) return false;
    if (fieldId === 'guardian' && businessData.age >= 18) return false;
    
    return baseVisibility;
  }
}
```

### **✅ View Service Pros:**
- Shared across multiple components
- Direct method calls (RSI KISS)
- Proxy state for reactivity
- Easy to test and debug

### **❌ View Service Cons:**
- Can become large if not organized
- Mixing different concerns in one service

---

## 🎭 **Option 2: Presenter Pattern**

### **Best For:** View-specific transformations and complex presentation logic

```typescript
@Service()
class DemographicsFormPresenter {
  constructor(
    @Inject() private demographicsForm: DemographicsFormService,
    @Inject() private validationService: ValidationService,
    @Inject() private uiCoordination: UICoordinationService
  ) {}

  // Transform business data for view consumption
  get viewModel() {
    const businessData = this.demographicsForm.state.formData;
    const validation = this.demographicsForm.state.validationResults;
    const uiState = this.uiCoordination.state;

    return {
      // Transformed data for view
      displayFields: this.transformFieldsForDisplay(businessData),
      errorMessages: this.humanizeErrors(validation?.errors || []),
      fieldStates: this.calculateFieldStates(businessData, validation),
      
      // View commands
      canSubmit: this.calculateCanSubmit(businessData, validation),
      showSections: this.calculateVisibleSections(businessData, uiState),
      
      // UI state
      theme: this.selectTheme(businessData),
      validationMode: uiState.validationDisplayMode
    };
  }

  // View-specific business logic
  private transformFieldsForDisplay(data: any): any {
    return {
      fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      ageDisplay: data.age ? `${data.age} years old` : 'Age not calculated',
      ssnDisplay: this.formatSSN(data.ssn),
      addressDisplay: this.formatAddress(data.address)
    };
  }

  private humanizeErrors(errors: ValidationError[]): Record<string, string> {
    return errors.reduce((acc, error) => {
      acc[error.field] = this.makeErrorUserFriendly(error.message);
      return acc;
    }, {} as Record<string, string>);
  }

  private calculateFieldStates(data: any, validation: any): Record<string, FieldState> {
    const states: Record<string, FieldState> = {};
    
    Object.keys(data).forEach(field => {
      states[field] = {
        hasError: validation?.errors.some(e => e.field === field) || false,
        isRequired: this.isFieldRequired(field, data),
        isVisible: this.shouldShowField(field, data),
        cssClasses: this.calculateFieldClasses(field, data, validation)
      };
    });
    
    return states;
  }

  private calculateCanSubmit(data: any, validation: any): boolean {
    return validation?.isValid && 
           this.hasRequiredFields(data) && 
           !this.demographicsForm.state.isSubmitting;
  }

  // View event handlers
  onFieldChange(field: string, value: any): void {
    this.demographicsForm.updateField(field, value);
    
    // View-specific side effects
    if (field === 'dateOfBirth') {
      this.handleAgeCalculation(value);
    }
  }

  onSectionToggle(sectionId: string): void {
    this.uiCoordination.toggleSection('demographics', sectionId);
  }

  async onSubmit(): Promise<void> {
    try {
      await this.demographicsForm.submitForm();
      this.uiCoordination.showSuccessMessage('Demographics saved successfully');
    } catch (error) {
      this.uiCoordination.showErrorMessage('Failed to save demographics');
    }
  }

  private handleAgeCalculation(dateOfBirth: string): void {
    // View-specific logic for age calculation feedback
    const age = this.demographicsForm.calculateAge(dateOfBirth);
    
    if (age < 18) {
      this.uiCoordination.showInfoMessage('Minor patient - guardian consent required');
    }
  }
}

// Component becomes very simple
function DemographicsForm({ services: { presenter } }) {
  const viewModel = presenter.viewModel;

  return (
    <form onSubmit={() => presenter.onSubmit()}>
      <h2>Patient: {viewModel.displayFields.fullName}</h2>
      
      {viewModel.showSections.personal && (
        <fieldset>
          <input
            value={viewModel.displayFields.firstName || ''}
            onChange={(e) => presenter.onFieldChange('firstName', e.target.value)}
            className={viewModel.fieldStates.firstName?.cssClasses.join(' ')}
          />
          
          {viewModel.errorMessages.firstName && (
            <span className="error">{viewModel.errorMessages.firstName}</span>
          )}
        </fieldset>
      )}
      
      <button disabled={!viewModel.canSubmit}>Submit</button>
    </form>
  );
}
```

### **✅ Presenter Pros:**
- Complete view logic separation
- Rich view model transformations
- Component becomes purely declarative
- Easy to unit test presentation logic

### **❌ Presenter Cons:**
- More indirection
- Can become complex
- Tight coupling between presenter and specific view

---

## ⚙️ **Option 3: Reducer Pattern**

### **Best For:** Complex view state changes with clear actions

```typescript
// View state type
interface FormViewState {
  sectionStates: Record<string, boolean>;
  fieldStates: Record<string, FieldViewState>;
  validationMode: 'inline' | 'summary' | 'modal';
  animations: Record<string, boolean>;
  theme: string;
  accessibilityMode: boolean;
}

// View actions
type FormViewAction = 
  | { type: 'TOGGLE_SECTION'; sectionId: string }
  | { type: 'SET_FIELD_ERROR'; fieldId: string; hasError: boolean }
  | { type: 'SET_VALIDATION_MODE'; mode: 'inline' | 'summary' | 'modal' }
  | { type: 'ANIMATE_FIELD'; fieldId: string }
  | { type: 'SET_THEME'; theme: string }
  | { type: 'TOGGLE_ACCESSIBILITY' };

// Reducer function
function formViewReducer(state: FormViewState, action: FormViewAction): FormViewState {
  switch (action.type) {
    case 'TOGGLE_SECTION':
      return {
        ...state,
        sectionStates: {
          ...state.sectionStates,
          [action.sectionId]: !state.sectionStates[action.sectionId]
        }
      };

    case 'SET_FIELD_ERROR':
      return {
        ...state,
        fieldStates: {
          ...state.fieldStates,
          [action.fieldId]: {
            ...state.fieldStates[action.fieldId],
            hasError: action.hasError
          }
        }
      };

    case 'ANIMATE_FIELD':
      return {
        ...state,
        animations: {
          ...state.animations,
          [action.fieldId]: true
        }
      };

    case 'SET_VALIDATION_MODE':
      return {
        ...state,
        validationMode: action.mode
      };

    default:
      return state;
  }
}

// Service using reducer
@Service()
class FormViewService {
  private initialState: FormViewState = {
    sectionStates: {},
    fieldStates: {},
    validationMode: 'inline',
    animations: {},
    theme: 'healthcare',
    accessibilityMode: false
  };

  state = { ...this.initialState }; // Proxy state

  dispatch(action: FormViewAction): void {
    const newState = formViewReducer(this.state, action);
    
    // Update proxy state (maintains reactivity)
    Object.assign(this.state, newState);
    
    // Handle side effects
    this.handleSideEffects(action);
  }

  private handleSideEffects(action: FormViewAction): void {
    switch (action.type) {
      case 'ANIMATE_FIELD':
        // Reset animation after delay
        setTimeout(() => {
          this.dispatch({ type: 'RESET_ANIMATION', fieldId: action.fieldId });
        }, 300);
        break;
    }
  }

  // Convenience methods
  toggleSection(sectionId: string): void {
    this.dispatch({ type: 'TOGGLE_SECTION', sectionId });
  }

  setFieldError(fieldId: string, hasError: boolean): void {
    this.dispatch({ type: 'SET_FIELD_ERROR', fieldId, hasError });
  }

  animateField(fieldId: string): void {
    this.dispatch({ type: 'ANIMATE_FIELD', fieldId });
  }
}
```

### **✅ Reducer Pros:**
- Predictable state changes
- Easy to test each action
- Clear action history
- Great for complex state logic

### **❌ Reducer Cons:**
- More boilerplate
- Action explosion for complex UIs
- Less direct than method calls

---

## 🎯 **Recommendations for Your Healthcare Forms**

### **Use View Service (Option 1) When:**
- Multiple forms share similar UI patterns
- You want to keep RSI KISS approach
- View logic is moderate complexity
- You need cross-component coordination

```typescript
@Service()
class HealthcareFormViewService {
  state = {
    // Shared across all forms
    validationMode: 'inline',
    sectionStates: new Map(),
    theme: 'healthcare-professional'
  };

  // Simple, direct methods
  toggleSection(formId: string, sectionId: string): void { /* */ }
  setValidationMode(mode: string): void { /* */ }
}
```

### **Use Presenter (Option 2) When:**
- Complex view transformations needed
- You want completely passive components
- Heavy business-to-view data mapping
- Form has complex conditional logic

```typescript
@Service()
class InsuranceFormPresenter {
  get viewModel() {
    // Complex transformations here
    return {
      eligibilityBadge: this.createEligibilityBadge(),
      planOptions: this.filterAvailablePlans(),
      warningMessages: this.generateWarnings()
    };
  }
}
```

### **Use Reducer (Option 3) When:**
- Very complex view state transitions
- You need predictable state changes
- Multiple actions can affect same state
- You want time-travel debugging

```typescript
// For complex form wizards with many state transitions
@Service()
class FormWizardService {
  state = this.initialState;
  
  dispatch(action: WizardAction): void {
    this.state = wizardReducer(this.state, action);
  }
}
```

## 🏆 **Recommended Hybrid Approach**

### **For Your Healthcare Forms:**

```typescript
// 1. Simple View Service for shared patterns
@Service()
class HealthcareUIService {
  state = {
    theme: 'healthcare',
    validationMode: 'inline',
    sectionStates: new Map()
  };
  
  toggleSection(formId: string, sectionId: string): void { /* direct */ }
}

// 2. Presenter for complex forms
@Service() 
class InsuranceFormPresenter {
  get viewModel() { /* complex transformations */ }
  onFieldChange(field: string, value: any): void { /* view logic */ }
}

// 3. Component state for simple local interactions
function DemographicsForm() {
  const [showPassword, setShowPassword] = useState(false); // Simple local state
  const { theme } = healthcareUI.state; // Shared view state
  const viewModel = presenter.viewModel; // Complex view logic
}
```

**Bottom line:** Start with **View Service** for shared patterns, add **Presenter** for complex forms, only use **Reducer** if state logic gets very complex. Keep the RSI KISS principle! 🎯