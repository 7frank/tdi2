import React, { useState } from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { DemographicsFormServiceInterface } from "../services/DemographicsFormService";

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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showValidationTooltip, setShowValidationTooltip] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['personal', 'address']);

  // Business state from service (reactive via proxy)
  const { formData, validationResults, isSubmitting, isDirty } = demographicsForm.state;
  
  // 🎨 VIEW STATE from service: Cross-form UI coordination
  const { validationDebounceActive, lastValidationTime } = demographicsForm.state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await demographicsForm.submitForm();
      onComplete();
    } catch (error) {
      console.error("Form submission failed:", error);
      // 🎨 COMPONENT VIEW STATE: Show error feedback
      setShowValidationTooltip(true);
      setTimeout(() => setShowValidationTooltip(false), 3000);
    }
  };

  const getFieldError = (field: string) => {
    return validationResults?.errors.find((error) =>
      error.field.includes(field)
    )?.message;
  };

  const handleFieldFocus = (fieldId: string) => {
    setFocusedField(fieldId); // 🎨 COMPONENT VIEW STATE
  };

  const handleFieldBlur = () => {
    setFocusedField(null); // 🎨 COMPONENT VIEW STATE
  };

  const toggleSection = (sectionId: string) => {
    // 🎨 COMPONENT VIEW STATE: Section expansion
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <h2>Patient Demographics</h2>
        
        {/* 🎨 VIEW STATE: Validation feedback indicator */}
        {validationDebounceActive && (
          <span style={{ marginLeft: "10px", color: "#007bff", fontSize: "12px" }}>
            🔄 Validating...
          </span>
        )}
        
        {lastValidationTime && !validationDebounceActive && (
          <span style={{ marginLeft: "10px", color: "#28a745", fontSize: "12px" }}>
            ✅ Last validated: {lastValidationTime.toLocaleTimeString()}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Information Section */}
        <fieldset style={{ marginBottom: "20px", border: "1px solid #dee2e6", borderRadius: "8px" }}>
          <legend 
            onClick={() => toggleSection('personal')}
            style={{ cursor: "pointer", fontWeight: "bold", padding: "0 10px" }}
          >
            👤 Personal Information {expandedSections.includes('personal') ? '▼' : '▶'}
          </legend>
          
          {expandedSections.includes('personal') && (
            <div style={{ padding: "15px" }}>
              <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label>
                    First Name *
                    <input
                      type="text"
                      value={formData.firstName || ""}
                      onChange={(e) => demographicsForm.updateField("firstName", e.target.value)}
                      onFocus={() => handleFieldFocus("firstName")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "firstName" ? "#007bff" : "#ced4da"}`, // 🎨 COMPONENT VIEW STATE
                        borderRadius: "4px",
                      }}
                    />
                    {getFieldError("firstName") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("firstName")}
                      </span>
                    )}
                  </label>
                </div>
                
                <div style={{ flex: 1 }}>
                  <label>
                    Last Name *
                    <input
                      type="text"
                      value={formData.lastName || ""}
                      onChange={(e) => demographicsForm.updateField("lastName", e.target.value)}
                      onFocus={() => handleFieldFocus("lastName")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "lastName" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                    {getFieldError("lastName") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("lastName")}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>
                  Date of Birth *
                  <input
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(e) => demographicsForm.updateField("dateOfBirth", e.target.value)}
                    onFocus={() => handleFieldFocus("dateOfBirth")}
                    onBlur={handleFieldBlur}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px",
                      marginTop: "4px",
                      border: `2px solid ${focusedField === "dateOfBirth" ? "#007bff" : "#ced4da"}`,
                      borderRadius: "4px",
                    }}
                  />
                  {formData.age && (
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      Age: {formData.age}
                    </span>
                  )}
                  {getFieldError("dateOfBirth") && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                      {getFieldError("dateOfBirth")}
                    </span>
                  )}
                </label>
              </div>

              <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label>
                    SSN *
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"} // 🎨 COMPONENT VIEW STATE
                        placeholder="123-45-6789"
                        value={formData.ssn || ""}
                        onChange={(e) => demographicsForm.updateField("ssn", e.target.value)}
                        onFocus={() => handleFieldFocus("ssn")}
                        onBlur={handleFieldBlur}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "8px",
                          marginTop: "4px",
                          border: `2px solid ${focusedField === "ssn" ? "#007bff" : "#ced4da"}`,
                          borderRadius: "4px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)} // 🎨 COMPONENT VIEW STATE
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    </div>
                    {getFieldError("ssn") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("ssn")}
                      </span>
                    )}
                  </label>
                </div>

                <div style={{ flex: 1 }}>
                  <label>
                    Gender *
                    <select
                      value={formData.gender || ""}
                      onChange={(e) => demographicsForm.updateField("gender", e.target.value)}
                      onFocus={() => handleFieldFocus("gender")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "gender" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    {getFieldError("gender") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("gender")}
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {/* Address Section */}
        <fieldset style={{ marginBottom: "20px", border: "1px solid #dee2e6", borderRadius: "8px" }}>
          <legend 
            onClick={() => toggleSection('address')}
            style={{ cursor: "pointer", fontWeight: "bold", padding: "0 10px" }}
          >
            🏠 Address Information {expandedSections.includes('address') ? '▼' : '▶'}
          </legend>
          
          {expandedSections.includes('address') && (
            <div style={{ padding: "15px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label>
                  Street Address *
                  <input
                    type="text"
                    value={formData.address?.street || ""}
                    onChange={(e) => demographicsForm.updateField("address.street", e.target.value)}
                    onFocus={() => handleFieldFocus("address.street")}
                    onBlur={handleFieldBlur}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px",
                      marginTop: "4px",
                      border: `2px solid ${focusedField === "address.street" ? "#007bff" : "#ced4da"}`,
                      borderRadius: "4px",
                    }}
                  />
                  {getFieldError("address.street") && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                      {getFieldError("address.street")}
                    </span>
                  )}
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label>
                    City *
                    <input
                      type="text"
                      value={formData.address?.city || ""}
                      onChange={(e) => demographicsForm.updateField("address.city", e.target.value)}
                      onFocus={() => handleFieldFocus("address.city")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "address.city" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                    {getFieldError("address.city") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("address.city")}
                      </span>
                    )}
                  </label>
                </div>
                <div style={{ width: "80px" }}>
                  <label>
                    State *
                    <input
                      type="text"
                      placeholder="CA"
                      maxLength={2}
                      value={formData.address?.state || ""}
                      onChange={(e) => demographicsForm.updateField("address.state", e.target.value.toUpperCase())}
                      onFocus={() => handleFieldFocus("address.state")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "address.state" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                    {getFieldError("address.state") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("address.state")}
                      </span>
                    )}
                  </label>
                </div>
                <div style={{ width: "120px" }}>
                  <label>
                    ZIP Code *
                    <input
                      type="text"
                      placeholder="12345"
                      value={formData.address?.zipCode || ""}
                      onChange={(e) => demographicsForm.updateField("address.zipCode", e.target.value)}
                      onFocus={() => handleFieldFocus("address.zipCode")}
                      onBlur={handleFieldBlur}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
                        border: `2px solid ${focusedField === "address.zipCode" ? "#007bff" : "#ced4da"}`,
                        borderRadius: "4px",
                      }}
                    />
                    {getFieldError("address.zipCode") && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {getFieldError("address.zipCode")}
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {/* Contact Information Section */}
        <fieldset style={{ marginBottom: "20px", border: "1px solid #dee2e6", borderRadius: "8px" }}>
          <legend 
            onClick={() => toggleSection('contact')}
            style={{ cursor: "pointer", fontWeight: "bold", padding: "0 10px" }}
          >
            📞 Contact Information {expandedSections.includes('contact') ? '▼' : '▶'}
          </legend>
          
          {expandedSections.includes('contact') && (
            <div style={{ padding: "15px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label>
                  Phone Number *
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone || ""}
                    onChange={(e) => demographicsForm.updateField("phone", e.target.value)}
                    onFocus={() => handleFieldFocus("phone")}
                    onBlur={handleFieldBlur}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px",
                      marginTop: "4px",
                      border: `2px solid ${focusedField === "phone" ? "#007bff" : "#ced4da"}`,
                      borderRadius: "4px",
                    }}
                  />
                  {getFieldError("phone") && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                      {getFieldError("phone")}
                    </span>
                  )}
                </label>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>
                  Email Address *
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => demographicsForm.updateField("email", e.target.value)}
                    onFocus={() => handleFieldFocus("email")}
                    onBlur={handleFieldBlur}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px",
                      marginTop: "4px",
                      border: `2px solid ${focusedField === "email" ? "#007bff" : "#ced4da"}`,
                      borderRadius: "4px",
                    }}
                  />
                  {getFieldError("email") && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                      {getFieldError("email")}
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}
        </fieldset>

        {/* Minor Patient Warning */}
        {formData.age && formData.age < 18 && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
                Minor Patient Detected
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>
                Guardian consent will be required in the next step.
              </p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            onClick={() => {
              demographicsForm.resetForm();
              setShowPassword(false); // 🎨 COMPONENT VIEW STATE: Reset local state
              setFocusedField(null);
              setShowValidationTooltip(false);
              setExpandedSections(['personal', 'address']);
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
              background: validationResults?.isValid ? "#28a745" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: validationResults?.isValid ? "pointer" : "not-allowed",
              fontSize: "14px",
              position: "relative",
            }}
            disabled={isSubmitting || !validationResults?.isValid}
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
              "Continue to Insurance"
            )}
          </button>
        </div>

        {/* Validation Summary */}
        {showValidationTooltip && validationResults && !validationResults.isValid && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "8px",
              padding: "15px",
              maxWidth: "300px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 1000,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "18px" }}>❌</span>
              <p style={{ margin: 0, color: "#721c24", fontSize: "14px", fontWeight: "bold" }}>
                Validation Errors
              </p>
              <button
                onClick={() => setShowValidationTooltip(false)} // 🎨 COMPONENT VIEW STATE
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ×
              </button>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#721c24", fontSize: "12px" }}>
              {validationResults.errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Inline Validation Summary */}
        {validationResults && !validationResults.isValid && !showValidationTooltip && (
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

        {/* Form State Indicator */}
        {isDirty && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              left: "20px",
              background: "#e3f2fd",
              border: "1px solid #b3d9ff",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "12px",
              color: "#0d47a1",
            }}
          >
            📝 Form has unsaved changes
          </div>
        )}
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