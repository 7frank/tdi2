import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { LoggerInterface } from './LoggerService';

/**
 * Logger component - Package A
 * Simple component that displays logs
 */
export function Logger(props: {
  services: {
    logger: Inject<LoggerInterface>;
  };
}) {
  const { logger } = props.services;

  return (
    <div data-testid="logger">
      <h3>Logs</h3>
      <ul data-testid="log-list">
        {logger.state.logs.map((log, idx) => (
          <li key={idx} data-testid={`log-${idx}`}>
            {log}
          </li>
        ))}
      </ul>
    </div>
  );
}
