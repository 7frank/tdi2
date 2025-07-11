import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { InsuranceFormServiceInterface } from "../../services/InsuranceFormService";
import {
  FormContainer,
  CollapsibleSection,
  useCollapsibleSections,
  FormField,
  Alert,
  ValidationErrors,
  LoadingButton,
  ProgressBar,
  type ValidationError
} from "../common";

interface InsuranceFormProps {
  services: {
    insuranceForm: Inject<InsuranceFormServiceInterface>;
  };
  onComplete: () => void;
}

export function InsuranceForm(props: InsuranceFormProps) {
  const { services: { insuranceForm }, onComplete } = props;
  
  // 🎨 COMPONENT VIEW STATE: UI-only interactions (ephemeral, component-specific)
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [showPlanTooltip, setShowPlanTooltip] = React.useState<string | null>(null);
  const [copyAnimationField, setCopyAnimationField] = React.useState<string | null>(null);
  const { expandedSections, toggleSection, isExpanded } = useCollapsibleSections(['primary']);

  // Business state from service (reactive via proxy)
  const { formData, validationResults, isSubmitting, eligibilityCheck } = insuranceForm.state;
  
  // 🎨 VIEW STATE from service: UI coordination states
  const { showEligibilityDetails, eligibilityStatusAnimation } = insuranceForm.state;

  const handleSubmit = async () => {
    try {
      await insuranceForm.submitForm();
      onComplete();
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  const handleEligibilityCheck = async () => {
    try {
      await insuranceForm.checkEligibility();
    } catch (error) {
      console.error("Eligibility check failed:", error);
    }
  };

  const handleReset = () => {
    insuranceForm.resetForm();
    setFocusedField(null);
    setCopyAnimationField(null);
    setShowPlanTooltip(null);
  };

  const getFieldError = (field: string) => {
    return validationResults?.errors.find((error) =>
      error.field.includes(field)
    )?.message;
  };

  const canCheckEligibility = () => {
    const { primaryInsurance } = formData;
    return (
      primaryInsurance?.provider &&
      primaryInsurance?.planType &&
      primaryInsurance?.memberId &&
      !eligibilityCheck.isChecking
    );
  };

  const copyToSecondary = (field: string) => {
    // 🎨 COMPONENT VIEW STATE: Copy animation feedback
    setCopyAnimationField(field);
    setTimeout(() => setCopyAnimationField(null), 500);
    
    const primaryValue = formData.primaryInsurance?.[field];
    if (primaryValue) {
      insuranceForm.updateField(`secondaryInsurance.${field}`, primaryValue);
    }
  };

  const getPlanDescription = (planType: string) => {
    const descriptions = {
      "PPO": "PPO plans offer flexibility to see specialists without referrals and access to out-of-network providers.",
      "HMO": "HMO plans require you to choose a primary care physician and get referrals for specialist care.",
      "EPO": "EPO plans combine features of HMO and PPO plans, with no referrals needed but network restrictions.",
      "POS": "POS plans require a primary care physician but allow some out-of-network coverage with higher costs.",
      "HDHP": "High Deductible Health Plans feature lower premiums but higher deductibles, often paired with HSAs."
    };
    return descriptions[planType] || "";
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
      'primaryInsurance.provider',
      'primaryInsurance.planType', 
      'primaryInsurance.memberId',
      'primaryInsurance.groupNumber',
      'primaryInsurance.effectiveDate'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const keys = field.split('.');
      let value = formData;
      for (const key of keys) {
        value = value?.[key];
      }
      return value && value.toString().trim() !== '';
    });
    
    let progress = (completedFields.length / requiredFields.length) * 80; // 80% for required fields
    
    // Add 20% if eligibility is verified
    if (eligibilityCheck.result === 'verified') {
      progress += 20;
    }
    
    return Math.round(progress);
  };

  return (
    <FormContainer
      title="Insurance Information"
      subtitle="Please provide your insurance details for coverage verification"
      icon="🏥"
      variant="card"
      size="large"
      showProgress={true}
      progress={calculateProgress()}
      progressLabel="Insurance Setup"
      validationErrors={convertedErrors}
      submitError={insuranceForm.state.submissionError}
      onSubmit={handleSubmit}
      onReset={handleReset}
      submitText="Continue to Medical History"
      canSubmit={insuranceForm.canSubmitForm()}
      isSubmitting={isSubmitting}
      isDirty={insuranceForm.state.isDirty}
      showUnsavedWarning={true}
    >
      {/* Primary Insurance Section */}
      <CollapsibleSection
        id="primary"
        title="Primary Insurance"
        icon="🏥"
        isExpanded={isExpanded('primary')}
        onToggle={toggleSection}
        variant="bordered"
      >
        <FormField
          label="Insurance Provider"
          placeholder="e.g., Blue Cross Blue Shield, Aetna, Cigna"
          value={formData.primaryInsurance?.provider || ""}
          onChange={(value) => insuranceForm.updateField("primaryInsurance.provider", value)}
          error={getFieldError("primaryInsurance.provider")}
          required={true}
          isFocused={focusedField === "primaryInsurance.provider"}
          onFocus={() => setFocusedField("primaryInsurance.provider")}
          onBlur={() => setFocusedField(null)}
        />

        <div style={{ position: "relative" }}>
          <FormField
            label="Plan Type"
            type="select"
            value={formData.primaryInsurance?.planType || ""}
            onChange={(value) => {
              insuranceForm.updateField("primaryInsurance.planType", value);
              setShowPlanTooltip(value);
              setTimeout(() => setShowPlanTooltip(null), 5000);
            }}
            error={getFieldError("primaryInsurance.planType")}
            required={true}
            placeholder="Select Plan Type"
            options={[
              { value: "HMO", label: "HMO - Health Maintenance Organization" },
              { value: "PPO", label: "PPO - Preferred Provider Organization" },
              { value: "EPO", label: "EPO - Exclusive Provider Organization" },
              { value: "POS", label: "POS - Point of Service" },
              { value: "HDHP", label: "HDHP - High Deductible Health Plan" }
            ]}
            isFocused={focusedField === "primaryInsurance.planType"}
            onFocus={() => setFocusedField("primaryInsurance.planType")}
            onBlur={() => setFocusedField(null)}
          />

          {/* Plan Type Tooltip */}
          {showPlanTooltip && (
            <Alert
              type="info"
              title={showPlanTooltip}
              message={getPlanDescription(showPlanTooltip)}
              variant="subtle"
              size="small"
            />
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <FormField
              label="Member ID"
              placeholder="Member ID"
              value={formData.primaryInsurance?.memberId || ""}
              onChange={(value) => insuranceForm.updateField("primaryInsurance.memberId", value)}
              error={getFieldError("primaryInsurance.memberId")}
              required={true}
              isFocused={focusedField === "primaryInsurance.memberId"}
              onFocus={() => setFocusedField("primaryInsurance.memberId")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormField
              label="Group Number"
              placeholder="Group Number"
              value={formData.primaryInsurance?.groupNumber || ""}
              onChange={(value) => insuranceForm.updateField("primaryInsurance.groupNumber", value)}
              error={getFieldError("primaryInsurance.groupNumber")}
              required={true}
              isFocused={focusedField === "primaryInsurance.groupNumber"}
              onFocus={() => setFocusedField("primaryInsurance.groupNumber")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <FormField
              label="Effective Date"
              type="date"
              value={formData.primaryInsurance?.effectiveDate || ""}
              onChange={(value) => insuranceForm.updateField("primaryInsurance.effectiveDate", value)}
              error={getFieldError("primaryInsurance.effectiveDate")}
              required={true}
              isFocused={focusedField === "primaryInsurance.effectiveDate"}
              onFocus={() => setFocusedField("primaryInsurance.effectiveDate")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormField
              label="Copay ($)"
              type="number"
              min={0}
              step={0.01}
              placeholder="25.00"
              value={formData.primaryInsurance?.copay || ""}
              onChange={(value) => insuranceForm.updateField("primaryInsurance.copay", parseFloat(value) || 0)}
              isFocused={focusedField === "primaryInsurance.copay"}
              onFocus={() => setFocusedField("primaryInsurance.copay")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormField
              label="Deductible ($)"
              type="number"
              min={0}
              step={0.01}
              placeholder="1000.00"
              value={formData.primaryInsurance?.deductible || ""}
              onChange={(value) => insuranceForm.updateField("primaryInsurance.deductible", parseFloat(value) || 0)}
              isFocused={focusedField === "primaryInsurance.deductible"}
              onFocus={() => setFocusedField("primaryInsurance.deductible")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Eligibility Check Section */}
      <CollapsibleSection
        id="eligibility"
        title="Insurance Eligibility Verification"
        icon="✅"
        isExpanded={true}
        onToggle={() => {}} // Always expanded
        variant="bordered"
        headerActions={
          <LoadingButton
            isLoading={false}
            loadingText=""
            variant="info"
            size="small"
            onClick={() => insuranceForm.toggleEligibilityDetails()}
          >
            {showEligibilityDetails ? "Hide Details" : "Show Details"}
          </LoadingButton>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
          <LoadingButton
            isLoading={eligibilityCheck.isChecking}
            loadingText="Checking..."
            variant="success"
            disabled={!canCheckEligibility()}
            onClick={handleEligibilityCheck}
            icon="🔍"
          >
            Check Eligibility
          </LoadingButton>
        </div>

        {/* Progress Bar */}
        {eligibilityCheck.isChecking && (
          <div style={{ marginBottom: "15px" }}>
            <ProgressBar
              progress={eligibilityCheck.checkingProgress}
              animated={true}
              showPercentage={false}
              label="Verifying with insurance provider..."
              color="primary"
              size="small"
            />
          </div>
        )}

        {/* Eligibility Result */}
        {eligibilityCheck.result && (
          <Alert
            type={eligibilityCheck.result === "verified" ? "success" : 
                 eligibilityCheck.result === "denied" ? "error" : "warning"}
            title={eligibilityCheck.result === "verified" ? "Eligibility Verified" : 
                   eligibilityCheck.result === "denied" ? "Eligibility Denied" : "Eligibility Pending"}
            message={showEligibilityDetails ? `Last checked: ${eligibilityCheck.lastChecked?.toLocaleString()}` : undefined}
            variant={eligibilityStatusAnimation ? "filled" : "subtle"}
          />
        )}
      </CollapsibleSection>

      {/* Secondary Insurance Section */}
      <CollapsibleSection
        id="secondary"
        title="Secondary Insurance (Optional)"
        icon="🏥"
        isExpanded={isExpanded('secondary')}
        onToggle={toggleSection}
        variant="bordered"
      >
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={!!formData.secondaryInsurance}
              onChange={(e) => {
                if (e.target.checked) {
                  insuranceForm.updateField("secondaryInsurance", {
                    provider: "",
                    memberId: "",
                    relationship: "self",
                  });
                } else {
                  insuranceForm.updateField("secondaryInsurance", undefined);
                }
              }}
            />
            I have secondary insurance coverage
          </label>
        </div>

        {formData.secondaryInsurance && (
          <>
            {/* Quick Copy from Primary */}
            <Alert
              type="info"
              title="Quick Copy from Primary"
              variant="subtle"
              size="small"
              actions={
                <div style={{ display: "flex", gap: "8px" }}>
                  <LoadingButton
                    isLoading={false}
                    loadingText=""
                    variant={copyAnimationField === 'provider' ? "success" : "primary"}
                    size="small"
                    onClick={() => copyToSecondary('provider')}
                    icon="📋"
                  >
                    Provider
                  </LoadingButton>
                  <LoadingButton
                    isLoading={false}
                    loadingText=""
                    variant={copyAnimationField === 'memberId' ? "success" : "primary"}
                    size="small"
                    onClick={() => copyToSecondary('memberId')}
                    icon="📋"
                  >
                    Member ID
                  </LoadingButton>
                </div>
              }
            />

            <FormField
              label="Secondary Provider"
              value={formData.secondaryInsurance.provider || ""}
              onChange={(value) => insuranceForm.updateField("secondaryInsurance.provider", value)}
              isFocused={focusedField === "secondaryInsurance.provider"}
              onFocus={() => setFocusedField("secondaryInsurance.provider")}
              onBlur={() => setFocusedField(null)}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <FormField
                  label="Member ID"
                  value={formData.secondaryInsurance.memberId || ""}
                  onChange={(value) => insuranceForm.updateField("secondaryInsurance.memberId", value)}
                  isFocused={focusedField === "secondaryInsurance.memberId"}
                  onFocus={() => setFocusedField("secondaryInsurance.memberId")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <FormField
                  label="Relationship"
                  type="select"
                  value={formData.secondaryInsurance.relationship || "self"}
                  onChange={(value) => insuranceForm.updateField("secondaryInsurance.relationship", value)}
                  options={[
                    { value: "self", label: "Self" },
                    { value: "spouse", label: "Spouse" },
                    { value: "parent", label: "Parent" },
                    { value: "other", label: "Other" }
                  ]}
                  isFocused={focusedField === "secondaryInsurance.relationship"}
                  onFocus={() => setFocusedField("secondaryInsurance.relationship")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Form status indicator */}
      {!insuranceForm.canSubmitForm() && formData.primaryInsurance?.provider && (
        <Alert
          type="warning"
          title="Form Not Ready for Submission"
          message="Please ensure all required fields are completed, form validation passes, and insurance eligibility is verified."
        />
      )}

      {insuranceForm.canSubmitForm() && (
        <Alert
          type="success"
          title="Form Ready for Submission"
          message="All requirements met. Click 'Continue to Medical History' to proceed."
        />
      )}
    </FormContainer>
  );
}