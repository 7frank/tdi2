import { singleton, graph, provides, ObjectGraph } from 'react-obsidian';
import { CounterService } from '../services/CounterService';

@singleton()
@graph()
export class ApplicationGraph extends ObjectGraph {
  @provides()
  counterService(): CounterService {
    return new CounterService();
  }
}
