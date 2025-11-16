import { Service } from '@tdi2/di-core';

const test = {
  message: 'Hello from I18n Service',
};

type I18nConfig = typeof test;

export interface I18nServiceInterface {
  data: I18nConfig;
  t(s: keyof I18nConfig): string;
}

// Service implementation is now uncommented
export
@Service()
class I18nService implements I18nServiceInterface {
  data: I18nConfig = test;

  t(s: keyof I18nConfig): string {
    return this.data[s];
  }
}
