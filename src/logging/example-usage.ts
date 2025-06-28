// src/logging/example-usage.ts - Example Usage and Integration

import { initLogging, logging, log, devLog, errorLog } from './init';
import { patchConsole, setConsoleLogLevel } from './console-monkey-patch';
import type { LogLevel } from './types';

/**
 * Example 1: Basic initialization for different environments
 */
export function exampleBasicInitialization() {
  // Auto-detect environment and initialize
  const logger = logging.auto();
  
  // Or initialize for specific environments
  // const devLogger = logging.forDevelopment();
  // const prodLogger = logging.forProduction();
  // const testLogger = logging.forTesting();
  
  // Use the convenience log functions
  log.info('Application started', { version: '1.0.0' });
  log.debug('Debug information', { userId: '123' });
  log.warn('Warning message');
  log.error('Error occurred', new Error('Something went wrong'));
}

/**
 * Example 2: Custom configuration
 */
export function exampleCustomConfiguration() {
  const logger = initLogging({
    environment: 'development',
    consoleLogLevel: 'DEBUG' as LogLevel,
    enableConsoleMonkeyPatch: true,
    serviceName: 'my-tdi2-app',
    serviceVersion: '2.0.0',
    customConfig: {
      resource: {
        'service.namespace': 'my-namespace',
        'deployment.environment': 'custom-env',
        'custom.attribute': 'custom-value'
      }
    }
  });

  logger.info('Custom logger initialized');
}

/**
 * Example 3: Console monkey patching
 */
export function exampleConsoleMonkeyPatch() {
  // Initialize logging with monkey patch
  logging.withConsoleMonkeyPatch(true);
  
  // Or use standalone monkey patch
  patchConsole('INFO' as LogLevel);
  
  // Now all console.log, console.warn, etc. will be captured
  console.log('This will be logged to OpenTelemetry');
  console.warn('This warning will be captured');
  console.error('This error will be captured');
  
  // Change log level dynamically
  setConsoleLogLevel('ERROR' as LogLevel);
  
  // Only errors will now appear in original console
  console.log('This will only go to OpenTelemetry');
  console.error('This will go to both OpenTelemetry and console');
}

/**
 * Example 4: DI integration
 */
export function exampleDIIntegration() {
  // In your DI-enabled service
  class UserService {
    constructor(
      // Inject the logger service through DI
      private logger = log // or inject LoggerInterface through DI
    ) {}
    
    async createUser(userData: any) {
      this.logger.info('Creating user', { userData: userData.email });
      
      try {
        // Simulate user creation
        const userId = Math.random().toString(36);
        
        this.logger.debug('User creation process', {
          step: 'validation',
          userId
        });
        
        // Use timing wrapper
        const user = await devLog.withTiming('user-creation', async () => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100));
          return { id: userId, ...userData };
        });
        
        this.logger.info('User created successfully', { userId });
        return user;
        
      } catch (error) {
        this.logger.error('Failed to create user', error as Error, { userData });
        throw error;
      }
    }
  }
  
  const userService = new UserService();
  userService.createUser({ email: 'test@example.com', name: 'Test User' });
}

/**
 * Example 5: TDI2-specific logging
 */
export function exampleTDI2Logging() {
  // Log DI registration
  log.diRegistration('UserRepository', 'DatabaseUserRepository', 'interface');
  
  // Log DI resolution
  log.diResolution('UserRepository', 'DatabaseUserRepository', true, 5);
  
  // Log service creation
  log.serviceCreation('UserService', ['UserRepository', 'LoggerInterface'], 10);
  
  // Log component transformation
  log.componentTransformation('UserProfile', 'functional', ['UserService', 'LoggerInterface']);
  
  // Log performance metrics
  log.performance('component-render', 45, 'ms');
  log.performance('api-call', 250, 'ms');
  
  // Log memory usage
  log.memoryUsage();
  
  // Log user actions
  log.userAction('button-click', 'user-123');
  
  // Log API calls
  log.apiCall('POST', '/api/users', 201, 150);
}

/**
 * Example 6: Error categorization
 */
export function exampleErrorLogging() {
  try {
    // Simulate DI error
    throw new Error('Cannot resolve dependency: NonExistentService');
  } catch (error) {
    errorLog.diError('resolution_failed', 'Service resolution failed', error as Error);
  }
  
  try {
    // Simulate transformation error
    throw new Error('Cannot parse TypeScript file');
  } catch (error) {
    errorLog.transformationError('parse_error', 'UserComponent.tsx', 'Syntax error in component', error as Error);
  }
}

/**
 * Example 7: Development helpers
 */
