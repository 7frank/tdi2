// Auto-generated transformation snapshot for InlineWithoutDestructuring
// Generated: 2025-08-17T08:05:54.254Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, UserServiceInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineWithoutDestructuring(props: {
  title: string;
  services: {
    api: Inject<ApiInterface>;
    user?: InjectOptional<UserServiceInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const user = props.services?.user ?? (useOptionalService('UserServiceInterface') as unknown as UserServiceInterface);
  React.useEffect(() => {
    props.services.api.getData().then(data => {
      props.services.user?.updateProfile(data);
    });
  }, []);

  return <div>Title: {props.title}</div>;
}
