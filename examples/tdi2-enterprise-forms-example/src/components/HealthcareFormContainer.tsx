import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "../services/FormDAGService";
import type { DemographicsFormServiceInterface } from "../services/DemographicsFormService";
import type { InsuranceFormServiceInterface } from "../services/InsuranceFormService";

import { FormNavigation } from "./FormNavigation";
import { DemographicsForm } from "./DemographicsForm";
import { InsuranceForm } from "./InsuranceForm";
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
  const { services:{ formDAG, demographicsForm, insuranceForm } } = props;
  
  const { currentNode, completedNodes } = formDAG.state;

  const handleFormComplete = async (nodeId: string) => {
    try {
      // Update the DAG with completion
      await formDAG.completeNode(nodeId);

      // Store form data in DAG for cross-form access
      if (nodeId === "demographics") {
        formDAG.state.formData.demographics = demographicsForm.state
          .formData as any;
      } else if (nodeId === "insurance") {
        formDAG.state.formData.insurance = insuranceForm.state.formData as any;
      }

      // Navigate to next optimal node
      const nextNode = formDAG.getNextOptimalNode();
      if (nextNode) {
        formDAG.navigateToNode(nextNode);
      }
    } catch (error) {
      console.error(`Failed to complete ${nodeId}:`, error);
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
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>🎉 Patient Onboarding Complete!</h2>
            <p>All required forms have been completed successfully.</p>
            <div
              style={{
                background: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: "8px",
                padding: "20px",
                marginTop: "20px",
              }}
            >
              <h3>Summary</h3>
              <p>
                <strong>Forms Completed:</strong> {completedNodes.length}
              </p>
              <p>
                <strong>Patient:</strong>{" "}
                {formDAG.state.formData.demographics?.firstName}{" "}
                {formDAG.state.formData.demographics?.lastName}
              </p>
              <p>
                <strong>Age:</strong> {formDAG.state.formData.demographics?.age}
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
          TDI2 Enterprise Forms with DAG Navigation
        </p>
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

      {/* Debug Information (Development Only) */}
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
            <h4>Current State:</h4>
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
                  currentNode: formDAG.state.currentNode,
                  completedNodes: formDAG.state.completedNodes,
                  availableNodes: formDAG.state.availableNodes,
                  progress: formDAG.calculateProgress(),
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

            <h4>Service States:</h4>
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
