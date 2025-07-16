import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, UserServiceInterface } from './shared-types';

export function InlineWithoutDestructuring(props: {
  title: string;
  services: {
    api: Inject<ApiInterface>;
    user?: InjectOptional<UserServiceInterface>;
  };
}) {
  React.useEffect(() => {
    props.services.api.getData().then(data => {
      props.services.user?.updateProfile(data);
    });
  }, []);

  return <div>Title: {props.title}</div>;
}
