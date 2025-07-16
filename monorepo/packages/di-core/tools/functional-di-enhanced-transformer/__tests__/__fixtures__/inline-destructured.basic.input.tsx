import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface } from "./shared-types";

export function InlineDestructuredA({
  services,
}: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  return <div>Mixed dependencies component</div>;
}

export function InlineDestructuredB({ api }: { api: Inject<ApiInterface> }) {
  return <div>Mixed dependencies component</div>;
}
