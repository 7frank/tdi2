// Auto-generated transformation snapshot for ComplexGenerics
// Generated: 2025-08-23T23:14:14.689Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { CacheInterface, RepositoryInterface, LoggerInterface } from './shared-types';

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
  const { services } = props;
  
  React.useEffect(() => {
    services.repository.findAll().then(users => {
      const userMap = new Map(users.map(u => [u.userId, u.profile]));
      services.cache.set('users', userMap);
      services.logger?.log(`Cached ${users.length} users`);
    });
  }, []);
  
  return <div>Complex generics component</div>;
}
