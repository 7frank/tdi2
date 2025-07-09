# View State Location Guide

## 🎯 **Decision Matrix: Component vs Service**

| View State Type | Location | Reason | Example |
|----------------|----------|---------|---------|
| **Component-local UI** | Component | Single component scope | Modal open/close, dropdown state |
| **Cross-component UI** | Service | Shared across components | Sidebar collapsed, theme |
| **Form presentation** | Component | Tied to specific form | Field focus, show password |
| **App-wide UI** | Service | Global application state | Loading overlay, toast notifications |
| **Reusable patterns** | Service | Multiple forms use it | Validation summary display mode |

## 🏠 **Component State (Local View State)**

### ✅ **Use Component State For:**
- Ephemeral UI interactions
- Single-component scope
- No business logic dependency
- Doesn't affect other parts of app

```typescript
function DemographicsForm({ services: { demographicsForm } }) {
  // ✅ Component-local view state
  const [showPassword, setShowPassword] = useState(false);
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['personal']);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Business state from service
  const { formData, validationResults } = demographicsForm.state;

  const handleSubmit = async () => {
    try {
      await demographicsForm.submitForm();
      // View state: Show success animation
      setShowSuccessAnimation(true);
    } catch (error) {
      // View state: Show validation summary on error
      setShowValidationSummary(true);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset 
        className={expandedSections.includes('personal') ? 'expanded' : 'collapsed'}
      >
        <legend onClick={() => toggleSection('personal')}>
          Personal Information
        </legend>
        
        <input
          type={showPassword ? 'text' : 'password'}
          onFocus={() => setFieldFocus('ssn')}
          onBlur={() => setFieldFocus(null)}
          className={fieldFocus === 'ssn' ? 'focused' : ''}
        />
        
        <button 
          type="button"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? 'Hide' : 'Show'} SSN
        </button>
      </fieldset>

      {showValidationSummary && validationResults?.errors && (
        <ValidationSummary 
          errors={validationResults.errors}
          onClose={() => setShowValidationSummary(false)}
        />
      )}
    </form>
  );
}
```

## 🏢 **Service State (Shared View State)**

### ✅ **Use Service State For:**
- Cross-component coordination
- Reusable UI patterns
- App-wide UI state
- Complex UI state logic

```typescript
// UI Coordination Service
@Service()
class UICoordinationService {
  state = {
    // App-wide UI state
    sidebarCollapsed: false,
    currentTheme: 'light' as 'light' | 'dark',
    loadingOverlay: false,
    
    // Form-specific UI patterns
    showValidationMode: 'inline' as 'inline' | 'summary' | 'toast',
    formLayout: 'wizard' as 'wizard' | 'accordion' | 'tabs',
    
    // Cross-form UI state
    unsavedChangesWarning: false,
    formNavigationLocked: false
  };

  // UI coordination methods
  toggleSidebar(): void {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.state.currentTheme = theme;
    document.body.className = `theme-${theme}`;
  }

  showGlobalLoading(): void {
    this.state.loadingOverlay = true;
  }

  hideGlobalLoading(): void {
    this.state.loadingOverlay = false;
  }

  // Form UI coordination
  setValidationDisplayMode(mode: 'inline' | 'summary' | 'toast'): void {
    this.state.showValidationMode = mode;
  }

  lockFormNavigation(reason: string): void {
    this.state.formNavigationLocked = true;
    this.state.unsavedChangesWarning = true;
  }

  unlockFormNavigation(): void {
    this.state.formNavigationLocked = false;
    this.state.unsavedChangesWarning = false;
  }
}

// Toast Notification Service (App-wide UI)
@Service()
class ToastService {
  state = {
    toasts: [] as Toast[],
    maxToasts: 5,
    defaultDuration: 5000
  };

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const toast: Toast = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };

    this.state.toasts.push(toast);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(toast.id);
    }, this.state.defaultDuration);

    // Limit max toasts
    if (this.state.toasts.length > this.state.maxToasts) {
      this.state.toasts.shift();
    }
  }

  removeToast(id: string): void {
    this.state.toasts = this.state.toasts.filter(toast => toast.id !== id);
  }
}

// Form Layout Service (Reusable UI patterns)
@Service()
class FormLayoutService {
  state = {
    // Reusable across multiple forms
    accordionStates: new Map<string, string[]>(), // formId -> expanded sections
    wizardProgress: new Map<string, number>(),     // formId -> current step
    fieldVisibility: new Map<string, Record<string, boolean>>() // formId -> field visibility
  };

  toggleAccordionSection(formId: string, sectionId: string): void {
    const currentSections = this.state.accordionStates.get(formId) || [];
    
    if (currentSections.includes(sectionId)) {
      // Collapse
      this.state.accordionStates.set(
        formId, 
        currentSections.filter(id => id !== sectionId)
      );
    } else {
      // Expand
      this.state.accordionStates.set(formId, [...currentSections, sectionId]);
    }
  }

  setWizardStep(formId: string, step: number): void {
    this.state.wizardProgress.set(formId, step);
  }

  setFieldVisibility(formId: string, fieldId: string, visible: boolean): void {
    const formVisibility = this.state.fieldVisibility.get(formId) || {};
    formVisibility[fieldId] = visible;
    this.state.fieldVisibility.set(formId, formVisibility);
  }

  // Get state for specific form
  getFormState(formId: string) {
    return {
      expandedSections: this.state.accordionStates.get(formId) || [],
      currentStep: this.state.wizardProgress.get(formId) || 0,
      fieldVisibility: this.state.fieldVisibility.get(formId) || {}
    };
  }
}
```

