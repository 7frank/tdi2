// 🔧 REFACTORED: HealthcareFormContainer using FormContainerController
import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "../services/FormDAGService";

import type { FormContainerControllerInterface } from "../controller/FormContainerController";

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
    formContainerController: Inject<FormContainerControllerInterface>;
  };
}

export function HealthcareFormContainer(props: HealthcareFormContainerProps) {
  const {
    services: { formDAG, formContainerController },
  } = props;

  // 🔧 CONTROLLER: All form lifecycle logic now handled by controller
  const currentFormComponent =
    formContainerController.getCurrentFormComponent();
  const completionStatus = formDAG.getCompletionStatus();

  // 🎨 COMPONENT VIEW STATE: Only UI-specific interactions remain here
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);
  const [animationKey, setAnimationKey] = React.useState(0);

  // 🔧 CONTROLLER: Form completion handler delegated to controller
  const handleFormComplete = async (nodeId: string) => {
    try {
      await formContainerController.handleFormComplete(nodeId);

      // 🎨 COMPONENT VIEW STATE: Trigger animation update
      setAnimationKey((prev) => prev + 1);
    } catch (error) {
      console.error(`❌ Form completion failed for ${nodeId}:`, error);
      // Error state is managed by the controller
    }
  };

  // 🔧 CONTROLLER: Form rendering logic with controller coordination
  const renderCurrentForm = () => {
    const formKey = `${currentFormComponent}-${animationKey}`;

    switch (currentFormComponent) {
      case "demographics":
        return (
          <DemographicsForm
            key={formKey}
            onComplete={() => handleFormComplete("demographics")}
          />
        );

      case "insurance":
        return (
          <InsuranceForm
            key={formKey}
            onComplete={() => handleFormComplete("insurance")}
          />
        );

      case "guardian_consent":
        return (
          <GuardianConsentForm
            key={formKey}
            onComplete={() => handleFormComplete("guardian_consent")}
          />
        );

      case "medical_history":
        return (
          <MedicalHistoryForm
            key={formKey}
            onComplete={() => handleFormComplete("medical_history")}
          />
        );

      case "specialist_referral":
        return (
          <SpecialistReferralForm
            key={formKey}
            onComplete={() => handleFormComplete("specialist_referral")}
          />
        );

      case "emergency_contacts":
        return (
          <EmergencyContactsForm
            key={formKey}
            onComplete={() => handleFormComplete("emergency_contacts")}
          />
        );

      case "hipaa_consent":
        return (
          <HIPAAConsentForm
            key={formKey}
            onComplete={() => handleFormComplete("hipaa_consent")}
          />
        );

      case "financial_responsibility":
        return (
          <FinancialResponsibilityForm
            key={formKey}
            onComplete={() => handleFormComplete("financial_responsibility")}
          />
        );

      case "final_submit":
        return (
          <FinalSubmitForm
            key={formKey}
            onComplete={() => handleFormComplete("final_submit")}
          />
        );

      default:
        // 🔧 CONTROLLER: Use controller for completion state detection
        if (completionStatus === "completed") {
          return <PatientOnboardingCompleted formDAG={formDAG} />;
        } else if (completionStatus === "ready_for_submit") {
          return (
            <ReadyForFinalSubmit
              formDAG={formDAG}
              onNavigate={() =>
                formContainerController.navigateToForm("final_submit")
              }
            />
          );
        } else {
          return (
            <UnknownFormState
              currentNode={currentFormComponent}
              onNavigate={(nodeId: string) =>
                formContainerController.navigateToForm(nodeId)
              }
            />
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
        // 🎨 COMPONENT VIEW STATE: Form transition animation
        opacity: formContainerController.state.isFormTransitioning ? 0.8 : 1,
        transition: "opacity 0.3s ease",
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
          TDI2 Enterprise Forms with Controller Architecture
        </p>

        {/* 🔧 CONTROLLER: Completion status from controller state */}
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

      {/* 🔧 CONTROLLER: Error handling with controller state */}
      {formContainerController.state.currentError && (
        <div
          style={{
            background: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#721c24" }}>
              ❌ Form Error
            </h4>
            <p style={{ margin: "0 0 8px 0", color: "#721c24" }}>
              {formContainerController.state.currentError}
            </p>

            {/* 🎨 COMPONENT VIEW STATE: Toggle error details */}
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              style={{
                background: "none",
                border: "none",
                color: "#721c24",
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline",
              }}
            >
              {showErrorDetails ? "Hide Details" : "Show Details"}
            </button>
          </div>

          <button
            onClick={() => formContainerController.clearError()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#721c24",
              padding: "0 0 0 10px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* 🔧 CONTROLLER: Success message with controller state */}
      {formContainerController.state.showSuccessMessage && (
        <div
          style={{
            background: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#155724" }}>
            ✅ {formContainerController.state.successMessage}
          </div>
          <button
            onClick={() => formContainerController.clearSuccess()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#155724",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Component */}
      <FormNavigation />

      {/* Current Form */}
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          overflow: "hidden",
          // 🔧 CONTROLLER: Form transition states
          transform: formContainerController.state.isFormTransitioning
            ? "translateY(10px)"
            : "translateY(0)",
          transition: "transform 0.3s ease",
        }}
      >
        {renderCurrentForm()}
      </div>

      {/* 🔧 ENHANCED: Debug Information with controller state */}
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
            <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
              <button
                onClick={() =>
                  console.log(
                    "🎮 Controller Debug:",
                    formContainerController.getDebugSnapshot()
                  )
                }
                style={{
                  padding: "6px 12px",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Log Controller State
              </button>
              <button
                onClick={() => formContainerController.resetDebugCounters()}
                style={{
                  padding: "6px 12px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Reset Counters
              </button>
              {showErrorDetails && (
                <button
                  onClick={() => {
                    const snapshot = formContainerController.getDebugSnapshot();
                    navigator.clipboard.writeText(
                      JSON.stringify(snapshot, null, 2)
                    );
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Copy Debug Info
                </button>
              )}
            </div>

            <h4>🎮 Controller State:</h4>
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
                  currentFormComponent:
                    formContainerController.state.currentFormComponent,
                  isTransitioning:
                    formContainerController.state.isFormTransitioning,
                  validationState:
                    formContainerController.state.formValidationState,
                  hasError: !!formContainerController.state.currentError,
                  debugInfo: formContainerController.state.debugInfo,
                },
                null,
                2
              )}
            </pre>

            {showErrorDetails && (
              <>
                <h4>📊 Complete Debug Snapshot:</h4>
                <pre
                  style={{
                    background: "#e9ecef",
                    padding: "10px",
                    borderRadius: "4px",
                    overflow: "auto",
                    fontSize: "12px",
                    maxHeight: "300px",
                  }}
                >
                  {JSON.stringify(
                    formContainerController.getDebugSnapshot(),
                    null,
                    2
                  )}
                </pre>
              </>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

// 🔧 UPDATED: Helper components with controller integration

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
  onNavigate,
}: {
  formDAG: FormDAGServiceInterface;
  onNavigate: () => void;
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
          onClick={onNavigate}
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
  onNavigate,
}: {
  currentNode: string;
  onNavigate: (nodeId: string) => void;
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
          onClick={() => onNavigate("demographics")}
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
