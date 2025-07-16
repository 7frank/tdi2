import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export interface SeparateComponentProps {
  userId: string;
  services: {
    api: Inject<ApiInterface>;
    logger: Inject<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}

export interface SimpleComponentProps {
  title: string;
  services: {
    api: Inject<ApiInterface>;
  };
}
