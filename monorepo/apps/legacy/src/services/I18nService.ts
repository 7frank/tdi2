import { Service } from "@tdi2/di-core";

const test = {
  title: "TDI2 Todo App !!!"
};

type AppLangConfig = typeof test;

export interface I18nInterface<T> {
  data: T;
  t(s: keyof T): string;
}

export 
interface AppLangInterface extends I18nInterface<AppLangConfig> {}

 export 
@Service()
class I18n implements AppLangInterface {
  data: AppLangConfig = test;

  t(s: keyof AppLangConfig): string {
    return this.data[s];
  }
}
