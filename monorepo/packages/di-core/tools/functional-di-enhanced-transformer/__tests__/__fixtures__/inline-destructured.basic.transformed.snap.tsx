// Auto-generated transformation snapshot for InlineValueProps
// Generated: 2025-07-16T18:25:33.330Z
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, TestStateInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineValueProps(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineValueFoo(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructuredNested(props: {
      services: {
        api: Inject<ApiInterface>;
      };
    }) {
    const api = props.services.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructured(props: { api: Inject<ApiInterface> }) {
    const api = props.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestProps(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

/**
 *
 *    FIXME no injected useService hook
 */
export function InlineDestructured2ndApi({
  services,
}: {
  services: {
    api: Inject<ApiInterface>;

    state: TestStateInterface;
  };
}) {
  return <div>{services.state.value}Mixed dependencies component</div>;
}
