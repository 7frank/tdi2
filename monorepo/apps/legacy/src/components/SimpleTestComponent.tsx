// src/components/SimpleTestComponent.tsx - Minimal test for functional DI

import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { ExampleApiInterface } from "../services/ExampleApiInterface";

// Simple test component with minimal marker interface
export function SimpleTest(props: {
  message: string;
  services: {
    api: Inject<ExampleApiInterface>;
  };
}) {
  const { message, services } = props;

  React.useEffect(() => {
    services.api.getData().then((data) => {
      console.log("Simple test data:", data);
    });
  }, []);

  return <div>Simple Test: {message}</div>;
}
