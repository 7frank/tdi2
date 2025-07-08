import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { DemographicsFormServiceInterface } from "../services/DemographicsFormService";

interface DemographicsFormProps {
  services: {
    demographicsForm: Inject<DemographicsFormServiceInterface>;
  };
  onComplete: () => void;
}

export function DemographicsForm({
  services,
  onComplete,
}: DemographicsFormProps) {
  const { demographicsForm } = services;
  const { formData, validationResults, isSubmitting } = demographicsForm.state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await demographicsForm.submitForm();
      onComplete();
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  const getFieldError = (field: string) => {
    return validationResults?.errors.find((error) =>
      error.field.includes(field)
    )?.message;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Patient Demographics</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>
            First Name *
            <input
              type="text"
              value={formData.firstName || ""}
              onChange={(e) =>
                demographicsForm.updateField("firstName", e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
              }}
            />
            {getFieldError("firstName") && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {getFieldError("firstName")}
              </span>
            )}
          </label>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>
            Last Name *
            <input
              type="text"
              value={formData.lastName || ""}
              onChange={(e) =>
                demographicsForm.updateField("lastName", e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
              }}
            />
            {getFieldError("lastName") && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {getFieldError("lastName")}
              </span>
            )}
          </label>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>
            Date of Birth *
            <input
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={(e) =>
                demographicsForm.updateField("dateOfBirth", e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
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

        <div style={{ marginBottom: "15px" }}>
          <label>
            SSN *
            <input
              type="text"
              placeholder="123-45-6789"
              value={formData.ssn || ""}
              onChange={(e) =>
                demographicsForm.updateField("ssn", e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
              }}
            />
            {getFieldError("ssn") && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {getFieldError("ssn")}
              </span>
            )}
          </label>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>
            Gender *
            <select
              value={formData.gender || ""}
              onChange={(e) =>
                demographicsForm.updateField("gender", e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
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

        <fieldset
          style={{
            marginBottom: "15px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <legend>Address *</legend>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Street Address *
              <input
                type="text"
                value={formData.address?.street || ""}
                onChange={(e) =>
                  demographicsForm.updateField("address.street", e.target.value)
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                }}
              />
              {getFieldError("address.street") && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {getFieldError("address.street")}
                </span>
              )}
            </label>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ flex: 1 }}>
              <label>
                City *
                <input
                  type="text"
                  value={formData.address?.city || ""}
                  onChange={(e) =>
                    demographicsForm.updateField("address.city", e.target.value)
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
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
                  onChange={(e) =>
                    demographicsForm.updateField(
                      "address.state",
                      e.target.value.toUpperCase()
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
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
                  onChange={(e) =>
                    demographicsForm.updateField(
                      "address.zipCode",
                      e.target.value
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
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
        </fieldset>

        <div style={{ marginBottom: "15px" }}>
          <label>
            Phone Number *
            <input
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone || ""}
              onChange={(e) =>
                demographicsForm.updateField("phone", e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
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
              onChange={(e) =>
                demographicsForm.updateField("email", e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
              }}
            />
            {getFieldError("email") && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {getFieldError("email")}
              </span>
            )}
          </label>
        </div>

        {formData.age && formData.age < 18 && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px" }}>
              <strong>Minor Patient Detected:</strong> Guardian consent will be
              required in the next step.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            onClick={() => demographicsForm.resetForm()}
            style={{
              padding: "10px 20px",
              border: "1px solid #ccc",
              background: "white",
              cursor: "pointer",
            }}
            disabled={isSubmitting}
          >
            Reset
          </button>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            disabled={isSubmitting || !validationResults?.isValid}
          >
            {isSubmitting ? "Submitting..." : "Continue to Insurance"}
          </button>
        </div>

        {validationResults && !validationResults.isValid && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              background: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
            }}
          >
            <p style={{ margin: 0, color: "#721c24", fontSize: "14px" }}>
              Please fix the following errors before continuing:
            </p>
            <ul
              style={{
                margin: "5px 0 0 20px",
                color: "#721c24",
                fontSize: "12px",
              }}
            >
              {validationResults.errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
