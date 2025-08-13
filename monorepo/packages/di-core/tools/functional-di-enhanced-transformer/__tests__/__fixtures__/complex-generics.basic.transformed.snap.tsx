// Auto-generated transformation snapshot for ComplexGenerics
// Generated: 2025-07-18T10:23:49.384Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { CacheInterface, RepositoryInterface, LoggerInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

interface UserData {
  id: string;
  name: string;
}

interface UserEntity {
  userId: string;
  profile: UserData;
}

export function ComplexGenerics(props: {
  services: {
    cache: Inject<CacheInterface<Map<string, UserData>>>;
    repository: Inject<RepositoryInterface<UserEntity>>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
    const cache = props.services?.cache; if (!cache) {throw new Error("Could not find implementation for 'CacheInterface<Map<string, UserData>>'");}
    const repository = props.services?.repository; if (!repository) {throw new Error("Could not find implementation for 'RepositoryInterface<UserEntity>'");}
    const logger = props.services?.logger; if (!logger) {throw new Error("Could not find implementation for 'LoggerInterface'");}
  React.useEffect(() => {
    repository.findAll().then(users => {
      const userMap = new Map(users.map(u => [u.userId, u.profile]));
      cache.set('users', userMap);
      logger.log(`Cached ${users.length} users`);
    });
  }, []);
  
  return <div>Complex generics component</div>;
}
