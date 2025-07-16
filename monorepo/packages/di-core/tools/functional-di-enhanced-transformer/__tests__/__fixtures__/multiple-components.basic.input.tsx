import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface, CacheInterface } from './shared-types';

export function FirstComponent(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  return <div>First: {props.services.api.getData()}</div>;
}

export const SecondComponent = (props: {
  services: {
    logger: Inject<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}) => {
  const { services } = props;
  return <div>Second component</div>;
};

// This should be ignored (no DI markers)
export function ThirdComponent(props: { message: string }) {
  return <div>{props.message}</div>;
}
