import React from 'react';

export function EmptyServices(props: {
  title: string;
  services: {};
}) {
  return <div>{props.title}</div>;
}
