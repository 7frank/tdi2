import React from "react";

// Placeholder forms for the remaining form steps
// These demonstrate what would be implemented but only show "Next" buttons

interface PlaceholderFormProps {
  title: string;
  description: string;
  fields: string[];
  onComplete: () => void;
  estimatedTime?: number;
}

function PlaceholderForm(p: PlaceholderFormProps) {
  const { title, description, fields, onComplete, estimatedTime } = p;
  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>{title}</h2>
      <p style={{ color: "#6c757d", marginBottom: "20px" }}>{description}</p>

      {estimatedTime && (
        <div
          style={{
            background: "#e3f2fd",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          ⏱️ Estimated completion time: {estimatedTime} minutes
        </div>
      )}

      <div
        style={{
          background: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>
          Form Fields (Preview)
        </h3>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          {fields.map((field, index) => (
            <li key={index} style={{ marginBottom: "8px", fontSize: "14px" }}>
              {field}
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          background: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "4px",
          padding: "15px",
          marginBottom: "20px",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", color: "#856404" }}>
          🚧 <strong>Development Note:</strong> This form is a placeholder. In
          the full implementation, this would contain interactive form fields
          with validation, conditional logic, and service integration.
        </p>
      </div>

      <button
        onClick={onComplete}
        style={{
          padding: "12px 24px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Complete {title} →
      </button>
    </div>
  );
}

// Medical History Form
export function MedicalHistoryForm({ onComplete }: { onComplete: () => void }) {
  return (
    <PlaceholderForm
      title="Medical History"
      description="Comprehensive medical history including chronic conditions, medications, allergies, and family history."
      estimatedTime={10}
      fields={[
        "Current medications and dosages",
        "Known allergies (medications, food, environmental)",
        "Chronic conditions (diabetes, hypertension, etc.)",
        "Previous surgeries and hospitalizations",
        "Family medical history",
        "Immunization records",
        "Current symptoms or health concerns",
        "Mental health history",
        "Substance use history",
        "Women's health (if applicable)",
      ]}
      onComplete={onComplete}
    />
  );
}

// Guardian Consent Form (for minors)
export function GuardianConsentForm({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <PlaceholderForm
      title="Guardian Consent"
      description="Required consent forms and guardian information for patients under 18 years of age."
      estimatedTime={3}
      fields={[
        "Guardian/parent full name",
        "Relationship to patient",
        "Guardian contact information",
        "Legal guardianship documentation",
        "Consent for medical treatment",
        "Consent for emergency treatment",
        "HIPAA authorization for guardian",
        "Financial responsibility acknowledgment",
        "Photography/media consent",
        "Guardian signature and date",
      ]}
      onComplete={onComplete}
    />
  );
}

// Specialist Referral Form
export function SpecialistReferralForm({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <PlaceholderForm
      title="Specialist Referral"
      description="Referral management for specialist care based on medical conditions and insurance coverage."
      estimatedTime={6}
      fields={[
        "Referring physician information",
        "Specialist type needed (cardiology, dermatology, etc.)",
        "Medical reason for referral",
        "Urgency level (routine, urgent, emergency)",
        "Preferred specialist or facility",
        "Insurance pre-authorization requirements",
        "Appointment scheduling preferences",
        "Medical records to be transferred",
        "Follow-up instructions",
        "Patient acknowledgment of referral",
      ]}
      onComplete={onComplete}
    />
  );
}

// Emergency Contacts Form
export function EmergencyContactsForm({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <PlaceholderForm
      title="Emergency Contacts"
      description="Emergency contact information for patient safety and family notification."
      estimatedTime={4}
      fields={[
        "Primary emergency contact name",
        "Primary contact relationship",
        "Primary contact phone numbers",
        "Secondary emergency contact name",
        "Secondary contact relationship",
        "Secondary contact phone numbers",
        "Contact priority order",
        "Special instructions for contact",
        "Power of attorney information (if applicable)",
        "Emergency contact authorization",
      ]}
      onComplete={onComplete}
    />
  );
}

// HIPAA Consent Form
export function HIPAAConsentForm({ onComplete }: { onComplete: () => void }) {
  return (
    <PlaceholderForm
      title="HIPAA Consent"
      description="Required privacy notices and consent forms for protected health information."
      estimatedTime={5}
      fields={[
        "HIPAA Privacy Notice acknowledgment",
        "Consent for treatment communications",
        "Authorized individuals for health information",
        "Communication preferences (phone, email, mail)",
        "Marketing communications opt-in/out",
        "Research participation consent",
        "Electronic health records consent",
        "Patient portal access agreement",
        "Information sharing with other providers",
        "Patient signature and date",
      ]}
      onComplete={onComplete}
    />
  );
}

// Financial Responsibility Form
export function FinancialResponsibilityForm({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <PlaceholderForm
      title="Financial Responsibility"
      description="Payment methods, billing information, and financial responsibility agreements."
      estimatedTime={7}
      fields={[
        "Billing address (if different from patient address)",
        "Preferred payment method",
        "Credit card information (for copays)",
        "Bank account for automatic payments",
        "Financial hardship considerations",
        "Payment plan options",
        "Collection agency authorization",
        "Insurance assignment of benefits",
        "Financial responsibility acknowledgment",
        "Signature for payment agreement",
      ]}
      onComplete={onComplete}
    />
  );
}
