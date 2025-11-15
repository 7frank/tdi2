import { Service } from '@tdi2/di-core';
import type { DataServiceInterface } from '../../test-app/src/types/interfaces';

@Service()
export class DataService implements DataServiceInterface {
  state = {
    data: 'Hello from DataService',
    isLoading: false,
  };

  loadData() {
    this.state.isLoading = true;
    this.state.data = 'Data loaded!';
    this.state.isLoading = false;
  }

  resetData() {
    this.state.data = 'Hello from DataService';
    this.state.isLoading = false;
  }
}
