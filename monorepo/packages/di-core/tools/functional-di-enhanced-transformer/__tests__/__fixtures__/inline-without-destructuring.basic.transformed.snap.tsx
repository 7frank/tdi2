// Auto-generated transformation snapshot for InlineWithoutDestructuring
// Generated: 2025-07-16T10:38:48.981Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineWithoutDestructuring(props: {
  title: string;
  services: {
    api: Inject<ApiInterface>;
    user?: InjectOptional<UserServiceInterface>;
  };
}) {
                const api = useService('ApiInterface') as unknown as ApiInterface;
                const user = undefined; // Optional dependency not found
                const services = { api, user };
  React.useEffect(() => {
    props.services.api.getData().then(data => {
      props.services.user?.updateProfile(data);
    });
  }, []);

  return <div>Title: {props.title}</div>;
}
