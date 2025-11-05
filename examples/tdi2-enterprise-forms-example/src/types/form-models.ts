export interface PatientDemographics {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  ssn: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  email: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface InsuranceInformation {
  primaryInsurance: {
    provider: string;
    planType: 'HMO' | 'PPO' | 'EPO' | 'POS' | 'HDHP';
    memberId: string;
    groupNumber: string;
    effectiveDate: string;
    copay: number;
    deductible: number;
  };
  secondaryInsurance?: {
    provider: string;
    memberId: string;
    relationship: 'self' | 'spouse' | 'parent' | 'other';
  };
  eligibilityStatus: 'pending' | 'verified' | 'denied' | 'expired';
  coverageDetails: {
    preventive: boolean;
    specialist: boolean;
    emergencyRoom: boolean;
    prescriptions: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface FormNode {
  id: string;
  title: string;
  dependencies: string[];
  conditions: Condition[];
  isCompleted: boolean;
  isAvailable: boolean;
  estimatedTime: number; // minutes
}

export interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'includes' | 'in';
  value: any;
}

export interface FormSnapshot {
  id: string;
  nodeId: string;
  data: any;
  timestamp: Date;
  validationResults: ValidationResult[];
}
