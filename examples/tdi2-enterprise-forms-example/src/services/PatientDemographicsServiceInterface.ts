export interface PatientDemographicsServiceInterface {
  state: {
    /** Cache of supported states/provinces */
    supportedStates: State[];
    
    /** Cache of zip code lookups */
    zipCodeCache: Map<string, ZipCodeInfo>;
    
    /** Age calculation cache */
    ageCache: Map<string, AgeCalculation>;
    
    /** Emergency contact validation results */
    emergencyContactValidation: Map<string, ContactValidationResult>;
    
    /** Current demographics validation state */
    validationState: DemographicsValidationState;
  };

  // Age and Date Operations
  
  /**
   * Calculate age from date of birth
   * @param dateOfBirth - Date of birth
   * @param asOfDate - Date to calculate age as of (defaults to today)
   * @returns Calculated age information
   */
  calculateAge(dateOfBirth: Date | string, asOfDate?: Date): AgeCalculation | null;
  
  /**
   * Determine if patient is a minor based on jurisdiction
   * @param dateOfBirth - Patient's date of birth
   * @param jurisdiction - State/province for age of majority rules
   * @returns Whether patient is considered a minor
   */
  isMinor(dateOfBirth: Date | string, jurisdiction?: string): boolean;
  
  /**
   * Get age of majority for a specific jurisdiction
   * @param jurisdiction - State/province code
   * @returns Age of majority in that jurisdiction
   */
  getAgeOfMajority(jurisdiction: string): number;
  
  /**
   * Update dependent fields when age changes
   * Triggers insurance type selection, guardian requirements, etc.
   * @param dateOfBirth - New date of birth
   */
  updateAgeBasedFields(dateOfBirth: Date | string): void;
  
  // Address and Geographic Operations
  
  /**
   * Lookup city and state from ZIP code
   * @param zipCode - ZIP code to lookup
   * @returns Promise resolving to location information
   */
  lookupCityState(zipCode: string): Promise<ZipCodeInfo>;
  
  /**
   * Validate address format for jurisdiction
   * @param address - Address to validate
   * @param country - Country code (defaults to US)
   * @returns Promise resolving to validation result
   */
  validateAddress(address: Address, country?: string): Promise<AddressValidationResult>;
  
  /**
   * Get supported states/provinces
   * @param country - Country code (defaults to US)
   * @returns Array of supported states/provinces
   */
  getSupportedStates(country?: string): State[];
  
  /**
   * Standardize address format
   * @param address - Address to standardize
   * @returns Standardized address format
   */
  standardizeAddress(address: Address): Address;
  
  /**
   * Validate ZIP/postal code format
   * @param code - ZIP or postal code
   * @param country - Country code
   * @returns Whether format is valid for the country
   */
  validatePostalCode(code: string, country?: string): boolean;
  
  // Contact Information Operations
  
  /**
   * Format phone number according to regional standards
   * @param phoneNumber - Raw phone number
   * @param country - Country code for formatting
   * @returns Formatted phone number
   */
  formatPhoneNumber(phoneNumber: string, country?: string): string;
  
  /**
   * Validate phone number format
   * @param phoneNumber - Phone number to validate
   * @param country - Country code
   * @returns Validation result with formatted number
   */
  validatePhoneNumber(phoneNumber: string, country?: string): PhoneValidationResult;
  
  /**
   * Validate email address format and deliverability
   * @param email - Email address to validate
   * @param checkDeliverability - Whether to check if email is deliverable
   * @returns Promise resolving to validation result
   */
  validateEmail(email: string, checkDeliverability?: boolean): Promise<EmailValidationResult>;
  
  // Emergency Contact Operations
  
  /**
   * Validate emergency contact information
   * @param contact - Emergency contact data
   * @param patientData - Related patient data for relationship validation
   * @returns Promise resolving to validation result
   */
  validateEmergencyContact(
    contact: EmergencyContact, 
    patientData: PatientData
  ): Promise<ContactValidationResult>;
  
  /**
   * Check if emergency contact relationship is appropriate
   * @param relationship - Relationship type
   * @param patientAge - Age of patient
   * @returns Whether relationship is appropriate
   */
  isValidEmergencyContactRelationship(relationship: string, patientAge: number): boolean;
  
  /**
   * Get recommended emergency contact relationships based on patient age
   * @param patientAge - Age of patient
   * @returns Array of recommended relationship types
   */
  getRecommendedEmergencyContactRelationships(patientAge: number): string[];
  
  // Name and Identity Operations
  
  /**
   * Validate name format and detect potential issues
   * @param firstName - First name
   * @param lastName - Last name
   * @param middleName - Middle name (optional)
   * @returns Validation result with suggestions
   */
  validateName(firstName: string, lastName: string, middleName?: string): NameValidationResult;
  
  /**
   * Standardize name format (proper case, remove extra spaces, etc.)
   * @param name - Name to standardize
   * @returns Standardized name
   */
  standardizeName(name: string): string;
  
  /**
   * Check for potential name format issues
   * @param name - Name to check
   * @returns Array of potential issues found
   */
  detectNameIssues(name: string): NameIssue[];
  
  // Demographics Business Rules
  
  /**
   * Apply business rules based on demographics
   * @param demographicsData - Complete demographics data
   * @returns Promise resolving to business rule results
   */
  applyBusinessRules(demographicsData: DemographicsData): Promise<BusinessRuleResult[]>;
  
  /**
   * Check if guardian consent is required
   * @param patientAge - Age of patient
   * @param jurisdiction - State/province
   * @returns Whether guardian consent is required
   */
  requiresGuardianConsent(patientAge: number, jurisdiction: string): boolean;
  
  /**
   * Get required documentation based on demographics
   * @param demographicsData - Patient demographics
   * @returns Array of required documentation types
   */
  getRequiredDocumentation(demographicsData: DemographicsData): DocumentationRequirement[];
  
  /**
   * Validate demographics against regulatory requirements
   * @param demographicsData - Demographics to validate
   * @param regulations - Applicable regulations
   * @returns Promise resolving to compliance validation
   */
  validateRegulatoryCompliance(
    demographicsData: DemographicsData, 
    regulations: string[]
  ): Promise<ComplianceValidationResult>;
  
  // Data Enrichment Operations
  
  /**
   * Enrich demographics data with additional information
   * @param basicData - Basic demographics data
   * @returns Promise resolving to enriched data
   */
  enrichDemographicsData(basicData: BasicDemographicsData): Promise<EnrichedDemographicsData>;
  
  /**
   * Detect and suggest corrections for common data entry errors
   * @param demographicsData - Demographics data to analyze
   * @returns Array of suggested corrections
   */
  suggestCorrections(demographicsData: DemographicsData): DataCorrection[];
  
  /**
   * Auto-complete address information
   * @param partialAddress - Partially entered address
   * @returns Promise resolving to address suggestions
   */
  autoCompleteAddress(partialAddress: Partial<Address>): Promise<Address[]>;
  
  // Privacy and Security Operations
  
  /**
   * Mask sensitive demographic information for display
   * @param demographicsData - Data to mask
   * @param maskingLevel - Level of masking to apply
   * @returns Masked demographics data
   */
  maskSensitiveData(
    demographicsData: DemographicsData, 
    maskingLevel: 'partial' | 'full'
  ): MaskedDemographicsData;
  
  /**
   * Validate data privacy compliance
   * @param demographicsData - Data to validate
   * @param privacyRegulations - Applicable privacy regulations
   * @returns Privacy compliance validation result
   */
  validatePrivacyCompliance(
    demographicsData: DemographicsData, 
    privacyRegulations: string[]
  ): PrivacyComplianceResult;
  
  // Cache and Performance Operations
  
  /**
   * Preload demographic validation data
   * @param zipCodes - ZIP codes to preload
   * @param states - States to preload
   * @returns Promise that resolves when preloading is complete
   */
  preloadValidationData(zipCodes: string[], states: string[]): Promise<void>;
  
  /**
   * Clear demographics validation cache
   * @param cacheType - Type of cache to clear (optional, clears all if not specified)
   */
  clearCache(cacheType?: 'zipCode' | 'age' | 'emergencyContact' | 'all'): void;
  
  /**
   * Get demographics validation performance metrics
   * @returns Current performance statistics
   */
  getPerformanceMetrics(): DemographicsPerformanceMetrics;
}

