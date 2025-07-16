// Auto-generated transformation snapshot for InlineDestructuredWorking
// Generated: 2025-07-16T09:59:52.260Z
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineDestructuredWorking(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
                const api = useService('ApiInterface'); // Warning: implementation not found
                const services = { api };
  return <div>{services.api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructuredFailingA({
  services,
}: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
                const api = useService('ApiInterface'); // Warning: implementation not found
                const services = { api };
  return <div>{services.api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructuredFailingB({
  api,
}: {
  api: Inject<ApiInterface>;
}) {
                const api = useService('ApiInterface'); // Warning: implementation not found
                const services = { api };
  return <div>{api.getData()}Mixed dependencies component</div>;
}
