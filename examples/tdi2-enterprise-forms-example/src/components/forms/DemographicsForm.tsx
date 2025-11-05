import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { DemographicsFormServiceInterface } from "../../services/DemographicsFormService";
import {
  FormContainer,
  CollapsibleSection,
  useCollapsibleSections,
  FormField,
  Alert,
  ValidationErrors,
  FormActions,
  type ValidationError
} from "../common";

interface DemographicsFormProps {
  services: {
    demographicsForm: Inject<DemographicsFormServiceInterface>;
  };
  onComplete: () => void;
}

export function DemographicsForm(props: DemographicsFormProps) {
  const {
    services: { demographicsForm },
    onComplete,
  } = props;

  // 🎨 COMPONENT VIEW STATE: UI-only interactions (ephemeral, component-specific)
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const { expandedSections, toggleSection, isExpanded } = useCollapsibleSections(['personal', 'address']);

  // Business state from service (reactive via proxy)
  const { formData, validationResults, isSubmitting, isDirty } = demographicsForm.state;
  
  // 🎨 VIEW STATE from service: Cross-form UI coordination
  const { validationDebounceActive, lastValidationTime } = demographicsForm.state;

  const handleSubmit = async () => {
    try {
      await demographicsForm.submitForm();
      onComplete();
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  const handleReset = () => {
    demographicsForm.resetForm();
    setFocusedField(null); // 🎨 COMPONENT VIEW STATE: Reset local state
  };

  const getFieldError = (field: string) => {
    return validationResults?.errors.find((error) =>
      error.field.includes(field)
    )?.message;
  };

  // Convert validation results to our ValidationError format
  const convertedErrors: ValidationError[] = validationResults?.errors.map(error => ({
    field: error.field,
    message: error.message,
    code: error.code,
    severity: 'error' as const
  })) || [];

  // Calculate form progress
  const calculateProgress = () => {
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'ssn', 'gender',
      'address.street', 'address.city', 'address.state', 'address.zipCode',
      'phone', 'email'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const keys = field.split('.');
      let value = formData;
      for (const key of keys) {
        value = value?.[key];
      }
      return value && value.toString().trim() !== '';
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  return (
    <FormContainer
      title="Patient Demographics"
      subtitle="Please provide your basic information for our records"
      icon="👤"
      variant="card"
      size="medium"
      showProgress={true}
      progress={calculateProgress()}
      progressLabel="Form Completion"
      validationErrors={convertedErrors}
      onSubmit={handleSubmit}
      onReset={handleReset}
      submitText="Continue to Insurance"
      canSubmit={validationResults?.isValid || false}
      isSubmitting={isSubmitting}
      isDirty={isDirty}
      showUnsavedWarning={true}
      headerActions={
        // 🎨 VIEW STATE: Validation feedback indicator
        validationDebounceActive ? (
          <span style={{ color: "#007bff", fontSize: "12px" }}>
            🔄 Validating...
          </span>
        ) : lastValidationTime ? (
          <span style={{ color: "#28a745", fontSize: "12px" }}>
            ✅ Last validated: {lastValidationTime.toLocaleTimeString()}
          </span>
        ) : null
      }
    >
      {/* Personal Information Section */}
      <CollapsibleSection
        id="personal"
        title="Personal Information"
        icon="👤"
        isExpanded={isExpanded('personal')}
        onToggle={toggleSection}
        variant="bordered"
      >
        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
          <div style={{ flex: 1 }}>
            <FormField
              label="First Name"
              value={formData.firstName || ""}
              onChange={(value) => demographicsForm.updateField("firstName", value)}
              error={getFieldError("firstName")}
              required={true}
              isFocused={focusedField === "firstName"}
              onFocus={() => setFocusedField("firstName")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <FormField
              label="Last Name"
              value={formData.lastName || ""}
              onChange={(value) => demographicsForm.updateField("lastName", value)}
              error={getFieldError("lastName")}
              required={true}
              isFocused={focusedField === "lastName"}
              onFocus={() => setFocusedField("lastName")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <FormField
          label="Date of Birth"
          type="date"
          value={formData.dateOfBirth || ""}
          onChange={(value) => demographicsForm.updateField("dateOfBirth", value)}
          error={getFieldError("dateOfBirth")}
          required={true}
          helperText={formData.age ? `Age: ${formData.age}` : undefined}
          isFocused={focusedField === "dateOfBirth"}
          onFocus={() => setFocusedField("dateOfBirth")}
          onBlur={() => setFocusedField(null)}
        />

        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
          <div style={{ flex: 1 }}>
            <FormField
              label="SSN"
              type="password"
              placeholder="123-45-6789"
              value={formData.ssn || ""}
              onChange={(value) => demographicsForm.updateField("ssn", value)}
              error={getFieldError("ssn")}
              required={true}
              showPasswordToggle={true}
              isFocused={focusedField === "ssn"}
              onFocus={() => setFocusedField("ssn")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          <div style={{ flex: 1 }}>
            <FormField
              label="Gender"
              type="select"
              value={formData.gender || ""}
              onChange={(value) => demographicsForm.updateField("gender", value)}
              error={getFieldError("gender")}
              required={true}
              placeholder="Select Gender"
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
                { value: "prefer-not-to-say", label: "Prefer not to say" }
              ]}
              isFocused={focusedField === "gender"}
              onFocus={() => setFocusedField("gender")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Address Section */}
      <CollapsibleSection
        id="address"
        title="Address Information"
        icon="🏠"
        isExpanded={isExpanded('address')}
        onToggle={toggleSection}
        variant="bordered"
      >
        <FormField
          label="Street Address"
          value={formData.address?.street || ""}
          onChange={(value) => demographicsForm.updateField("address.street", value)}
          error={getFieldError("address.street")}
          required={true}
          isFocused={focusedField === "address.street"}
          onFocus={() => setFocusedField("address.street")}
          onBlur={() => setFocusedField(null)}
        />

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <div style={{ flex: 1 }}>
            <FormField
              label="City"
              value={formData.address?.city || ""}
              onChange={(value) => demographicsForm.updateField("address.city", value)}
              error={getFieldError("address.city")}
              required={true}
              isFocused={focusedField === "address.city"}
              onFocus={() => setFocusedField("address.city")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          <div style={{ width: "80px" }}>
            <FormField
              label="State"
              placeholder="CA"
              maxLength={2}
              value={formData.address?.state || ""}
              onChange={(value) => demographicsForm.updateField("address.state", value.toUpperCase())}
              error={getFieldError("address.state")}
              required={true}
              isFocused={focusedField === "address.state"}
              onFocus={() => setFocusedField("address.state")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          <div style={{ width: "120px" }}>
            <FormField
              label="ZIP Code"
              placeholder="12345"
              value={formData.address?.zipCode || ""}
              onChange={(value) => demographicsForm.updateField("address.zipCode", value)}
              error={getFieldError("address.zipCode")}
              required={true}
              isFocused={focusedField === "address.zipCode"}
              onFocus={() => setFocusedField("address.zipCode")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Contact Information Section */}
      <CollapsibleSection
        id="contact"
        title="Contact Information"
        icon="📞"
        isExpanded={isExpanded('contact')}
        onToggle={toggleSection}
        variant="bordered"
      >
        <FormField
          label="Phone Number"
          type="tel"
          placeholder="(555) 123-4567"
          value={formData.phone || ""}
          onChange={(value) => demographicsForm.updateField("phone", value)}
          error={getFieldError("phone")}
          required={true}
          isFocused={focusedField === "phone"}
          onFocus={() => setFocusedField("phone")}
          onBlur={() => setFocusedField(null)}
        />

        <FormField
          label="Email Address"
          type="email"
          value={formData.email || ""}
          onChange={(value) => demographicsForm.updateField("email", value)}
          error={getFieldError("email")}
          required={true}
          isFocused={focusedField === "email"}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
        />
      </CollapsibleSection>

      {/* Minor Patient Warning */}
      {formData.age && formData.age < 18 && (
        <Alert
          type="warning"
          title="Minor Patient Detected"
          message="Guardian consent will be required in the next step."
          icon="⚠️"
        />
      )}
    </FormContainer>
  );
}