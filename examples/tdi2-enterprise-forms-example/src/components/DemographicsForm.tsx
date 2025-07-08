
import type { Inject } from '@tdi2/di-core/markers';
import type { PatientDemographicsServiceInterface } from '../services/PatientDemographicsServiceInterface';
import type { ValidationResult } from '../types/ValidationTypes';

interface DemographicsFormProps {
  data: any;
  onChange: (fieldPath: string, value: any) => void;
  validationResult?: ValidationResult;
  demographicsService?: Inject<PatientDemographicsServiceInterface>;
}

export function DemographicsForm({
  data,
  onChange,
  validationResult,
  demographicsService
}: DemographicsFormProps) {
  
  // Service provides field validation and formatting
  const supportedStates = demographicsService?.getSupportedStates() ?? [];
  const ageCalculation = demographicsService?.calculateAge(data.dateOfBirth);
  const isMinor = ageCalculation && ageCalculation.isMinor;

  const handleInputChange = (field: string, value: any) => {
    onChange(field, value);
    
    // Service handles side effects (like updating dependent fields)
    if (field === 'dateOfBirth') {
      demographicsService?.updateAgeBasedFields(value);
    }
    
    if (field === 'zipCode') {
      demographicsService?.lookupCityState(value);
    }
  };

  const getFieldError = (fieldName: string) => {
    return validationResult?.fieldErrors?.[fieldName];
  };

  return (
    <div className="demographics-form">
      <div className="form-section">
        <h3>Personal Information</h3>
        
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="firstName">First Name *</label>
            <input
              id="firstName"
              type="text"
              value={data.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={getFieldError('firstName') ? 'error' : ''}
              maxLength={50}
            />
            {getFieldError('firstName') && (
              <span className="field-error">{getFieldError('firstName')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="lastName">Last Name *</label>
            <input
              id="lastName"
              type="text"
              value={data.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={getFieldError('lastName') ? 'error' : ''}
              maxLength={50}
            />
            {getFieldError('lastName') && (
              <span className="field-error">{getFieldError('lastName')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input
              id="dateOfBirth"
              type="date"
              value={data.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className={getFieldError('dateOfBirth') ? 'error' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {ageCalculation && (
              <span className="field-hint">Age: {ageCalculation} years</span>
            )}
            {getFieldError('dateOfBirth') && (
              <span className="field-error">{getFieldError('dateOfBirth')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="gender">Gender *</label>
            <select
              id="gender"
              value={data.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={getFieldError('gender') ? 'error' : ''}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            {getFieldError('gender') && (
              <span className="field-error">{getFieldError('gender')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Contact Information</h3>
        
        <div className="form-grid">
          <div className="form-field full-width">
            <label htmlFor="address">Street Address *</label>
            <input
              id="address"
              type="text"
              value={data.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={getFieldError('address') ? 'error' : ''}
              placeholder="123 Main Street"
            />
            {getFieldError('address') && (
              <span className="field-error">{getFieldError('address')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="city">City *</label>
            <input
              id="city"
              type="text"
              value={data.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={getFieldError('city') ? 'error' : ''}
            />
            {getFieldError('city') && (
              <span className="field-error">{getFieldError('city')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="state">State *</label>
            <select
              id="state"
              value={data.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={getFieldError('state') ? 'error' : ''}
            >
              <option value="">Select State</option>
              {supportedStates.map(state => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
            {getFieldError('state') && (
              <span className="field-error">{getFieldError('state')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="zipCode">ZIP Code *</label>
            <input
              id="zipCode"
              type="text"
              value={data.zipCode || ''}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              className={getFieldError('zipCode') ? 'error' : ''}
              pattern="[0-9]{5}(-[0-9]{4})?"
              placeholder="12345"
            />
            {getFieldError('zipCode') && (
              <span className="field-error">{getFieldError('zipCode')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              value={data.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={getFieldError('phone') ? 'error' : ''}
              placeholder="(555) 123-4567"
            />
            {getFieldError('phone') && (
              <span className="field-error">{getFieldError('phone')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={data.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={getFieldError('email') ? 'error' : ''}
              placeholder="patient@example.com"
            />
            {getFieldError('email') && (
              <span className="field-error">{getFieldError('email')}</span>
            )}
          </div>
        </div>
      </div>

      {isMinor && (
        <div className="form-section minor-notice">
          <div className="notice-box warning">
            <h4>⚠️ Minor Patient Detected</h4>
            <p>
              Since the patient is under 18, guardian consent and additional 
              documentation will be required. These sections will be automatically 
              unlocked after completing this form.
            </p>
          </div>
        </div>
      )}

      <div className="form-section">
        <h3>Emergency Contact</h3>
        <p className="section-note">
          Primary emergency contact (additional contacts can be added later)
        </p>
        
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="emergencyName">Contact Name *</label>
            <input
              id="emergencyName"
              type="text"
              value={data.emergencyContact?.name || ''}
              onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
              className={getFieldError('emergencyContact.name') ? 'error' : ''}
            />
            {getFieldError('emergencyContact.name') && (
              <span className="field-error">{getFieldError('emergencyContact.name')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="emergencyRelation">Relationship *</label>
            <select
              id="emergencyRelation"
              value={data.emergencyContact?.relationship || ''}
              onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
              className={getFieldError('emergencyContact.relationship') ? 'error' : ''}
            >
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
            {getFieldError('emergencyContact.relationship') && (
              <span className="field-error">{getFieldError('emergencyContact.relationship')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="emergencyPhone">Phone Number *</label>
            <input
              id="emergencyPhone"
              type="tel"
              value={data.emergencyContact?.phone || ''}
              onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
              className={getFieldError('emergencyContact.phone') ? 'error' : ''}
              placeholder="(555) 123-4567"
            />
            {getFieldError('emergencyContact.phone') && (
              <span className="field-error">{getFieldError('emergencyContact.phone')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}