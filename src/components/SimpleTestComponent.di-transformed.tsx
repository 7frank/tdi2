// src/components/SimpleTestComponent.tsx - Minimal test for functional DI

import React from 'react';
import type { Inject } from '../di/markers';
import type { ExampleApiInterface } from '../services/ExampleApiInterface';
import { useService, useOptionalService } from "../di/context";

// Simple test component with minimal marker interface
function SimpleTest(props: { 
  message: string;
}): JSX.Element {
    const api = useService('EXAMPLE_API_TOKEN');
    const services = { api };
  const { message } = props;

  React.useEffect(() => {
    services.api.getData().then(data => {
      console.log('Simple test data:', data);
    });
  }, []);

  return <div>Simple Test: {message}</div>;
}

export { SimpleTest };