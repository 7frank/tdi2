// Auto-generated transformation snapshot for ComplexGenerics
// Generated: 2025-07-16T10:05:57.656Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
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
                const cache = useService('CacheInterface_Map_string_UserData') as unknown as CacheInterface<Map<string, UserData>>;
                const repository = useService('RepositoryInterface_UserEntity') as unknown as RepositoryInterface<UserEntity>;
                const logger = undefined; // Optional dependency not found
                const services = { cache, repository, logger };
  React.useEffect(() => {
    services.repository.findAll().then(users => {
      const userMap = new Map(users.map(u => [u.userId, u.profile]));
      services.cache.set('users', userMap);
      services.logger?.log(`Cached ${users.length} users`);
    });
  }, []);
  
  return <div>Complex generics component</div>;
}