// Supporting Types

export interface State {
  /** State/province code */
  code: string;
  
  /** Full state/province name */
  name: string;
  
  /** Country this state belongs to */
  country: string;
  
  /** Age of majority in this state */
  ageOfMajority: number;
  
  /** Whether this state requires specific documentation */
  requiresSpecialDocumentation: boolean;
}

export interface ZipCodeInfo {
  /** ZIP/postal code */
  zipCode: string;
  
  /** Primary city name */
  city: string;
  
  /** State/province code */
  state: string;
  
  /** Country code */
  country: string;
  
  /** County name */
  county?: string;
  
  /** Time zone */
  timeZone?: string;
  
  /** Geographic coordinates */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  /** Whether this is a valid, deliverable ZIP code */
  isValid: boolean;
}

export interface AgeCalculation {
  /** Age in years */
  years: number;
  
  /** Age in months */
  months: number;
  
  /** Age in days */
  days: number;
  
  /** Whether patient is a minor */
  isMinor: boolean;
  
  /** Age of majority for patient's jurisdiction */
  ageOfMajority: number;
  
  /** Date calculation was performed */
  calculatedAt: Date;
}

export interface ContactValidationResult {
  /** Whether contact information is valid */
  isValid: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Validation warnings */
  warnings: string[];
  
