import { singleton, graph, provides, ObjectGraph } from 'react-obsidian';
import { CounterService, type CounterServiceInterface } from '../services/CounterService';

@singleton()
@graph()
export class ApplicationGraph extends ObjectGraph {
  @provides()
  counterService(): CounterServiceInterface {
    return new CounterService();
  }
}
