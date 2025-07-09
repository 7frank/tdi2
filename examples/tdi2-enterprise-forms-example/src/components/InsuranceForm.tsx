import React, { useState } from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { InsuranceFormServiceInterface } from "../services/InsuranceFormService";

interface InsuranceFormProps {
  services: {
    insuranceForm: Inject<InsuranceFormServiceInterface>;
  };
  onComplete: () => void;
}

export function InsuranceForm(props: InsuranceFormProps) {
  const { services: { insuranceForm }, onComplete } = props;
  
  // 🎨 COMPONENT VIEW STATE: UI-only interactions (ephemeral, component-specific)
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['primary']);
  const [showPlanTooltip, setShowPlanTooltip] = useState<string | null>(null);
  const [copyAnimationField, setCopyAnimationField] = useState<string | null>(null);

  // Business state from service (reactive via proxy)
  const { formData, validationResults, isSubmitting, eligibilityCheck } = insuranceForm.state;
  
  // 🎨 VIEW STATE from service: UI coordination states
  const { showEligibilityDetails, eligibilityStatusAnimation } = insuranceForm.state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const toggleSection = (sectionId: string) => {
    // 🎨 COMPONENT VIEW STATE: Section expansion
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleFieldFocus = (fieldId: string) => {
    setFocusedField(fieldId); // 🎨 COMPONENT VIEW STATE
  };

  const handleFieldBlur = () => {
    setFocusedField(null); // 🎨 COMPONENT VIEW STATE
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

  return (
    <div style={{ padding: "20px", maxWidth: "700px" }}>
      <h2>Insurance Information</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Primary Insurance Section */}
        <fieldset style={{ marginBottom: "20px", border: "1px solid #dee2e6", borderRadius: "8px" }}>
          <legend 
            onClick={() => toggleSection('primary')}
            style={{ cursor: "pointer", fontWeight: "bold", padding: "0 10px" }}
          >
            🏥 Primary Insurance {expandedSections.includes('primary') ? '▼' : '▶'}
          </legend>
          
          {expandedSections.includes('primary') && (
            <div style={{ padding: "15px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label>
                  Insurance Provider *
                  <input
                    type="text"
                    placeholder="e.g., Blue Cross Blue Shield, Aetna, Cigna"
                    value={formData.primaryInsurance?.provider || ""}
                    onChange={(e) => insuranceForm.updateField("primaryInsurance.provider", e.target.value)}
                    onFocus={() => handleFieldFocus("primaryInsurance.provider")}
                    onBlur={handleFieldBlur}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px",
                      marginTop: "4px",
                      border: `2px solid ${focusedField === "primaryInsurance.provider" ? "#007bff" : "#ced4da"}`,
                      borderRadius: "4px",
                    }}
                  />
                  {getFieldError("primaryInsurance.provider") && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                      {getFieldError("primaryInsurance.provider")}
                    </span>
                  )}
                </label>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>
                  Plan Type *
                  <div style={{ position: "relative" }}>
                    <select
                      value={formData.primaryInsurance?.planType || ""}
                      onChange={(e) => insuranceForm.updateField("primaryInsurance.planType", e.target.value)}
                      onFocus={() => handleFieldFocus("primaryInsurance.planType")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "primaryInsurance.planType" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    >
                      <option value="">Select Plan Type</option>
                      <option value="HMO">HMO - Health Maintenance Organization</option>
                      <option value="PPO">PPO - Preferred Provider Organization</option>
                      <option value="EPO">EPO - Exclusive Provider Organization</option>
                      <option value="POS">POS - Point of Service</option>
                      <option value="HDHP">HDHP - High Deductible Health Plan</option>
                    </select>
                    
                    {formData.primaryInsurance?.planType && (
                      <button
                        type="button"
                        onMouseEnter={() => setShowPlanTooltip(formData.primaryInsurance?.planType || null)}
                        onMouseLeave={() => setShowPlanTooltip(null)}
                        style={{
                          position: "absolute",
                          right: "30px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        ?
                      </button>
                    )}
                  </div>
                  {getFieldError("primaryInsurance.planType") && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                      {getFieldError("primaryInsurance.planType")}
                    </span>
                  )}
                </label>
              </div>

              {/* Plan Type Tooltip */}
              {showPlanTooltip && (
                <div style={{
                  background: "#e3f2fd",
                  border: "1px solid #b3d9ff",
                  padding: "10px",
                  borderRadius: "4px",
                  marginBottom: "15px",
                  fontSize: "14px",
                  lineHeight: "1.4"
                }}>
                  <strong>{showPlanTooltip}:</strong> {getPlanDescription(showPlanTooltip)}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label>
                    Member ID *
                    <input
                      type="text"
                      placeholder="Member ID"
                      value={formData.primaryInsurance?.memberId || ""}
                      onChange={(e) => insuranceForm.updateField("primaryInsurance.memberId", e.target.value)}
                      onFocus={() => handleFieldFocus("primaryInsurance.memberId")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "primaryInsurance.memberId" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                    {getFieldError("primaryInsurance.memberId") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("primaryInsurance.memberId")}
                      </span>
                    )}
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <label>
                    Group Number *
                    <input
                      type="text"
                      placeholder="Group Number"
                      value={formData.primaryInsurance?.groupNumber || ""}
                      onChange={(e) => insuranceForm.updateField("primaryInsurance.groupNumber", e.target.value)}
                      onFocus={() => handleFieldFocus("primaryInsurance.groupNumber")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "primaryInsurance.groupNumber" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                    {getFieldError("primaryInsurance.groupNumber") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("primaryInsurance.groupNumber")}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label>
                    Effective Date *
                    <input
                      type="date"
                      value={formData.primaryInsurance?.effectiveDate || ""}
                      onChange={(e) => insuranceForm.updateField("primaryInsurance.effectiveDate", e.target.value)}
                      onFocus={() => handleFieldFocus("primaryInsurance.effectiveDate")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "primaryInsurance.effectiveDate" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                    {getFieldError("primaryInsurance.effectiveDate") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("primaryInsurance.effectiveDate")}
                      </span>
                    )}
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <label>
                    Copay ($)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="25.00"
                      value={formData.primaryInsurance?.copay || ""}
                      onChange={(e) => insuranceForm.updateField("primaryInsurance.copay", parseFloat(e.target.value) || 0)}
                      onFocus={() => handleFieldFocus("primaryInsurance.copay")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "primaryInsurance.copay" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <label>
                    Deductible ($)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="1000.00"
                      value={formData.primaryInsurance?.deductible || ""}
                      onChange={(e) => insuranceForm.updateField("primaryInsurance.deductible", parseFloat(e.target.value) || 0)}
                      onFocus={() => handleFieldFocus("primaryInsurance.deductible")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "primaryInsurance.deductible" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {/* Eligibility Check Section */}
        <fieldset style={{ marginBottom: "20px", border: "1px solid #dee2e6", borderRadius: "8px" }}>
          <legend style={{ fontWeight: "bold", padding: "0 10px" }}>
            ✅ Insurance Eligibility Verification
          </legend>
          
          <div style={{ padding: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
              <button
                type="button"
                onClick={handleEligibilityCheck}
                disabled={!canCheckEligibility()}
                style={{
                  padding: "10px 20px",
                  background: canCheckEligibility() ? "#28a745" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: canCheckEligibility() ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  position: "relative",
                }}
              >
                {eligibilityCheck.isChecking ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ 
                      width: "16px", 
                      height: "16px", 
                      border: "2px solid transparent", 
                      borderTop: "2px solid #fff", 
                      borderRadius: "50%", 
                      animation: "spin 1s linear infinite" 
                    }}>
                    </span>
                    Checking...
                  </span>
                ) : (
                  "🔍 Check Eligibility"
                )}
              </button>

              <button
                type="button"
                onClick={() => insuranceForm.toggleEligibilityDetails()} // 🎨 VIEW STATE from service
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  color: "#007bff",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {showEligibilityDetails ? "Hide Details" : "Show Details"}
              </button>
            </div>

            {/* Progress Bar */}
            {eligibilityCheck.isChecking && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{
                  width: "100%",
                  height: "8px",
                  background: "#e9ecef",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${eligibilityCheck.checkingProgress}%`, // 🎨 VIEW STATE from service
                    height: "100%",
                    background: "linear-gradient(90deg, #007bff, #28a745)",
                    transition: "width 0.3s ease"
                  }} />
                </div>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#6c757d" }}>
                  Verifying with insurance provider...
                </p>
              </div>
            )}

            {/* Eligibility Result */}
            {eligibilityCheck.result && (
              <div style={{
                padding: "15px",
                borderRadius: "6px",
                background: eligibilityCheck.result === "verified" ? "#d4edda" : 
                           eligibilityCheck.result === "denied" ? "#f8d7da" : "#fff3cd",
                border: `1px solid ${eligibilityCheck.result === "verified" ? "#c3e6cb" : 
                                   eligibilityCheck.result === "denied" ? "#f5c6cb" : "#ffeaa7"}`,
                transform: eligibilityStatusAnimation ? "scale(1.02)" : "scale(1)", // 🎨 VIEW STATE from service
                transition: "transform 0.3s ease"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>
                    {eligibilityCheck.result === "verified" ? "✅" : 
                     eligibilityCheck.result === "denied" ? "❌" : "⏳"}
                  </span>
                  <p style={{
                    margin: 0,
                    color: eligibilityCheck.result === "verified" ? "#155724" : 
                           eligibilityCheck.result === "denied" ? "#721c24" : "#856404",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}>
                    {eligibilityCheck.result === "verified" ? "Eligibility Verified" : 
                     eligibilityCheck.result === "denied" ? "Eligibility Denied" : "Eligibility Pending"}
                  </p>
                </div>
                
                {showEligibilityDetails && (
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Last checked:</strong> {eligibilityCheck.lastChecked?.toLocaleString()}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Check duration:</strong> {eligibilityCheck.lastCheckDuration}ms
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Provider:</strong> {formData.primaryInsurance?.provider}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Member ID:</strong> {formData.primaryInsurance?.memberId}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </fieldset>

      {/* Secondary Insurance Section */}
        <fieldset style={{ marginBottom: "20px", border: "1px solid #dee2e6", borderRadius: "8px" }}>
          <legend 
            onClick={() => toggleSection('secondary')}
            style={{ cursor: "pointer", fontWeight: "bold", padding: "0 10px" }}
          >
            🏥 Secondary Insurance (Optional) {expandedSections.includes('secondary') ? '▼' : '▶'}
          </legend>
          
          {expandedSections.includes('secondary') && (
            <div style={{ padding: "15px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label>
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
                    style={{ marginRight: "8px" }}
                  />
                  I have secondary insurance coverage
                </label>
              </div>

              {formData.secondaryInsurance && (
                <>
                  {/* Quick Copy from Primary */}
                  <div style={{
                    background: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    padding: "10px",
                    marginBottom: "15px"
                  }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "bold" }}>
                      Quick Copy from Primary:
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => copyToSecondary('provider')}
                        style={{
                          padding: "4px 8px",
                          background: copyAnimationField === 'provider' ? "#28a745" : "#007bff", // 🎨 COMPONENT VIEW STATE
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          transform: copyAnimationField === 'provider' ? "scale(1.1)" : "scale(1)", // 🎨 COMPONENT VIEW STATE
                          transition: "all 0.2s ease"
                        }}
                      >
                        📋 Provider
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToSecondary('memberId')}
                        style={{
                          padding: "4px 8px",
                          background: copyAnimationField === 'memberId' ? "#28a745" : "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          transform: copyAnimationField === 'memberId' ? "scale(1.1)" : "scale(1)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        📋 Member ID
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label>
                      Secondary Provider
                      <input
                        type="text"
                        value={formData.secondaryInsurance.provider || ""}
                        onChange={(e) => insuranceForm.updateField("secondaryInsurance.provider", e.target.value)}
                        onFocus={() => handleFieldFocus("secondaryInsurance.provider")}
                        onBlur={handleFieldBlur}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "8px",
                          marginTop: "4px",
                          border: `2px solid ${focusedField === "secondaryInsurance.provider" ? "#007bff" : "#ced4da"}`,
                          borderRadius: "4px",
                        }}
                      />
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                    <div style={{ flex: 1 }}>
                      <label>
                        Member ID
                        <input
                          type="text"
                          value={formData.secondaryInsurance.memberId || ""}
                          onChange={(e) => insuranceForm.updateField("secondaryInsurance.memberId", e.target.value)}
                          onFocus={() => handleFieldFocus("secondaryInsurance.memberId")}
                          onBlur={handleFieldBlur}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "8px",
                            marginTop: "4px",
                            border: `2px solid ${focusedField === "secondaryInsurance.memberId" ? "#007bff" : "#ced4da"}`,
                            borderRadius: "4px",
                          }}
                        />
                      </label>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>
                        Relationship
                        <select
                          value={formData.secondaryInsurance.relationship || "self"}
                          onChange={(e) => insuranceForm.updateField("secondaryInsurance.relationship", e.target.value)}
                          onFocus={() => handleFieldFocus("secondaryInsurance.relationship")}
                          onBlur={handleFieldBlur}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "8px",
                            marginTop: "4px",
                            border: `2px solid ${focusedField === "secondaryInsurance.relationship" ? "#007bff" : "#ced4da"}`,
                            borderRadius: "4px",
                          }}
                        >
                          <option value="self">Self</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </fieldset>

        {/* Form Actions */}
        <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
          <button
            type="button"
            onClick={() => {
              insuranceForm.resetForm();
              // 🎨 COMPONENT VIEW STATE: Reset local UI state
              setFocusedField(null);
              setExpandedSections(['primary']);
              setShowPlanTooltip(null);
              setCopyAnimationField(null);
            }}
            style={{
              padding: "12px 24px",
              border: "1px solid #6c757d",
              background: "white",
              color: "#6c757d",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
            disabled={isSubmitting}
          >
            Reset Form
          </button>
          
          <button
            type="submit"
            style={{
              padding: "12px 24px",
              background: (validationResults?.isValid && eligibilityCheck.result === "verified") ? "#28a745" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: (validationResults?.isValid && eligibilityCheck.result === "verified") ? "pointer" : "not-allowed",
              fontSize: "14px",
              position: "relative",
            }}
            disabled={
              isSubmitting ||
              !validationResults?.isValid ||
              eligibilityCheck.result !== "verified"
            }
          >
            {isSubmitting ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ 
                  width: "16px", 
                  height: "16px", 
                  border: "2px solid transparent", 
                  borderTop: "2px solid #fff", 
                  borderRadius: "50%", 
                  animation: "spin 1s linear infinite" 
                }}>
                </span>
                Submitting...
              </span>
            ) : (
              "Continue to Medical History"
            )}
          </button>
        </div>

        {/* Validation Summary */}
        {validationResults && !validationResults.isValid && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "18px" }}>❌</span>
              <p style={{ margin: 0, color: "#721c24", fontSize: "14px", fontWeight: "bold" }}>
                Please fix the following errors:
              </p>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#721c24", fontSize: "12px" }}>
              {validationResults.errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Eligibility Warning */}
        {eligibilityCheck.result !== "verified" && formData.primaryInsurance?.provider && (
          <div
            style={{
              marginTop: "15px",
              padding: "15px",
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>⚠️</span>
              <p style={{ margin: 0, color: "#856404", fontSize: "14px" }}>
                Please verify your insurance eligibility before continuing to the next step.
              </p>
            </div>
          </div>
        )}

        {/* Form Progress Indicator */}
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#e3f2fd",
          border: "1px solid #b3d9ff",
          borderRadius: "8px",
          padding: "12px",
          fontSize: "12px",
          color: "#0d47a1",
          minWidth: "200px"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Insurance Form Status</div>
          <div>✅ Provider: {formData.primaryInsurance?.provider ? "Set" : "Missing"}</div>
          <div>✅ Plan Type: {formData.primaryInsurance?.planType ? "Set" : "Missing"}</div>
          <div>✅ Eligibility: {eligibilityCheck.result || "Not Checked"}</div>
          <div>✅ Validation: {validationResults?.isValid ? "Valid" : "Pending"}</div>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}