  /** Suggested improvements */
  suggestions: string[];
  
  /** Whether relationship is appropriate */
  relationshipValid: boolean;
}

export interface DemographicsValidationState {
  /** Overall validation status */
  status: 'valid' | 'invalid' | 'validating' | 'partial';
  
  /** Fields currently being validated */
  validatingFields: string[];
  
  /** Fields with validation errors */
  invalidFields: string[];
  
  /** Last validation timestamp */
  lastValidated: Date;
  
  /** Validation summary */
  summary: {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    warningFields: number;
  };
}

export interface Address {
  /** Street address line 1 */
  street1: string;
  
  /** Street address line 2 (optional) */
  street2?: string;
  
  /** City */
  city: string;
  
  /** State/province */
  state: string;
  
  /** ZIP/postal code */
  zipCode: string;
  
  /** Country code */
  country?: string;
}

export interface AddressValidationResult {
  /** Whether address is valid */
  isValid: boolean;
  
  /** Standardized address */
  standardizedAddress?: Address;
  
  /** Validation errors */
  errors: string[];
  
  /** Validation warnings */
  warnings: string[];
  
  /** Whether address is deliverable */
  isDeliverable: boolean;
  
  /** Delivery point validation */
  deliveryPoint?: {
    isResidential: boolean;
    isBusiness: boolean;
    isVacant: boolean;
  };
}

export interface PhoneValidationResult {
  /** Whether phone number is valid */
  isValid: boolean;
  
  /** Formatted phone number */
  formattedNumber?: string;
  
  /** Phone number type */
  type?: 'mobile' | 'landline' | 'voip' | 'toll_free';
  
  /** Country of phone number */
  country?: string;
  
  /** Carrier information */
  carrier?: string;
  
  /** Validation errors */
  errors: string[];
}

export interface EmailValidationResult {
  /** Whether email format is valid */
  isValid: boolean;
  
  /** Whether email domain exists */
  domainExists: boolean;
  
  /** Whether email is deliverable */
  isDeliverable: boolean;
  
  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high';
  
  /** Validation errors */
  errors: string[];
  
  /** Suggestions for correction */
  suggestions: string[];
}

export interface EmergencyContact {
  /** Contact name */
  name: string;
  
  /** Relationship to patient */
  relationship: string;
  
  /** Phone number */
  phone: string;
  
  /** Email address (optional) */
  email?: string;
  
  /** Address (optional) */
  address?: Address;
}

export interface PatientData {
  /** Patient first name */
  firstName: string;
  
  /** Patient last name */
  lastName: string;
  
  /** Date of birth */
  dateOfBirth: Date;
  
  /** Age (calculated) */
  age: number;
  
  /** Gender */
  gender: string;
  
  /** Address */
  address: Address;
}

export interface NameValidationResult {
  /** Whether name is valid */
  isValid: boolean;
  
  /** Standardized first name */
  standardizedFirstName?: string;
  
  /** Standardized last name */
  standardizedLastName?: string;
  
  /** Detected issues */
  issues: NameIssue[];
  
  /** Suggestions */
  suggestions: string[];
}

export interface NameIssue {
  /** Type of issue */
  type: 'case_inconsistent' | 'contains_numbers' | 'contains_symbols' | 
        'too_short' | 'too_long' | 'potentially_offensive';
  
  /** Issue description */
  description: string;
  
  /** Suggested fix */
  suggestion: string;
  
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

export interface DemographicsData {
  /** Personal information */
  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: string;
  };
  
  /** Contact information */
  contact: {
    address: Address;
    phone: string;
    email?: string;
  };
  
