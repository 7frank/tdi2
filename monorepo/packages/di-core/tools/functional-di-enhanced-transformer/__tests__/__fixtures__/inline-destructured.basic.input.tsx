import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface } from "./shared-types";


export function InlineDestructuredWorking(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  const { services } = props;
  return <div>Mixed dependencies component</div>;
}

export function InlineDestructuredFailingA({
  services,
}: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  return <div>Mixed dependencies component</div>;
}

export function InlineDestructuredFailingB({ api }: { api: Inject<ApiInterface> }) {
  return <div>Mixed dependencies component</div>;
}
