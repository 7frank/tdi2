import React, { useState } from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "../services/FormDAGService";

interface FinalSubmitFormProps {
  services: {
    formDAG: Inject<FormDAGServiceInterface>;
  };
  onComplete: () => void;
}

export function FinalSubmitForm(props: FinalSubmitFormProps) {
  const { services: { formDAG }, onComplete } = props;
  
  // 🎨 COMPONENT VIEW STATE: UI-only interactions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<'review' | 'submitting' | 'success'>('review');
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  
  // Business state from service
  const { formData, completedNodes } = formDAG.state;
  const applicableForms = formDAG.getApplicableForms().filter(f => f.id !== 'final_submit');

  const handleFinalSubmit = async () => {
    if (!agreementChecked) {
      alert("Please review and agree to the submission terms.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionStep('submitting');
    setSubmissionProgress(0);

    try {
      // Simulate submission progress
      const progressSteps = [
        { step: 10, message: "Validating patient demographics..." },
        { step: 25, message: "Verifying insurance information..." },
        { step: 40, message: "Processing medical history..." },
        { step: 60, message: "Submitting to healthcare system..." },
        { step: 80, message: "Generating patient record..." },
        { step: 95, message: "Finalizing registration..." },
        { step: 100, message: "Patient onboarding completed!" }
      ];

      for (const { step, message } of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSubmissionProgress(step);
        console.log(`📋 ${message}`);
      }

      // Mark final submission as complete
      await formDAG.completeNode('final_submit');
      
      setSubmissionStep('success');
      
      // Auto-advance after success celebration
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error("Final submission failed:", error);
      alert("Submission failed. Please try again.");
      setSubmissionStep('review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormIcon = (formId: string) => {
    const icons = {
      demographics: "👤",
      insurance: "🏥", 
      guardian_consent: "👨‍👩‍👧‍👦",
      medical_history: "🩺",
      specialist_referral: "🔗",
      emergency_contacts: "🚨",
      hipaa_consent: "🔒",
      financial_responsibility: "💳"
    };
    return icons[formId] || "📋";
  };

  const formatFormData = (data: any): string => {
    return JSON.stringify(data, null, 2)
      .replace(/"/g, '')
      .replace(/[{}]/g, '')
      .replace(/,/g, '')
      .trim();
  };

  if (submissionStep === 'submitting') {
    return (
      <div style={{ padding: "40px", maxWidth: "600px", textAlign: "center" }}>
        <h2>🚀 Submitting Patient Information</h2>
        
        <div style={{
          width: "100%",
          height: "20px",
          background: "#e9ecef",
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "20px"
        }}>
          <div style={{
            width: `${submissionProgress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #007bff, #28a745)",
            transition: "width 0.5s ease",
            borderRadius: "10px"
          }} />
        </div>
        
        <p style={{ fontSize: "18px", color: "#007bff", marginBottom: "30px" }}>
          {submissionProgress}% Complete
        </p>
        
        <div style={{
          background: "#f8f9fa",
          border: "1px solid #dee2e6", 
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3>📊 Submission Summary</h3>
          <p>✅ Forms Completed: {completedNodes.length}</p>
          <p>👤 Patient: {formData.demographics?.firstName} {formData.demographics?.lastName}</p>
          <p>🏥 Insurance: {formData.insurance?.primaryInsurance?.provider}</p>
          <p>📅 Age: {formData.demographics?.age}</p>
        </div>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          color: "#6c757d"
        }}>
          <div style={{
            width: "20px",
            height: "20px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <span>Processing your information securely...</span>
        </div>
      </div>
    );
  }

  if (submissionStep === 'success') {
    return (
      <div style={{ padding: "40px", maxWidth: "600px", textAlign: "center" }}>
        <div style={{
          background: "linear-gradient(135deg, #28a745, #20c997)",
          color: "white",
          borderRadius: "12px",
          padding: "40px",
          marginBottom: "30px"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎉</div>
          <h1 style={{ margin: "0 0 15px 0", fontSize: "2.5rem" }}>
            Patient Onboarding Complete!
          </h1>
          <p style={{ margin: 0, fontSize: "1.2rem", opacity: 0.9 }}>
            Welcome to our healthcare system, {formData.demographics?.firstName}!
          </p>
        </div>
        
        <div style={{
          background: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <h3 style={{ color: "#155724", margin: "0 0 15px 0" }}>
            📋 Registration Summary
          </h3>
          <div style={{ color: "#155724", textAlign: "left" }}>
            <p><strong>Patient ID:</strong> PAT-{Date.now().toString().slice(-6)}</p>
            <p><strong>Registration Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Forms Completed:</strong> {applicableForms.length}</p>
            <p><strong>Next Steps:</strong> Your healthcare provider will contact you within 24 hours</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#28a745", fontSize: "2.5rem", margin: "0 0 10px 0" }}>
          🎯 Review & Submit Patient Information
        </h1>
        <p style={{ color: "#6c757d", fontSize: "1.1rem", margin: 0 }}>
          Please review your information before final submission
        </p>
      </div>

      {/* Completion Status */}
      <div style={{
        background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
        border: "1px solid #b3d9ff",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "30px",
        textAlign: "center"
      }}>
        <h2 style={{ margin: "0 0 15px 0", color: "#1976d2" }}>
          ✅ All Required Forms Completed
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginBottom: "15px" }}>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#28a745" }}>
              {applicableForms.length}
            </div>
            <div style={{ fontSize: "14px", color: "#6c757d" }}>Forms Completed</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#007bff" }}>
              100%
            </div>
            <div style={{ fontSize: "14px", color: "#6c757d" }}>Progress</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#17a2b8" }}>
              {applicableForms.reduce((sum, form) => sum + form.estimatedTime, 0)}
            </div>
            <div style={{ fontSize: "14px", color: "#6c757d" }}>Minutes Invested</div>
          </div>
        </div>
        <p style={{ margin: 0, color: "#495057", fontStyle: "italic" }}>
          Ready for healthcare system registration
        </p>
      </div>

      {/* Forms Summary */}
      <div style={{
        background: "#fff",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        marginBottom: "30px"
      }}>
        <div style={{
          background: "#f8f9fa",
          padding: "15px 20px",
          borderBottom: "1px solid #dee2e6",
          borderRadius: "8px 8px 0 0"
        }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            📋 Completed Forms Summary
            <button
              onClick={() => setShowDataPreview(!showDataPreview)}
              style={{
                marginLeft: "auto",
                padding: "4px 12px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {showDataPreview ? "Hide" : "Preview"} Data
            </button>
          </h3>
        </div>
        
        <div style={{ padding: "20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
            marginBottom: showDataPreview ? "20px" : "0"
          }}>
            {applicableForms.map((form) => (
              <div key={form.id} style={{
                background: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: "6px",
                padding: "15px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "24px" }}>{getFormIcon(form.id)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
                    {form.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6c757d" }}>
                    ✅ Completed • {form.estimatedTime} min
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Data Preview */}
          {showDataPreview && (
            <div style={{
              background: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              padding: "15px",
              marginTop: "20px"
            }}>
              <h4 style={{ margin: "0 0 15px 0", color: "#495057" }}>
                📊 Data Preview (Protected Information)
              </h4>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                fontSize: "12px"
              }}>
                <div>
                  <strong>Demographics:</strong>
                  <pre style={{
                    background: "#fff",
                    padding: "8px",
                    borderRadius: "4px",
                    margin: "4px 0 0 0",
                    fontSize: "11px",
                    maxHeight: "120px",
                    overflow: "auto"
                  }}>
                    {formatFormData(formData.demographics)}
                  </pre>
                </div>
                <div>
                  <strong>Insurance:</strong>
                  <pre style={{
                    background: "#fff",
                    padding: "8px",
                    borderRadius: "4px",
                    margin: "4px 0 0 0",
                    fontSize: "11px",
                    maxHeight: "120px",
                    overflow: "auto"
                  }}>
                    {formatFormData(formData.insurance)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission Agreement */}
      <div style={{
        background: "#fff3cd",
        border: "1px solid #ffeaa7",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "30px"
      }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#856404" }}>
          📝 Submission Agreement
        </h3>
        <div style={{ color: "#856404", fontSize: "14px", lineHeight: "1.5", marginBottom: "15px" }}>
          <p>By submitting this information, I confirm that:</p>
          <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
            <li>All information provided is accurate and complete</li>
            <li>I understand this data will be used for healthcare registration</li>
            <li>I consent to processing under HIPAA regulations</li>
            <li>I acknowledge receipt of privacy practices notice</li>
          </ul>
        </div>
        
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          fontWeight: "bold",
          color: "#856404"
        }}>
          <input
            type="checkbox"
            checked={agreementChecked}
            onChange={(e) => setAgreementChecked(e.target.checked)}
            style={{ transform: "scale(1.2)" }}
          />
          I have reviewed all information and agree to submit for processing
        </label>
      </div>

      {/* Submission Actions */}
      <div style={{
        display: "flex",
        gap: "15px",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <button
          onClick={() => formDAG.navigateToNode('demographics')}
          style={{
            padding: "12px 24px",
            background: "white",
            color: "#6c757d",
            border: "2px solid #6c757d",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          ← Review Forms
        </button>
        
        <button
          onClick={handleFinalSubmit}
          disabled={!agreementChecked || isSubmitting}
          style={{
            padding: "16px 32px",
            background: agreementChecked 
              ? "linear-gradient(45deg, #28a745, #20c997)" 
              : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: agreementChecked ? "pointer" : "not-allowed",
            fontSize: "18px",
            fontWeight: "bold",
            boxShadow: agreementChecked ? "0 4px 12px rgba(40, 167, 69, 0.3)" : "none",
            transform: agreementChecked ? "translateY(-1px)" : "none",
            transition: "all 0.2s ease"
          }}
        >
          {isSubmitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "20px",
                height: "20px", 
                border: "2px solid transparent",
                borderTop: "2px solid #fff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              Submitting...
            </span>
          ) : (
            "🚀 Complete Patient Onboarding"
          )}
        </button>
      </div>

      {/* Submission Status */}
      {!agreementChecked && (
        <div style={{
          textAlign: "center",
          marginTop: "15px",
          color: "#856404",
          fontSize: "14px",
          fontStyle: "italic"
        }}>
          Please review and agree to terms before submitting
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}