  /** Emergency contact */
  emergencyContact: EmergencyContact;
  
  /** Additional demographic data */
  additional?: {
    ethnicity?: string;
    race?: string;
    language?: string;
    maritalStatus?: string;
  };
}

export interface BasicDemographicsData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  zipCode: string;
}

export interface EnrichedDemographicsData extends DemographicsData {
  /** Enriched location data */
  locationData: {
    timeZone: string;
    county: string;
    coordinates: { latitude: number; longitude: number };
  };
  
  /** Age calculations */
  ageData: AgeCalculation;
  
  /** Regulatory compliance status */
  complianceStatus: ComplianceValidationResult;
}

export interface BusinessRuleResult {
  /** Rule identifier */
  ruleId: string;
  
  /** Rule description */
  description: string;
  
  /** Whether rule passed */
  passed: boolean;
  
  /** Result details */
  details: string;
  
  /** Required actions if rule failed */
  requiredActions?: string[];
}

export interface DocumentationRequirement {
  /** Type of documentation required */
  type: 'guardian_consent' | 'photo_id' | 'proof_of_address' | 
        'insurance_card' | 'birth_certificate';
  
  /** Reason for requirement */
  reason: string;
  
  /** Whether requirement is mandatory */
  mandatory: boolean;
  
  /** Acceptable alternatives */
  alternatives?: string[];
}

export interface ComplianceValidationResult {
  /** Whether data is compliant */
  isCompliant: boolean;
  
  /** Compliance violations */
  violations: ComplianceViolation[];
  
  /** Compliance warnings */
  warnings: ComplianceWarning[];
  
  /** Required remediation actions */
  remediationActions: string[];
}

export interface ComplianceViolation {
  /** Regulation that was violated */
  regulation: string;
  
  /** Description of violation */
  description: string;
  
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  /** Required fix */
  requiredFix: string;
}

export interface ComplianceWarning {
  /** Regulation with potential issue */
  regulation: string;
  
  /** Warning description */
  description: string;
  
  /** Recommended action */
  recommendedAction: string;
}

export interface DataCorrection {
  /** Field that needs correction */
  field: string;
  
  /** Current value */
  currentValue: any;
  
  /** Suggested value */
  suggestedValue: any;
  
  /** Reason for suggestion */
  reason: string;
  
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
}

export interface MaskedDemographicsData {
  /** Masked personal information */
  personal: {
    firstName: string; // May be partially masked
    lastName: string;  // May be partially masked
    dateOfBirth: string; // May show only year
    gender: string;
  };
  
  /** Masked contact information */
  contact: {
    address: Partial<Address>; // May mask specific details
    phone: string; // May mask digits
    email?: string; // May mask parts
  };
  
  /** Masking metadata */
  maskingInfo: {
    level: 'partial' | 'full';
    maskedFields: string[];
    timestamp: Date;
  };
}

export interface PrivacyComplianceResult {
  /** Whether data handling is privacy compliant */
  isCompliant: boolean;
  
  /** Privacy violations */
  violations: PrivacyViolation[];
  
  /** Required privacy actions */
  requiredActions: PrivacyAction[];
  
  /** Privacy warnings */
  warnings: PrivacyWarning[];
}

export interface PrivacyViolation {
  /** Privacy regulation violated */
  regulation: 'HIPAA' | 'GDPR' | 'CCPA' | 'PIPEDA';
  
  /** Violation description */
  description: string;
  
  /** Data fields involved */
  affectedFields: string[];
  
  /** Required remediation */
  remediation: string;
}

export interface PrivacyAction {
  /** Action type */
  type: 'obtain_consent' | 'implement_safeguards' | 'provide_notice' | 'enable_deletion';
  
  /** Action description */
  description: string;
  
  /** Deadline for action */
  deadline?: Date;
}

export interface PrivacyWarning {
  /** Warning message */
  message: string;
  
  /** Affected data fields */
  affectedFields: string[];
  
  /** Recommended action */
  recommendedAction: string;
}

export interface DemographicsPerformanceMetrics {
  /** Average address validation time */
  avgAddressValidationMs: number;
  
  /** ZIP code lookup cache hit rate */
  zipCodeCacheHitRate: number;
  
  /** Age calculation cache hit rate */
  ageCalculationCacheHitRate: number;
  
  /** Total demographics validations performed */
  totalValidations: number;
  
  /** Successful validation rate */
  successRate: number;
  
  /** Average validation time */
  avgValidationTimeMs: number;
}