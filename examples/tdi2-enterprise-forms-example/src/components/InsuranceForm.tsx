import React, { useState } from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { InsuranceFormServiceInterface } from "../services/InsuranceFormService";

interface InsuranceFormProps {
  services: {
    insuranceForm: Inject<InsuranceFormServiceInterface>;
  };
  onComplete: () => void;
}

export function InsuranceForm({ services, onComplete }: InsuranceFormProps) {
  const { insuranceForm } = services;
  const { formData, validationResults, isSubmitting, eligibilityCheck } =
    insuranceForm.state;
  const [eligibilitySubscription, setEligibilitySubscription] =
    useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await insuranceForm.submitForm();
      onComplete();
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  const handleEligibilityCheck = () => {
    if (eligibilitySubscription) {
      eligibilitySubscription.unsubscribe();
    }

    const subscription = insuranceForm.checkEligibility().subscribe({
      next: (result) => {
        console.log("Eligibility check result:", result);
      },
      error: (error) => {
        console.error("Eligibility check failed:", error);
      },
    });

    setEligibilitySubscription(subscription);
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

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Insurance Information</h2>
      <form onSubmit={handleSubmit}>
        <fieldset
          style={{
            marginBottom: "20px",
            padding: "15px",
            border: "1px solid #ccc",
          }}
        >
          <legend>
            <strong>Primary Insurance</strong>
          </legend>

          <div style={{ marginBottom: "15px" }}>
            <label>
              Insurance Provider *
              <input
                type="text"
                placeholder="e.g., Blue Cross Blue Shield, Aetna, Cigna"
                value={formData.primaryInsurance?.provider || ""}
                onChange={(e) =>
                  insuranceForm.updateField(
                    "primaryInsurance.provider",
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
              <select
                value={formData.primaryInsurance?.planType || ""}
                onChange={(e) =>
                  insuranceForm.updateField(
                    "primaryInsurance.planType",
                    e.target.value
                  )
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                }}
              >
                <option value="">Select Plan Type</option>
                <option value="HMO">
                  HMO - Health Maintenance Organization
                </option>
                <option value="PPO">
                  PPO - Preferred Provider Organization
                </option>
                <option value="EPO">
                  EPO - Exclusive Provider Organization
                </option>
                <option value="POS">POS - Point of Service</option>
                <option value="HDHP">HDHP - High Deductible Health Plan</option>
              </select>
              {getFieldError("primaryInsurance.planType") && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {getFieldError("primaryInsurance.planType")}
                </span>
              )}
            </label>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label>
                Member ID *
                <input
                  type="text"
                  placeholder="Member ID"
                  value={formData.primaryInsurance?.memberId || ""}
                  onChange={(e) =>
                    insuranceForm.updateField(
                      "primaryInsurance.memberId",
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
                  onChange={(e) =>
                    insuranceForm.updateField(
                      "primaryInsurance.groupNumber",
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
                {getFieldError("primaryInsurance.groupNumber") && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {getFieldError("primaryInsurance.groupNumber")}
                  </span>
                )}
              </label>
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              Effective Date *
              <input
                type="date"
                value={formData.primaryInsurance?.effectiveDate || ""}
                onChange={(e) =>
                  insuranceForm.updateField(
                    "primaryInsurance.effectiveDate",
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
              {getFieldError("primaryInsurance.effectiveDate") && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {getFieldError("primaryInsurance.effectiveDate")}
                </span>
              )}
            </label>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label>
                Copay ($)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  value={formData.primaryInsurance?.copay || ""}
                  onChange={(e) =>
                    insuranceForm.updateField(
                      "primaryInsurance.copay",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
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
                  onChange={(e) =>
                    insuranceForm.updateField(
                      "primaryInsurance.deductible",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                  }}
                />
              </label>
            </div>
          </div>

          {/* Eligibility Check Section */}
          <div
            style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
              border: "1px solid #dee2e6",
              marginTop: "15px",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              Insurance Eligibility
            </h4>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <button
                type="button"
                onClick={handleEligibilityCheck}
                disabled={!canCheckEligibility()}
                style={{
                  padding: "8px 16px",
                  background: canCheckEligibility() ? "#28a745" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: canCheckEligibility() ? "pointer" : "not-allowed",
                }}
              >
                {eligibilityCheck.isChecking
                  ? "Checking..."
                  : "Check Eligibility"}
              </button>

              {eligibilityCheck.isChecking && (
                <span style={{ fontSize: "14px", color: "#007bff" }}>
                  🔄 Verifying with insurance provider...
                </span>
              )}
            </div>

            {eligibilityCheck.result && (
              <div
                style={{
                  padding: "10px",
                  borderRadius: "4px",
                  background:
                    eligibilityCheck.result === "verified"
                      ? "#d4edda"
                      : eligibilityCheck.result === "denied"
                        ? "#f8d7da"
                        : "#fff3cd",
                  border: `1px solid ${
                    eligibilityCheck.result === "verified"
                      ? "#c3e6cb"
                      : eligibilityCheck.result === "denied"
                        ? "#f5c6cb"
                        : "#ffeaa7"
                  }`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color:
                      eligibilityCheck.result === "verified"
                        ? "#155724"
                        : eligibilityCheck.result === "denied"
                          ? "#721c24"
                          : "#856404",
                    fontSize: "14px",
                  }}
                >
                  <strong>
                    {eligibilityCheck.result === "verified"
                      ? "✅ Eligibility Verified"
                      : eligibilityCheck.result === "denied"
                        ? "❌ Eligibility Denied"
                        : "⏳ Eligibility Pending"}
                  </strong>
                </p>
                {eligibilityCheck.lastChecked && (
                  <p
                    style={{
                      margin: "5px 0 0 0",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    Last checked:{" "}
                    {eligibilityCheck.lastChecked.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </fieldset>

        {/* Secondary Insurance (Optional) */}
        <fieldset
          style={{
            marginBottom: "20px",
            padding: "15px",
            border: "1px solid #ccc",
          }}
        >
          <legend>
            <strong>Secondary Insurance (Optional)</strong>
          </legend>

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
              <div style={{ marginBottom: "15px" }}>
                <label>
                  Secondary Provider
                  <input
                    type="text"
                    value={formData.secondaryInsurance.provider || ""}
                    onChange={(e) =>
                      insuranceForm.updateField(
                        "secondaryInsurance.provider",
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
                </label>
              </div>

              <div
                style={{ display: "flex", gap: "10px", marginBottom: "15px" }}
              >
                <div style={{ flex: 1 }}>
                  <label>
                    Member ID
                    <input
                      type="text"
                      value={formData.secondaryInsurance.memberId || ""}
                      onChange={(e) =>
                        insuranceForm.updateField(
                          "secondaryInsurance.memberId",
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
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <label>
                    Relationship
                    <select
                      value={formData.secondaryInsurance.relationship || "self"}
                      onChange={(e) =>
                        insuranceForm.updateField(
                          "secondaryInsurance.relationship",
                          e.target.value
                        )
                      }
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        marginTop: "4px",
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
        </fieldset>

        {/* Plan Type Information */}
        {formData.primaryInsurance?.planType && (
          <div
            style={{
              background: "#e7f3ff",
              border: "1px solid #b3d9ff",
              padding: "15px",
              borderRadius: "4px",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              {formData.primaryInsurance.planType} Plan Information
            </h4>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.4" }}>
              {formData.primaryInsurance.planType === "PPO" &&
                "PPO plans offer flexibility to see specialists without referrals and access to out-of-network providers."}
              {formData.primaryInsurance.planType === "HMO" &&
                "HMO plans require you to choose a primary care physician and get referrals for specialist care."}
              {formData.primaryInsurance.planType === "EPO" &&
                "EPO plans combine features of HMO and PPO plans, with no referrals needed but network restrictions."}
              {formData.primaryInsurance.planType === "POS" &&
                "POS plans require a primary care physician but allow some out-of-network coverage with higher costs."}
              {formData.primaryInsurance.planType === "HDHP" &&
                "High Deductible Health Plans feature lower premiums but higher deductibles, often paired with HSAs."}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            onClick={() => insuranceForm.resetForm()}
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
            disabled={
              isSubmitting ||
              !validationResults?.isValid ||
              eligibilityCheck.result !== "verified"
            }
          >
            {isSubmitting ? "Submitting..." : "Continue to Medical History"}
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

        {eligibilityCheck.result !== "verified" &&
          formData.primaryInsurance?.provider && (
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                background: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "4px",
              }}
            >
              <p style={{ margin: 0, color: "#856404", fontSize: "14px" }}>
                ⚠️ Please verify your insurance eligibility before continuing to
                the next step.
              </p>
            </div>
          )}
      </form>
    </div>
  );
}
