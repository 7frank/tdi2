import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export interface ImportedComponentProps {
  data: any[];
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}