## 🤔 **Mixed Approach: When to Use Both**

### **Complex Form with Mixed State:**

```typescript
function InsuranceForm({ services: { insuranceForm, uiCoordination, formLayout } }) {
  // ✅ Component-local UI state
  const [showEligibilityDetails, setShowEligibilityDetails] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  
  // ✅ Service UI state (reusable patterns)
  const { showValidationMode } = uiCoordination.state;
  const formState = formLayout.getFormState('insurance');
  
  // ✅ Business state from service
  const { formData, validationResults, eligibilityCheck } = insuranceForm.state;

  const handleFieldError = (fieldId: string, hasError: boolean) => {
    // Local view state for immediate feedback
    setFieldErrors(prev => ({ ...prev, [fieldId]: hasError }));
  };

  const toggleSection = (sectionId: string) => {
    // Reusable UI pattern via service
    formLayout.toggleAccordionSection('insurance', sectionId);
  };

  return (
    <form>
      {/* Section visibility controlled by service */}
      {formState.expandedSections.includes('primary') && (
        <fieldset>
          <legend onClick={() => toggleSection('primary')}>
            Primary Insurance
          </legend>
          
          <input
            className={fieldErrors.provider ? 'error' : ''}
            onChange={(e) => {
              insuranceForm.updateField('provider', e.target.value);
              handleFieldError('provider', false); // Clear local error state
            }}
          />
        </fieldset>
      )}

      {/* Local component state for this specific interaction */}
      <button 
        type="button"
        onClick={() => setShowEligibilityDetails(!showEligibilityDetails)}
      >
        {showEligibilityDetails ? 'Hide' : 'Show'} Eligibility Details
      </button>

      {showEligibilityDetails && (
        <div className="eligibility-details">
          <p>Status: {eligibilityCheck.result}</p>
          <p>Last Checked: {eligibilityCheck.lastChecked?.toLocaleString()}</p>
        </div>
      )}

      {/* Validation display mode controlled by service */}
      {showValidationMode === 'summary' && validationResults?.errors && (
        <ValidationSummary errors={validationResults.errors} />
      )}
      
      {showValidationMode === 'inline' && validationResults?.errors.map(error => (
        <div key={error.field} className="inline-error">
          {error.message}
        </div>
      ))}
    </form>
  );
}
```

## 📋 **Practical Guidelines**

### **Component State When:**
- ✅ Single component interaction (modal open, tooltip hover)
- ✅ Temporary UI feedback (button loading, animation states)
- ✅ Form field focus/validation highlighting
- ✅ Component-specific preferences (show/hide sections)
- ✅ Ephemeral state that dies with component unmount

### **Service State When:**
- ✅ Multiple components need the same UI state (theme, sidebar)
- ✅ UI state survives component unmount (form layout preferences)
- ✅ Cross-component coordination (disable all forms during submission)
- ✅ Reusable UI patterns (accordion behavior, wizard steps)
- ✅ App-wide UI features (notifications, loading overlays)

### **Anti-Patterns to Avoid:**

```typescript
// ❌ DON'T: Business logic in component state
function BadForm() {
  const [validationResults, setValidationResults] = useState([]); // Business state!
  const [formData, setFormData] = useState({}); // Business state!
}

// ❌ DON'T: Component-specific UI state in service
@Service()
class BadUIService {
  state = {
    button1Hovered: false, // Too specific!
    modal3Visible: false,  // Component-local!
    dropdown7Open: false   // Single-use state!
  };
}

// ✅ DO: Clear separation
function GoodForm({ services: { businessService, uiService } }) {
  // Component view state
  const [showDetails, setShowDetails] = useState(false);
  
  // Business state from service
  const { formData } = businessService.state;
  
  // Shared UI state from service
  const { theme } = uiService.state;
}
```

## 🎯 **Healthcare Forms Recommendation**

### **Component State:**
```typescript
// Field-level interactions
const [focusedField, setFocusedField] = useState<string | null>(null);
const [showSSN, setShowSSN] = useState(false);
const [tooltipVisible, setTooltipVisible] = useState(false);

// Form-specific UI
const [showMinorWarning, setShowMinorWarning] = useState(false);
const [eligibilityDetailsExpanded, setEligibilityDetailsExpanded] = useState(false);
```

### **Service State:**
```typescript
@Service()
class HealthcareUIService {
  state = {
    // Cross-form coordination
    currentFormTheme: 'healthcare-blue',
    showValidationSummary: true,
    formWizardMode: true,
    
    // Reusable patterns
    sectionStates: new Map(), // Which sections are expanded across forms
    fieldVisibility: new Map(), // Conditional field visibility rules
    
    // App-wide healthcare UI
    patientBanner: { visible: true, patientId: null },
    urgentAlerts: [],
    complianceWarnings: []
  };
}
```

**Bottom line:** Keep it simple - component for local, service for shared! 🎯