export function exampleDevelopmentHelpers() {
  const oldUserData = { name: 'John', age: 30 };
  const newUserData = { name: 'John', age: 31 };
  
  // Log object differences
  devLog.diff('user-update', oldUserData, newUserData);
  
  // Log debug information
  devLog.debugInfo('component-state', {
    componentName: 'UserProfile',
    propsCount: 5,
    stateKeys: ['user', 'loading', 'error'],
    renderCount: 3
  });
  
  // Log with timing for performance analysis
  const result = devLog.withTiming('expensive-operation', () => {
    // Simulate expensive operation
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  });
  
  console.log('Result:', result);
}

/**
 * Example 8: Context management
 */
export function exampleContextManagement() {
  const logger = logging.auto();
  
  // Set global context
  logger.setGlobalContext({
    userId: 'user-123',
    sessionId: 'session-456',
    version: '1.0.0'
  });
  
  // Create child logger with additional context
  const componentLogger = logger.createChildLogger('UserComponent', {
    component: 'UserProfile',
    page: 'dashboard'
  });
  
  componentLogger.info('Component rendered');
  
  // Use logger with temporary context
  const tempLogger = componentLogger.withContext({
    operation: 'data-fetch',
    requestId: 'req-789'
  });
  
  tempLogger.debug('Fetching user data');
}

/**
 * Example 9: Environment-specific behavior
 */
export function exampleEnvironmentSpecific() {
  // Different behavior based on environment
  if (process.env.NODE_ENV === 'development') {
    // Development: verbose logging, console monkey patch
    logging.forDevelopment({
      enableDiagnostics: true,
      diagnosticLevel: 'DEBUG'
    });
    
    // Enable all console messages in development
    setConsoleLogLevel('DEBUG' as LogLevel);
    
  } else if (process.env.NODE_ENV === 'production') {
    // Production: minimal logging, error-only console
    logging.forProduction({
      enableDiagnostics: false
    });
    
    // Only show errors in production console
    setConsoleLogLevel('ERROR' as LogLevel);
    
  } else {
    // Test: silent logging
    logging.forTesting();
  }
}

/**
 * Example 10: Integration with React components
 */
export function exampleReactIntegration() {
  // Example React component with logging
  function UserProfileComponent(props: { userId: string }) {
    const logger = logging.auto().createChildLogger('UserProfile', {
      component: 'UserProfile',
      userId: props.userId
    });
    
    // React.useEffect(() => {
    //   logger.logUserAction('component-mount', props.userId);
    //   
    //   return () => {
    //     logger.logUserAction('component-unmount', props.userId);
    //   };
    // }, []);
    
    const handleClick = () => {
      logger.logUserAction('profile-click', props.userId);
    };
    
    return {
      onClick: handleClick,
      userId: props.userId
    };
  }
  
  return UserProfileComponent;
}

/**
 * Example 11: Testing with logging
 */
export function exampleTestingWithLogging() {
  // In test files
  beforeEach(() => {
    // Initialize silent logging for tests
    logging.forTesting();
  });
  
  afterEach(async () => {
    // Clean up logging
    const logger = logging.auto();
    await logger.forceFlush();
  });
  
  // Test with logging verification
  it('should log user creation', async () => {
    const logger = logging.auto();
    
    // Create a test logger to capture logs
    const testLogger = logger.createChildLogger('test');
    
    // Your test logic here
    testLogger.info('Test log message');
    
    // Flush logs
    await logger.forceFlush();
  });
}

/**
 * Example 12: Application initialization
 */
export function exampleApplicationInit() {
  // At the very start of your application (main.tsx or index.ts)
  
  // Initialize logging before anything else
  const logger = logging.auto({
    resource: {
      'service.name': 'tdi2-react-app',
      'service.version': process.env.REACT_APP_VERSION || '1.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development'
    }
  });
  
  // Log application startup
  logger.info('Application starting', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.REACT_APP_VERSION
  });
  
  // Set up global error handler
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      type: 'unhandledrejection'
    });
  });
  
  // Log when the app is about to unload
  window.addEventListener('beforeunload', async () => {
    logger.info('Application shutting down');
    await logger.forceFlush();
  });
  
  return logger;
}

// Export all examples for easy testing
export const examples = {
  basicInitialization: exampleBasicInitialization,
  customConfiguration: exampleCustomConfiguration,
  consoleMonkeyPatch: exampleConsoleMonkeyPatch,
  diIntegration: exampleDIIntegration,
  tdi2Logging: exampleTDI2Logging,
  errorLogging: exampleErrorLogging,
  developmentHelpers: exampleDevelopmentHelpers,
  contextManagement: exampleContextManagement,
  environmentSpecific: exampleEnvironmentSpecific,
  reactIntegration: exampleReactIntegration,
  testingWithLogging: exampleTestingWithLogging,
  applicationInit: exampleApplicationInit
};