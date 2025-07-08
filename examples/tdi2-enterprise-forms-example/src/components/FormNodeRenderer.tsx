import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { FormStateServiceInterface } from '../services/FormStateService';
import type { ValidationOrchestratorServiceInterface } from '../services/ValidationOrchestratorService';
import type { ValidationResult } from '../types/ValidationTypes';
import { DemographicsForm } from './nodes/DemographicsForm';
import { InsuranceForm } from './nodes/InsuranceForm';
import { MedicalHistoryForm } from './nodes/MedicalHistoryForm';
import { EmergencyContactsForm } from './nodes/EmergencyContactsForm';
import { ConsentFormsSection } from './nodes/ConsentFormsSection';
import { ValidationDisplay } from './ValidationDisplay';

interface FormNodeRendererProps {
  nodeId: string;
  data: any;
  validationResult?: ValidationResult;
  onComplete: () => void;
  stateService?: Inject<FormStateServiceInterface>;
  validationService?: Inject<ValidationOrchestratorServiceInterface>;
}

export function FormNodeRenderer({
  nodeId,
  data,
  validationResult,
  onComplete,
  stateService,
  validationService
}: FormNodeRendererProps) {
  
  const handleDataChange = (fieldPath: string, value: any) => {
    stateService?.updateNodeData(nodeId, { [fieldPath]: value });
    
    // Trigger reactive validation
    validationService?.queueValidation(nodeId, {
      ...data,
      [fieldPath]: value
    });
  };

  const isValid = validationResult?.isValid ?? false;
  const isLoading = validationResult?.isLoading ?? false;

  // Dynamic node content based on nodeId
  const renderNodeContent = () => {
    switch (nodeId) {
      case 'demographics':
        return (
          <DemographicsForm
            data={data}
            onChange={handleDataChange}
            validationResult={validationResult}
          />
        );
      
      case 'insurance_primary':
      case 'guardian_insurance':
        return (
          <InsuranceForm
            type={nodeId === 'guardian_insurance' ? 'guardian' : 'primary'}
            data={data}
            onChange={handleDataChange}
            validationResult={validationResult}
          />
        );
      
      case 'medical_history':
        return (
          <MedicalHistoryForm
            data={data}
            onChange={handleDataChange}
            validationResult={validationResult}
          />
        );
      
      case 'emergency_contacts':
        return (
          <EmergencyContactsForm
            data={data}
            onChange={handleDataChange}
            validationResult={validationResult}
          />
        );
      
      case 'hipaa_consent':
      case 'financial_responsibility':
        return (
          <ConsentFormsSection
            type={nodeId}
            data={data}
            onChange={handleDataChange}
            validationResult={validationResult}
          />
        );
      
      default:
        return (
          <div className="unknown-node">
            <h3>Unknown Form Section: {nodeId}</h3>
            <p>This form section is not yet implemented.</p>
          </div>
        );
    }
  };

  return (
    <div className={`form-node form-node--${nodeId}`}>
      <div className="node-header">
        <h2>{nodeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
        
        {isLoading && (
          <div className="validation-status loading">
            <span className="spinner">⚪</span>
            Validating...
          </div>
        )}
        
        {!isLoading && validationResult && (
          <div className={`validation-status ${isValid ? 'valid' : 'invalid'}`}>
            {isValid ? '✅ Valid' : '❌ Needs Attention'}
          </div>
        )}
      </div>

      <div className="node-content">
        {renderNodeContent()}
      </div>

      {validationResult && !validationResult.isValid && (
        <ValidationDisplay
          errors={validationResult.errors}
          warnings={validationResult.warnings}
        />
      )}

      <div className="node-actions">
        <button
          onClick={onComplete}
          disabled={!isValid || isLoading}
          className={`complete-button ${isValid ? 'enabled' : 'disabled'}`}
        >
          {isLoading ? 'Validating...' : isValid ? 'Mark Complete' : 'Fix Errors First'}
        </button>
      </div>
    </div>
  );
}