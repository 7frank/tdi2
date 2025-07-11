// 🔧 FULLY UPDATED: HealthcareFormContainer with final submit and completion handling
import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "../services/FormDAGService";
import type { DemographicsFormServiceInterface } from "../services/DemographicsFormService";
import type { InsuranceFormServiceInterface } from "../services/InsuranceFormService";

import { FormNavigation } from "./FormNavigation";
import { DemographicsForm } from "./forms/DemographicsForm";
import { InsuranceForm } from "./forms/InsuranceForm";
import { FinalSubmitForm } from "./FinalSubmitForm";
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
  const completionStatus = formDAG.getCompletionStatus();

  const handleFormComplete = async (nodeId: string) => {
    console.log(`🔄 Attempting to complete form: ${nodeId}`);

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
      } else if (nodeId === "final_submit") {
        // 🔧 NEW: Handle final submission completion
        console.log(
          "🎉 Final submission completed - patient onboarding finished!"
        );
        // No navigation needed - this is the end
        return;
      }

      // 🔧 FIX: Complete the node in DAG
      await formDAG.completeNode(nodeId);
      console.log(`✅ Form ${nodeId} completed successfully`);

      // 🔧 FIX: Navigate based on completion status
      const newCompletionStatus = formDAG.getCompletionStatus();

      if (newCompletionStatus === "ready_for_submit") {
        // All required forms done, go to final submit
        console.log(
          "🎯 All required forms completed, navigating to final submission"
        );
        const navigationSuccess = formDAG.navigateToNode("final_submit");
        if (!navigationSuccess) {
          console.warn("⚠️ Failed to navigate to final_submit");
        }
      } else if (newCompletionStatus === "completed") {
        // Final submission done, stay here
        console.log("🎉 Patient onboarding completely finished!");
      } else {
        // More forms to complete, navigate to next
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
          console.log("🤔 No more nodes available or already on optimal node");
        }
      }
    } catch (error) {
      console.error(`❌ Failed to complete ${nodeId}:`, error);

      // 🔧 FIX: Show user-friendly error message
      const errorMessage = error.message || `Failed to complete ${nodeId} form`;
      alert(`Error: ${errorMessage}`);

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

      // 🔧 NEW: Final submission form
      case "final_submit":
        return (
          <FinalSubmitForm
            services={{ formDAG }}
            onComplete={() => handleFormComplete("final_submit")}
          />
        );

      default:
        // 🔧 UPDATED: Handle completion states properly
        if (completionStatus === "completed") {
          return <PatientOnboardingCompleted formDAG={formDAG} />;
        } else if (completionStatus === "ready_for_submit") {
          return <ReadyForFinalSubmit formDAG={formDAG} />;
        } else {
          return (
            <UnknownFormState currentNode={currentNode} formDAG={formDAG} />
          );
        }
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
          TDI2 Enterprise Forms with Smart DAG Navigation
        </p>

        {/* 🔧 NEW: Show completion status in header */}
        <div
          style={{
            marginTop: "15px",
            padding: "8px 16px",
            background:
              completionStatus === "completed"
                ? "#d4edda"
                : completionStatus === "ready_for_submit"
                  ? "#fff3cd"
                  : "#e3f2fd",
            border: `1px solid ${
              completionStatus === "completed"
                ? "#c3e6cb"
                : completionStatus === "ready_for_submit"
                  ? "#ffeaa7"
                  : "#b3d9ff"
            }`,
            borderRadius: "20px",
            display: "inline-block",
            fontSize: "14px",
            fontWeight: "bold",
            color:
              completionStatus === "completed"
                ? "#155724"
                : completionStatus === "ready_for_submit"
                  ? "#856404"
                  : "#0d47a1",
          }}
        >
          {completionStatus === "completed"
            ? "🎉 Registration Complete"
            : completionStatus === "ready_for_submit"
              ? "✅ Ready for Submission"
              : "📋 In Progress"}
        </div>
      </header>

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

      {/* 🔧 ENHANCED: Debug Information with completion tracking */}
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
            <h4>🎯 Completion Status:</h4>
            <pre
              style={{
                background: "#e9ecef",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "12px",
              }}
            >
              {JSON.stringify(
                {
                  completionStatus: formDAG.getCompletionStatus(),
                  currentNode: formDAG.state.currentNode,
                  completedNodes: formDAG.state.completedNodes,
                  availableNodes: formDAG.state.availableNodes,
                  applicableForms: formDAG
                    .getApplicableForms()
                    .map((f) => f.id),
                  allRequiredCompleted: formDAG.areAllRequiredFormsCompleted(),
                  isFlowCompleted: formDAG.isFormFlowCompleted(),
                  progress: formDAG.calculateProgress(),
                  nextOptimalNode: formDAG.getNextOptimalNode(),
                },
                null,
                2
              )}
            </pre>

            <h4>📊 Form Data Status:</h4>
            <pre
              style={{
                background: "#e9ecef",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "12px",
                maxHeight: "200px",
              }}
            >
              {JSON.stringify(
                {
                  demographics: formDAG.state.formData.demographics
                    ? "Present"
                    : "Empty",
                  insurance: formDAG.state.formData.insurance
                    ? "Present"
                    : "Empty",
                  formDataKeys: Object.keys(formDAG.state.formData),
                },
                null,
                2
              )}
            </pre>

            <h4>⚙️ Service States:</h4>
            <pre
              style={{
                background: "#e9ecef",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "12px",
              }}
            >
              {JSON.stringify(
                {
                  demographicsForm: {
                    isDirty: demographicsForm.state.isDirty,
                    isValid: demographicsForm.state.validationResults?.isValid,
                    errorCount:
                      demographicsForm.state.validationResults?.errors.length ||
                      0,
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
                      insuranceForm.state.validationResults?.errors.length || 0,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}

// 🔧 NEW: Helper components for completion states

function PatientOnboardingCompleted({
  formDAG,
}: {
  formDAG: FormDAGServiceInterface;
}) {
  const { formData, completedNodes } = formDAG.state;
  const applicableForms = formDAG.getApplicableForms();

  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #28a745, #20c997)",
          color: "white",
          borderRadius: "16px",
          padding: "40px",
          marginBottom: "30px",
          boxShadow: "0 8px 32px rgba(40, 167, 69, 0.3)",
        }}
      >
        <div style={{ fontSize: "80px", marginBottom: "20px" }}>🎉</div>
        <h1 style={{ margin: "0 0 15px 0", fontSize: "3rem" }}>
          Registration Complete!
        </h1>
        <p style={{ margin: 0, fontSize: "1.3rem", opacity: 0.9 }}>
          Welcome to our healthcare system!
        </p>
      </div>

      <div
        style={{
          background: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "12px",
          padding: "30px",
          textAlign: "left",
        }}
      >
        <h2
          style={{
            color: "#155724",
            margin: "0 0 20px 0",
            textAlign: "center",
          }}
        >
          📋 Final Registration Summary
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <div>
            <p style={{ margin: "5px 0", color: "#155724" }}>
              <strong>Patient:</strong> {formData.demographics?.firstName}{" "}
              {formData.demographics?.lastName}
            </p>
            <p style={{ margin: "5px 0", color: "#155724" }}>
              <strong>Age:</strong> {formData.demographics?.age} years old
            </p>
            <p style={{ margin: "5px 0", color: "#155724" }}>
              <strong>Patient ID:</strong> PAT-{Date.now().toString().slice(-6)}
            </p>
          </div>
          <div>
            <p style={{ margin: "5px 0", color: "#155724" }}>
              <strong>Insurance:</strong>{" "}
              {formData.insurance?.primaryInsurance?.provider}
            </p>
            <p style={{ margin: "5px 0", color: "#155724" }}>
              <strong>Plan:</strong>{" "}
              {formData.insurance?.primaryInsurance?.planType}
            </p>
            <p style={{ margin: "5px 0", color: "#155724" }}>
              <strong>Registration Date:</strong>{" "}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            padding: "15px",
            background: "#c3e6cb",
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              margin: "0 0 10px 0",
              color: "#155724",
              fontWeight: "bold",
            }}
          >
            ✅ Forms Completed: {completedNodes.length} /{" "}
            {applicableForms.length}
          </p>
          <p style={{ margin: 0, color: "#155724", fontSize: "14px" }}>
            Your healthcare provider will contact you within 24 hours to
            schedule your first appointment.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReadyForFinalSubmit({
  formDAG,
}: {
  formDAG: FormDAGServiceInterface;
}) {
  const applicableForms = formDAG
    .getApplicableForms()
    .filter((f) => f.id !== "final_submit");

  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #fff3cd, #ffeaa7)",
          border: "1px solid #ffeaa7",
          borderRadius: "12px",
          padding: "30px",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>✅</div>
        <h2 style={{ color: "#856404", margin: "0 0 15px 0" }}>
          All Required Forms Completed!
        </h2>
        <p
          style={{ color: "#856404", margin: "0 0 20px 0", fontSize: "1.1rem" }}
        >
          You've successfully completed all {applicableForms.length} applicable
          forms.
        </p>

        <button
          onClick={() => formDAG.navigateToNode("final_submit")}
          style={{
            padding: "16px 32px",
            background: "linear-gradient(45deg, #007bff, #0056b3)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
          }}
        >
          🎯 Proceed to Final Submission
        </button>
      </div>

      <div
        style={{
          background: "#e3f2fd",
          border: "1px solid #b3d9ff",
          borderRadius: "8px",
          padding: "15px",
          fontSize: "14px",
          color: "#0d47a1",
        }}
      >
        💡 <strong>Next Step:</strong> Review your information and complete the
        final submission process.
      </div>
    </div>
  );
}

function UnknownFormState({
  currentNode,
  formDAG,
}: {
  currentNode: string;
  formDAG: FormDAGServiceInterface;
}) {
  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "8px",
          padding: "30px",
        }}
      >
        <h2 style={{ color: "#721c24", margin: "0 0 15px 0" }}>
          ⚠️ Unknown Form State
        </h2>
        <p style={{ color: "#721c24", margin: "0 0 20px 0" }}>
          Current node: <code>{currentNode}</code>
        </p>
        <p style={{ color: "#721c24", margin: "0 0 20px 0" }}>
          This shouldn't happen. Please check the form configuration.
        </p>

        <button
          onClick={() => formDAG.navigateToNode("demographics")}
          style={{
            padding: "12px 24px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ← Return to Demographics
        </button>
      </div>
    </div>
  );
}
