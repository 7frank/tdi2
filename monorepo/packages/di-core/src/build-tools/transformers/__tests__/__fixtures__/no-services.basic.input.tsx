import React from 'react';

export function NoServices(props: {
  message: string;
  count: number;
}) {
  return (
    <div>
      <p>{props.message}</p>
      <span>Count: {props.count}</span>
    </div>
  );
}
