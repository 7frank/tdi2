import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { CounterServiceInterface, LoggerServiceInterface } from './types/interfaces';

interface AppProps {
  services: {
    counterService: Inject<CounterServiceInterface>;
    loggerService: Inject<LoggerServiceInterface>;
  };
}

export function App(props: AppProps) {
  const {
    services: { counterService, loggerService },
  } = props;

  const { count, message } = counterService.state;
  const { logs } = loggerService.state;

  const handleIncrement = () => {
    counterService.increment();
    loggerService.log('Incremented counter');
  };

  const handleDecrement = () => {
    counterService.decrement();
    loggerService.log('Decremented counter');
  };

  const handleReset = () => {
    counterService.reset();
    loggerService.log('Reset counter');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Hello World</h1>

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Counter: {count}</h2>
        <p data-testid="counter-message">{message}</p>

        <div style={{ marginTop: '10px' }}>
          <button
            data-testid="increment-btn"
            onClick={handleIncrement}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Increment
          </button>
          <button
            data-testid="decrement-btn"
            onClick={handleDecrement}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Decrement
          </button>
          <button
            data-testid="reset-btn"
            onClick={handleReset}
            style={{ padding: '8px 16px' }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h3>Logger</h3>
        <div data-testid="logs">
          {logs.length === 0 ? (
            <p>No logs yet</p>
          ) : (
            <ul>
              {logs.map((log, index) => (
                <li key={index}>{log}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          data-testid="clear-logs-btn"
          onClick={() => loggerService.clear()}
          style={{ marginTop: '10px', padding: '8px 16px' }}
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
