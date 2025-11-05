import React from "react";
import {
  FormContainer,
  Alert,
  LoadingButton,
  ProgressBar
} from "../components/common";

// Placeholder forms for the remaining form steps
// These demonstrate what would be implemented but only show "Next" buttons

interface PlaceholderFormProps {
  title: string;
  description: string;
  fields: string[];
  onComplete: () => void;
  estimatedTime?: number;
  icon?: string;
}

function PlaceholderForm(props: PlaceholderFormProps) {
  const { title, description, fields, onComplete, estimatedTime, icon } = props;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleComplete = async () => {
    setIsSubmitting(true);
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    onComplete();
  };

  return (
    <FormContainer
      title={title}
      subtitle={description}
      icon={icon}
      variant="card"
      size="medium"
      showProgress={estimatedTime ? true : false}
      progress={0} // Placeholder forms start at 0% since they're not implemented
      progressLabel={estimatedTime ? `Estimated: ${estimatedTime} minutes` : undefined}
      onSubmit={handleComplete}
      submitText={`Complete ${title} →`}
      canSubmit={true}
      isSubmitting={isSubmitting}
      isDirty={false}
    >
      {estimatedTime && (
        <Alert
          type="info"
          title={`Estimated completion time: ${estimatedTime} minutes`}
          icon="⏱️"
          variant="subtle"
        />
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
        <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#495057" }}>
          📋 Form Fields (Preview)
        </h3>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          {fields.map((field, index) => (
            <li key={index} style={{ 
              marginBottom: "8px", 
              fontSize: "14px",
              color: "#6c757d",
              lineHeight: "1.4"
            }}>
              {field}
            </li>
          ))}
        </ul>
      </div>

      <Alert
        type="warning"
        title="Development Note"
        message="This form is a placeholder. In the full implementation, this would contain interactive form fields with validation, conditional logic, and service integration."
        icon="🚧"
        variant="outlined"
      />

      {/* Show a fake progress animation when submitting */}
      {isSubmitting && (
        <div style={{ marginTop: "20px" }}>
          <ProgressBar
            progress={75}
            animated={true}
            showPercentage={false}
            label="Processing form completion..."
            color="primary"
            size="small"
          />
        </div>
      )}
    </FormContainer>
  );
}

// Medical History Form
export function MedicalHistoryForm({ onComplete }: { onComplete: () => void }) {
  return (
    <PlaceholderForm
      title="Medical History"
      description="Comprehensive medical history including chronic conditions, medications, allergies, and family history."
      icon="🏥"
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
      icon="👨‍👩‍👧‍👦"
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
      icon="🩺"
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
      icon="🚨"
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
      icon="🔒"
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
      icon="💳"
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