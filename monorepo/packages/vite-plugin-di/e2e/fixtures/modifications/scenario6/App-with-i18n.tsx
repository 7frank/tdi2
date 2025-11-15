import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { CounterServiceInterface } from './types/interfaces';
import type { I18nServiceInterface } from './services/I18nService';

interface AppProps {
  services: {
    counterService: Inject<CounterServiceInterface>;
    i18n: Inject<I18nServiceInterface>;
  };
}

export function App(props: AppProps) {
  const {
    services: { counterService, i18n },
  } = props;

  const { count, message } = counterService.state;
  const i18nMessage = i18n.t('message');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Hello World</h1>
      <p data-testid="i18n-message">{i18nMessage}</p>

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Counter: {count}</h2>
        <p data-testid="counter-message">{message}</p>

        <div style={{ marginTop: '10px' }}>
          <button
            data-testid="increment-btn"
            onClick={() => counterService.increment()}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Increment
          </button>
          <button
            data-testid="decrement-btn"
            onClick={() => counterService.decrement()}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Decrement
          </button>
          <button
            data-testid="reset-btn"
            onClick={() => counterService.reset()}
            style={{ padding: '8px 16px' }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
