import React, { useEffect } from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { InsuranceValidationServiceInterface } from '../services/InsuranceValidationService';
import type { ValidationResult } from '../types/ValidationTypes';

interface InsuranceFormProps {
  type: 'primary' | 'guardian';
  data: any;
  onChange: (fieldPath: string, value: any) => void;
  validationResult?: ValidationResult;
  insuranceService?: Inject<InsuranceValidationServiceInterface>;
}

export function InsuranceForm({
  type,
  data,
  onChange,
  validationResult,
  insuranceService
}: InsuranceFormProps) {
  
  // Service provides real-time insurance data
  const eligibilityStatus = insuranceService?.state.eligibilityResults.get(data.memberId);
  const supportedProviders = insuranceService?.state.supportedProviders ?? [];
  const isValidating = insuranceService?.state.activeValidations.has(data.memberId) ?? false;

  // Trigger eligibility check when member ID changes
  useEffect(() => {
    if (data.memberId && data.providerId && data.memberId.length >= 8) {
      insuranceService?.validateEligibility(data.memberId, data.providerId);
    }
  }, [data.memberId, data.providerId, insuranceService]);

  const handleInputChange = (field: string, value: any) => {
    onChange(field, value);
    
    // Service handles provider-specific formatting
    if (field === 'memberId') {
      const formatted = insuranceService?.formatMemberId(value, data.providerId);
      if (formatted && formatted !== value) {
        onChange(field, formatted);
      }
    }
  };

  const getFieldError = (fieldName: string) => {
    return validationResult?.fieldErrors?.[fieldName];
  };

  const renderEligibilityStatus = () => {
    if (isValidating) {
      return (
        <div className="eligibility-status validating">
          <span className="spinner">⚪</span>
          Checking eligibility...
        </div>
      );
    }

    if (eligibilityStatus) {
      return (
        <div className={`eligibility-status ${eligibilityStatus.isEligible ? 'eligible' : 'not-eligible'}`}>
          {eligibilityStatus.isEligible ? (
            <>
              <span className="status-icon">✅</span>
              <div className="status-details">
                <strong>Insurance Verified</strong>
                <p>Coverage active through {eligibilityStatus.coverageEndDate}</p>
                <p>Copay: ${eligibilityStatus.copayAmount}</p>
                <p>Deductible remaining: ${eligibilityStatus.deductibleRemaining}</p>
              </div>
            </>
          ) : (
            <>
              <span className="status-icon">❌</span>
              <div className="status-details">
                <strong>Coverage Issue</strong>
                <p>{eligibilityStatus.reason}</p>
                {eligibilityStatus.nextSteps && (
                  <p><strong>Next steps:</strong> {eligibilityStatus.nextSteps}</p>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="insurance-form">
      <div className="form-section">
        <h3>
          {type === 'guardian' ? 'Guardian Insurance Information' : 'Primary Insurance Information'}
        </h3>
        
        {type === 'guardian' && (
          <div className="notice-box info">
            <p>Since the patient is a minor, guardian insurance information is required.</p>
          </div>
        )}

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="providerId">Insurance Provider *</label>
            <select
              id="providerId"
              value={data.providerId || ''}
              onChange={(e) => handleInputChange('providerId', e.target.value)}
              className={getFieldError('providerId') ? 'error' : ''}
            >
              <option value="">Select Provider</option>
              {supportedProviders.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            {getFieldError('providerId') && (
              <span className="field-error">{getFieldError('providerId')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="planType">Plan Type *</label>
            <select
              id="planType"
              value={data.planType || ''}
              onChange={(e) => handleInputChange('planType', e.target.value)}
              className={getFieldError('planType') ? 'error' : ''}
            >
              <option value="">Select Plan Type</option>
              <option value="hmo">HMO</option>
              <option value="ppo">PPO</option>
              <option value="pos">POS</option>
              <option value="epo">EPO</option>
              <option value="hdhp">High Deductible Health Plan</option>
              <option value="medicaid">Medicaid</option>
              <option value="medicare">Medicare</option>
            </select>
            {getFieldError('planType') && (
              <span className="field-error">{getFieldError('planType')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="memberId">Member ID *</label>
            <input
              id="memberId"
              type="text"
              value={data.memberId || ''}
              onChange={(e) => handleInputChange('memberId', e.target.value)}
              className={getFieldError('memberId') ? 'error' : ''}
              placeholder="Enter member ID"
            />
            {getFieldError('memberId') && (
              <span className="field-error">{getFieldError('memberId')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="groupNumber">Group Number</label>
            <input
              id="groupNumber"
              type="text"
              value={data.groupNumber || ''}
              onChange={(e) => handleInputChange('groupNumber', e.target.value)}
              className={getFieldError('groupNumber') ? 'error' : ''}
              placeholder="Enter group number"
            />
            {getFieldError('groupNumber') && (
              <span className="field-error">{getFieldError('groupNumber')}</span>
            )}
          </div>
        </div>

        {renderEligibilityStatus()}
      </div>

      <div className="form-section">
        <h3>
          {type === 'guardian' ? 'Guardian Information' : 'Policyholder Information'}
        </h3>
        
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="policyholderName">
              {type === 'guardian' ? 'Guardian Name' : 'Policyholder Name'} *
            </label>
            <input
              id="policyholderName"
              type="text"
              value={data.policyholderName || ''}
              onChange={(e) => handleInputChange('policyholderName', e.target.value)}
              className={getFieldError('policyholderName') ? 'error' : ''}
            />
            {getFieldError('policyholderName') && (
              <span className="field-error">{getFieldError('policyholderName')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="policyholderDob">Date of Birth *</label>
            <input
              id="policyholderDob"
              type="date"
              value={data.policyholderDob || ''}
              onChange={(e) => handleInputChange('policyholderDob', e.target.value)}
              className={getFieldError('policyholderDob') ? 'error' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {getFieldError('policyholderDob') && (
              <span className="field-error">{getFieldError('policyholderDob')}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="relationshipToPatient">Relationship to Patient *</label>
            <select
              id="relationshipToPatient"
              value={data.relationshipToPatient || ''}
              onChange={(e) => handleInputChange('relationshipToPatient', e.target.value)}
              className={getFieldError('relationshipToPatient') ? 'error' : ''}
            >
              <option value="">Select Relationship</option>
              <option value="self">Self</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="guardian">Legal Guardian</option>
              <option value="other">Other</option>
            </select>
            {getFieldError('relationshipToPatient') && (
              <span className="field-error">{getFieldError('relationshipToPatient')}</span>
            )}
          </div>
        </div>
      </div>

      {type === 'guardian' && (
        <div className="form-section">
          <h3>Guardian Contact Information</h3>
          
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="guardianPhone">Phone Number *</label>
              <input
                id="guardianPhone"
                type="tel"
                value={data.guardianPhone || ''}
                onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                className={getFieldError('guardianPhone') ? 'error' : ''}
                placeholder="(555) 123-4567"
              />
              {getFieldError('guardianPhone') && (
                <span className="field-error">{getFieldError('guardianPhone')}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="guardianEmail">Email Address</label>
              <input
                id="guardianEmail"
                type="email"
                value={data.guardianEmail || ''}
                onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
                className={getFieldError('guardianEmail') ? 'error' : ''}
                placeholder="guardian@example.com"
              />
              {getFieldError('guardianEmail') && (
                <span className="field-error">{getFieldError('guardianEmail')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {eligibilityStatus?.requiresPriorAuth && (
        <div className="form-section">
          <div className="notice-box warning">
            <h4>⚠️ Prior Authorization Required</h4>
            <p>
              This insurance plan requires prior authorization for certain procedures. 
              A prior authorization section will be unlocked after completing this form.
            </p>
            <ul>
              {eligibilityStatus.priorAuthProcedures?.map((procedure, index) => (
                <li key={index}>{procedure}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}