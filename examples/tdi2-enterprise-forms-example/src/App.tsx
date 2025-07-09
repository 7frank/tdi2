import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "./services/FormDAGService";
import type { DemographicsFormServiceInterface } from "./services/DemographicsFormService";
import type { InsuranceFormServiceInterface } from "./services/InsuranceFormService";
import { HealthcareFormContainer } from "./components/HealthcareFormContainer";

interface AppProps {
  services: {
    formDAG: Inject<FormDAGServiceInterface>;
    demographicsForm: Inject<DemographicsFormServiceInterface>;
    insuranceForm: Inject<InsuranceFormServiceInterface>;
  };
}

export default function App(props: AppProps) {
  const { services } = props;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 0'
    }}>
      <HealthcareFormContainer services={services} />
      
      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px'
      }}>
        <p>
          🚀 <strong>TDI2 Enterprise Forms Demo</strong> - 
          Showcasing React Service Injection with complex DAG navigation
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
          Architecture: DAG Navigation • RxJS Streams • JSON Schema Validation • Service Boundaries
        </p>
      </footer>
    </div>
  );
}