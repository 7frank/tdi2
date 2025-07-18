// Auto-generated transformation snapshot for InlineWithoutDestructuring
// Generated: 2025-07-18T10:23:48.160Z
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
    const api = props.services?.api; if (!api) {throw new Error("Could not find implementation for 'ApiInterface'");}
    const user = props.services?.user; if (!user) {throw new Error("Could not find implementation for 'UserServiceInterface'");}
  React.useEffect(() => {
    props.services.api.getData().then(data => {
      props.services.user?.updateProfile(data);
    });
  }, []);

  return <div>Title: {props.title}</div>;
}
