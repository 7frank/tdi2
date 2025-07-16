// Auto-generated transformation snapshot for InlineValueProps
// Generated: 2025-07-16T16:45:59.703Z
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, TestStateInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineValueProps(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineValueFoo(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructuredNested(props: {
      services: {
        api: Inject<ApiInterface>;
      };
    }) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructured(props: { api: Inject<ApiInterface> }) {
    const api = props.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

/**
 * 
 *  FIXME no proper service state handling

 */
export function InlineDestProps(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  const {
    services: { api },
  } = props;
  return <div>{api.getData()}Mixed dependencies component</div>;
}

/**
 * 
 *  FIXME no proper service state handling

 */
export function InlineDestructured2ndApi(props: {
      services: {
        api: Inject<ApiInterface>;

        state: TestStateInterface;
      };
    }) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{services.state.value}Mixed dependencies component</div>;
}
