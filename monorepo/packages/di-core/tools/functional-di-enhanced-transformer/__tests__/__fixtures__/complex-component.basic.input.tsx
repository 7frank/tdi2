import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import {
  ApiInterface,
  LoggerInterface,
  CacheInterface,
  UserServiceInterface,
} from "./shared-types";

export function ComplexComponent(props: {
  userId: string;

  services: {
    api: Inject<ApiInterface>;
    logger: Inject<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
    user?: InjectOptional<UserServiceInterface>;
  };
}) {
  const { userId, services } = props;

  React.useEffect(() => {
    services.api.getUserData(userId).then((data) => {
      services.cache?.set(`user-${userId}`, data);
      services.user?.updateProfile(data);

      services.logger.log(`Debug: Loaded user data for ${userId}`);
    });
  }, [userId]);

  return <p>User: {userId}</p>;
}
