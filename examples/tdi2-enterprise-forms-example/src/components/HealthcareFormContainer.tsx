import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "../services/FormDAGService";
import type { DemographicsFormServiceInterface } from "../services/DemographicsFormService";
import type { InsuranceFormServiceInterface } from "../services/InsuranceFormService";
import { Alert } from "../components/common";

import { FormNavigation } from "./FormNavigation";
import { DemographicsForm } from "./forms/DemographicsForm";
import { InsuranceForm } from "./forms/InsuranceForm";
import {
  MedicalHistoryForm,
  GuardianConsentForm,
  SpecialistReferralForm,
  EmergencyContactsForm,
  HIPAAConsentForm,
  FinancialResponsibilityForm,
} from "./PlaceholderForms";

interface HealthcareFormContainerProps {
  services: {
    formDAG: Inject<FormDAGServiceInterface>;
    demographicsForm: Inject<DemographicsFormServiceInterface>;
    insuranceForm: Inject<InsuranceFormServiceInterface>;
  };
}

export function HealthcareFormContainer(props: HealthcareFormContainerProps) {
  const {
    services: { formDAG, demographicsForm, insuranceForm },
  } = props;

  const { currentNode, completedNodes } = formDAG.state;
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleFormComplete = async (nodeId: string) => {
    console.log(`🔄 Attempting to complete form: ${nodeId}`);
    setLastError(null);

    try {
      // 🔧 FIX: Validate form completion before proceeding
      if (nodeId === "demographics") {
        // Check if demographics form is actually valid and submitted
        const validationResult = await demographicsForm.validateForm();
        if (!validationResult.isValid) {
          console.error(
            "❌ Demographics form validation failed:",
            validationResult.errors
          );
          throw new Error(
            "Demographics form is not valid. Please fix all errors before continuing."
          );
        }

        // Store demographics data in DAG
        formDAG.state.formData.demographics = demographicsForm.state
          .formData as any;
        console.log(
          "✅ Demographics data stored:",
          formDAG.state.formData.demographics
        );
      } else if (nodeId === "insurance") {
        // 🔧 FIX: Check insurance form completion requirements
        const canSubmit = insuranceForm.canSubmitForm();
        if (!canSubmit) {
          console.error("❌ Insurance form is not ready for submission");
          throw new Error(
            "Insurance form is not ready. Please complete all required fields and verify eligibility."
          );
        }

        const validationResult = await insuranceForm.validateForm();
        if (!validationResult.isValid) {
          console.error(
            "❌ Insurance form validation failed:",
            validationResult.errors
          );
          throw new Error(
            "Insurance form is not valid. Please fix all errors before continuing."
          );
        }

        // Check eligibility verification
        if (insuranceForm.state.eligibilityCheck.result !== "verified") {
          console.error("❌ Insurance eligibility not verified");
          throw new Error(
            "Please verify your insurance eligibility before continuing."
          );
        }

        // Store insurance data in DAG
        formDAG.state.formData.insurance = insuranceForm.state.formData as any;
        console.log(
          "✅ Insurance data stored:",
          formDAG.state.formData.insurance
        );
      }

      // 🔧 FIX: Complete the node in DAG
      await formDAG.completeNode(nodeId);
      console.log(`✅ Form ${nodeId} completed successfully`);

      // Show success message briefly
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // 🔧 FIX: Navigate to next optimal node
      const nextNode = formDAG.getNextOptimalNode();
      if (nextNode && nextNode !== currentNode) {
        console.log(`🔄 Navigating to next node: ${nextNode}`);
        const navigationSuccess = formDAG.navigateToNode(nextNode);
        if (!navigationSuccess) {
          console.warn(
            `⚠️ Failed to navigate to ${nextNode}, staying on current node`
          );
        }
      } else {
        console.log("🎉 No more nodes available - forms completed!");
      }
    } catch (error) {
      console.error(`❌ Failed to complete ${nodeId}:`, error);

      // 🔧 FIX: Show user-friendly error message using Alert component
      const errorMessage = error.message || `Failed to complete ${nodeId} form`;
      setLastError(errorMessage);

      // Auto-hide error after 10 seconds
      setTimeout(() => setLastError(null), 10000);

      // Don't navigate if completion failed
      return;
    }
  };

  const renderCurrentForm = () => {
    switch (currentNode) {
      case "demographics":
        return (
          <DemographicsForm
            services={{ demographicsForm }}
            onComplete={() => handleFormComplete("demographics")}
          />
        );

      case "insurance":
        return (
          <InsuranceForm
            services={{ insuranceForm }}
            onComplete={() => handleFormComplete("insurance")}
          />
        );

      case "guardian_consent":
        return (
          <GuardianConsentForm
            onComplete={() => handleFormComplete("guardian_consent")}
          />
        );

      case "medical_history":
        return (
          <MedicalHistoryForm
            onComplete={() => handleFormComplete("medical_history")}
          />
        );

      case "specialist_referral":
        return (
          <SpecialistReferralForm
            onComplete={() => handleFormComplete("specialist_referral")}
          />
        );

      case "emergency_contacts":
        return (
          <EmergencyContactsForm
            onComplete={() => handleFormComplete("emergency_contacts")}
          />
        );

      case "hipaa_consent":
        return (
          <HIPAAConsentForm
            onComplete={() => handleFormComplete("hipaa_consent")}
          />
        );

      case "financial_responsibility":
        return (
          <FinancialResponsibilityForm
            onComplete={() => handleFormComplete("financial_responsibility")}
          />
        );

      default:
        return (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎉</div>
            <h2 style={{ color: "#28a745", marginBottom: "16px" }}>
              Patient Onboarding Complete!
            </h2>
            <p
              style={{
                color: "#6c757d",
                marginBottom: "30px",
                fontSize: "16px",
              }}
            >
              All required forms have been completed successfully.
            </p>

            <Alert
              type="success"
              title="Onboarding Summary"
              variant="filled"
              size="large"
            >
              <div style={{ textAlign: "left", marginTop: "10px" }}>
                <p>
                  <strong>Forms Completed:</strong> {completedNodes.length}
                </p>
                <p>
                  <strong>Patient:</strong>{" "}
                  {formDAG.state.formData.demographics?.firstName}{" "}
                  {formDAG.state.formData.demographics?.lastName}
                </p>
                <p>
                  <strong>Age:</strong>{" "}
                  {formDAG.state.formData.demographics?.age}
                </p>
                <p>
                  <strong>Insurance:</strong>{" "}
                  {formDAG.state.formData.insurance?.primaryInsurance?.provider}
                </p>
                <p>
                  <strong>Plan Type:</strong>{" "}
                  {formDAG.state.formData.insurance?.primaryInsurance?.planType}
                </p>
              </div>
            </Alert>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          textAlign: "center",
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "2px solid #007bff",
        }}
      >
        <h1
          style={{
            margin: 0,
            color: "#007bff",
            fontSize: "2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          🏥 Healthcare Patient Onboarding
        </h1>
        <p
          style={{
            margin: "10px 0 0 0",
            color: "#6c757d",
            fontSize: "1.1rem",
          }}
        >
          TDI2 Enterprise Forms with DAG Navigation & Reusable Components
        </p>
      </header>

      {/* Global Success Message */}
      {showSuccess && (
        <Alert
          type="success"
          title="Form Completed Successfully!"
          message="Moving to the next step..."
          dismissible={true}
          onDismiss={() => setShowSuccess(false)}
          autoClose={true}
          autoCloseDelay={3000}
        />
      )}

      {/* Global Error Message */}
      {lastError && (
        <Alert
          type="error"
          title="Form Completion Error"
          message={lastError}
          dismissible={true}
          onDismiss={() => setLastError(null)}
        />
      )}

      {/* Navigation Component */}
      <FormNavigation services={{ formDAG }} />

      {/* Current Form */}
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {renderCurrentForm()}
      </div>

      {/* 🔧 FIX: Enhanced Debug Information */}
      {process.env.NODE_ENV === "development" && (
        <details
          style={{
            marginTop: "30px",
            padding: "15px",
            background: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "8px",
          }}
        >
          <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
            🔧 Debug Information (Development Mode)
          </summary>
          <div style={{ marginTop: "15px" }}>
            <Alert
              type="info"
              title="Current State"
              variant="subtle"
              size="small"
            >
              <pre
                style={{
                  background: "#e9ecef",
                  padding: "10px",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                  margin: "10px 0 0 0",
                }}
              >
                {JSON.stringify(
                  {
                    currentNode: formDAG.state.currentNode,
                    completedNodes: formDAG.state.completedNodes,
                    availableNodes: formDAG.state.availableNodes,
                    progress: formDAG.calculateProgress(),
                    nextOptimalNode: formDAG.getNextOptimalNode(),
                    formData: {
                      demographics: formDAG.state.formData.demographics
                        ? "Present"
                        : "Empty",
                      insurance: formDAG.state.formData.insurance
                        ? "Present"
                        : "Empty",
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </Alert>

            <Alert
              type="info"
              title="Service States"
              variant="subtle"
              size="small"
            >
              <pre
                style={{
                  background: "#e9ecef",
                  padding: "10px",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                  margin: "10px 0 0 0",
                }}
              >
                {JSON.stringify(
                  {
                    demographicsForm: {
                      isDirty: demographicsForm.state.isDirty,
                      isValid:
                        demographicsForm.state.validationResults?.isValid,
                      errorCount:
                        demographicsForm.state.validationResults?.errors
                          .length || 0,
                    },
                    insuranceForm: {
                      isDirty: insuranceForm.state.isDirty,
                      isValid: insuranceForm.state.validationResults?.isValid,
                      eligibilityStatus:
                        insuranceForm.state.eligibilityCheck.result,
                      canSubmit: insuranceForm.canSubmitForm(),
                      isSubmissionComplete:
                        insuranceForm.state.isSubmissionComplete,
                      submissionError: insuranceForm.state.submissionError,
                      errorCount:
                        insuranceForm.state.validationResults?.errors.length ||
                        0,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </Alert>

            {/* 🔧 FIX: Add form data preview */}
            <Alert
              type="info"
              title="Form Data Preview"
              variant="subtle"
              size="small"
            >
              <pre
                style={{
                  background: "#e9ecef",
                  padding: "10px",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                  maxHeight: "200px",
                  margin: "10px 0 0 0",
                }}
              >
                {JSON.stringify(
                  {
                    demographics: demographicsForm.state.formData,
                    insurance: insuranceForm.state.formData,
                  },
                  null,
                  2
                )}
              </pre>
            </Alert>
          </div>
        </details>
      )}
    </div>
  );
}
