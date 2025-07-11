import React from "react";
import { CollapsibleSection, useCollapsibleSections } from "./CollapsibleSection";
import { FormActions } from "./FormActions";
import { ValidationErrors, type ValidationError } from "./ValidationErrors";
import { Alert } from "./Alert";
import { ProgressBar } from "./ProgressBar";

export interface FormContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  
  // Form state
  isSubmitting?: boolean;
  isDirty?: boolean;
  validationErrors?: ValidationError[];
  submitError?: string;
  successMessage?: string;
  
  // Form actions
  onSubmit?: () => void;
  onReset?: () => void;
  onCancel?: () => void;
  submitText?: string;
  canSubmit?: boolean;
  
  // Progress tracking
  progress?: number;
  showProgress?: boolean;
  progressLabel?: string;
  
  // Layout options
  variant?: 'default' | 'card' | 'modal' | 'wizard';
  size?: 'small' | 'medium' | 'large' | 'full';
  collapsible?: boolean;
  initiallyExpanded?: boolean;
  
  // Visual options
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  showUnsavedWarning?: boolean;
  
  // Accessibility
  formId?: string;
  describedBy?: string;
  
  className?: string;
}

export function FormContainer({
  title,
  subtitle,
  children,
  
  isSubmitting = false,
  isDirty = false,
  validationErrors = [],
  submitError,
  successMessage,
  
  onSubmit,
  onReset,
  onCancel,
  submitText = "Submit",
  canSubmit = true,
  
  progress,
  showProgress = false,
  progressLabel,
  
  variant = 'default',
  size = 'medium',
  collapsible = false,
  initiallyExpanded = true,
  
  icon,
  headerActions,
  showUnsavedWarning = true,
  
  formId,
  describedBy,
  
  className = ""
}: FormContainerProps) {
  const { isExpanded, toggleSection } = useCollapsibleSections(
    initiallyExpanded ? ['main'] : []
  );

  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);

  React.useEffect(() => {
    if (successMessage) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const getSizeStyles = () => {
    const sizes = {
      small: { maxWidth: '400px', padding: '16px' },
      medium: { maxWidth: '600px', padding: '20px' },
      large: { maxWidth: '800px', padding: '24px' },
      full: { maxWidth: '100%', padding: '20px' },
    };
    return sizes[size];
  };

  const getVariantStyles = (): React.CSSProperties => {
    const variants = {
      default: {
        background: 'transparent',
        border: 'none',
        borderRadius: '0',
        boxShadow: 'none',
      },
      card: {
        background: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      },
      modal: {
        background: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      },
      wizard: {
        background: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        position: 'relative' as const,
      },
    };
    return variants[variant];
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const containerStyle: React.CSSProperties = {
    ...sizeStyles,
    ...variantStyles,
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: variant === 'default' ? '20px' : '24px',
    paddingBottom: variant !== 'default' ? '16px' : '0',
    borderBottom: variant !== 'default' ? '1px solid #e9ecef' : 'none',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: size === 'small' ? '20px' : size === 'large' ? '28px' : '24px',
    fontWeight: '600',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const subtitleStyle: React.CSSProperties = {
    margin: '8px 0 0 0',
    fontSize: size === 'small' ? '14px' : '16px',
    color: '#6c757d',
    lineHeight: 1.4,
  };

  const contentStyle: React.CSSProperties = {
    marginBottom: validationErrors.length > 0 || submitError || showSuccessMessage ? '20px' : '0',
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  const renderHeader = () => (
    <div style={headerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h1 style={titleStyle}>
            {icon && <span>{icon}</span>}
            {title}
          </h1>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>
        
        {headerActions && (
          <div style={{ marginLeft: '16px' }}>
            {headerActions}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && typeof progress === 'number' && (
        <div style={{ marginTop: '16px' }}>
          <ProgressBar
            progress={progress}
            showPercentage={true}
            label={progressLabel}
            animated={true}
            color="primary"
            size="medium"
          />
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (collapsible) {
      return (
        <CollapsibleSection
          id="main"
          title="Form Fields"
          isExpanded={isExpanded('main')}
          onToggle={toggleSection}
          variant="default"
        >
          {children}
        </CollapsibleSection>
      );
    }

    return <div style={contentStyle}>{children}</div>;
  };

  const renderMessages = () => (
    <>
      {/* Success message */}
      {showSuccessMessage && successMessage && (
        <Alert
          type="success"
          title="Success!"
          message={successMessage}
          dismissible={true}
          onDismiss={() => setShowSuccessMessage(false)}
        />
      )}

      {/* Submit error */}
      {submitError && (
        <Alert
          type="error"
          title="Submission Error"
          message={submitError}
          dismissible={false}
        />
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <ValidationErrors
          errors={validationErrors}
          variant="summary"
          groupByField={true}
          collapsible={validationErrors.length > 5}
        />
      )}

      {/* Unsaved changes warning */}
      {isDirty && showUnsavedWarning && !isSubmitting && (
        <Alert
          type="warning"
          title="Unsaved Changes"
          message="You have unsaved changes. Make sure to save before leaving this page."
          dismissible={true}
        />
      )}
    </>
  );

  const renderFormActions = () => {
    if (!onSubmit && !onReset && !onCancel) {
      return null;
    }

    return (
      <FormActions
        onSubmit={onSubmit}
        submitText={submitText}
        canSubmit={canSubmit && validationErrors.length === 0}
        isSubmitting={isSubmitting}
        onReset={onReset}
        onCancel={onCancel}
        showReset={!!onReset}
        showCancel={!!onCancel}
        variant={variant === 'default' ? 'default' : 'card'}
        alignment={variant === 'modal' ? 'right' : 'left'}
      />
    );
  };

  return (
    <div style={containerStyle} className={className}>
      <form 
        onSubmit={handleFormSubmit}
        id={formId}
        aria-describedby={describedBy}
        noValidate
      >
        {renderHeader()}
        {renderMessages()}
        {renderContent()}
        {renderFormActions()}
      </form>
    </div>
  );
}

// Preset form container variants
export const CardForm = (props: Omit<FormContainerProps, 'variant'>) => (
  <FormContainer {...props} variant="card" />
);

export const ModalForm = (props: Omit<FormContainerProps, 'variant' | 'size'>) => (
  <FormContainer {...props} variant="modal" size="medium" />
);

export const WizardForm = (props: Omit<FormContainerProps, 'variant'>) => (
  <FormContainer {...props} variant="wizard" showProgress={true} />
);

export const CompactForm = (props: Omit<FormContainerProps, 'size' | 'variant'>) => (
  <FormContainer {...props} size="small" variant="card" />
);

// Form wrapper with validation and state management
export interface ManagedFormProps extends Omit<FormContainerProps, 'validationErrors' | 'canSubmit' | 'isDirty'> {
  validationSchema?: any;
  onValidate?: (data: any) => ValidationError[];
  autoValidate?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

export function ManagedForm({
  validationSchema,
  onValidate,
  autoValidate = true,
  validateOnBlur = true,
  validateOnChange = false,
  children,
  ...formProps
}: ManagedFormProps) {
  const [formData, setFormData] = React.useState({});
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  const validateForm = React.useCallback((data = formData) => {
    if (!onValidate && !validationSchema) return [];
    
    const errors = onValidate ? onValidate(data) : [];
    setValidationErrors(errors);
    return errors;
  }, [formData, onValidate, validationSchema]);

  const handleFieldChange = React.useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    if (validateOnChange) {
      validateForm({ ...formData, [field]: value });
    }
  }, [formData, validateOnChange, validateForm]);

  const handleFieldBlur = React.useCallback((field: string) => {
    setTouchedFields(prev => new Set([...prev, field]));
    
    if (validateOnBlur) {
      validateForm();
    }
  }, [validateOnBlur, validateForm]);

  React.useEffect(() => {
    if (autoValidate && isDirty) {
      const timer = setTimeout(() => {
        validateForm();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData, autoValidate, isDirty, validateForm]);

  const canSubmit = validationErrors.length === 0 && isDirty;

  return (
    <FormContainer
      {...formProps}
      validationErrors={validationErrors}
      canSubmit={canSubmit}
      isDirty={isDirty}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onChange: handleFieldChange,
            onBlur: handleFieldBlur,
            ...child.props,
          });
        }
        return child;
      })}
    </FormContainer>
  );
}