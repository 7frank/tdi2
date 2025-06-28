// // src/logging/example-usage.ts - Updated Example Usage and Integration

// import { initLogging, logging, log, devLog, errorLog } from './init';
// import { patchConsole, updateConsoleConfig, consolePresets, setConsoleRouting } from './console-monkey-patch';
// import type { ConsoleMonkeyPatchConfig } from './types';

// /**
//  * Example 1: Basic initialization for different environments
//  */
// export function exampleBasicInitialization() {
//   // Auto-detect environment and initialize
//   const logger = logging.auto();
  
//   // Or initialize for specific environments
//   // const devLogger = logging.forDevelopment();
//   // const prodLogger = logging.forProduction();
//   // const testLogger = logging.forTesting();
  
//   // Use the convenience log functions
//   log.info('Application started', { version: '1.0.0' });
//   log.debug('Debug information', { userId: '123' });
//   log.warn('Warning message');
//   log.error('Error occurred', new Error('Something went wrong'));
// }

// /**
//  * Example 2: Fine-grained console monkey patch configuration
//  */
// export function exampleFinegrainedConsoleControl() {
//   // Initialize with precise control over each console method
//   const logger = initLogging({
//     environment: 'development',
//     serviceName: 'my-tdi2-app',
//     serviceVersion: '2.0.0',
//     consoleMonkeyPatch: {
//       log: 'otel',     // console.log() → OpenTelemetry only
//       debug: 'otel',   // console.debug() → OpenTelemetry only
//       info: 'otel',    // console.info() → OpenTelemetry only
//       warn: 'both',    // console.warn() → Both OpenTelemetry and console
//       error: 'both',   // console.error() → Both OpenTelemetry and console
//       table: 'console' // console.table() → Console only
//     },
//     customConfig: {
//       resource: {
//         'service.namespace': 'my-namespace',
//         'deployment.environment': 'custom-env',
//         'custom.attribute': 'custom-value'
//       }
//     }
//   });

//   logger.info('Custom logger initialized with fine-grained console control');
// }

// /**
//  * Example 3: Using console presets for quick setup
//  */
// export function exampleConsolePresets() {
//   // Development preset: warnings and errors visible in console
//   patchConsole(consolePresets.development());
  
//   // Test different presets
//   console.log('This goes to OpenTelemetry only');
//   console.warn('This goes to both OpenTelemetry and console');
//   console.error('This goes to both OpenTelemetry and console');
  
//   // Switch to production preset
//   updateConsoleConfig(consolePresets.production());
//   console.warn('Now this only goes to OpenTelemetry');
//   console.error('But errors still go to both');
  
//   // Debug mode - everything visible
//   updateConsoleConfig(consolePresets.debug());
//   console.log('Now everything is visible in console too');
  
//   // Silent mode - everything to OpenTelemetry only
//   updateConsoleConfig(consolePresets.silent());
//   console.error('Even errors now only go to OpenTelemetry');
// }

// /**
//  * Example 4: Dynamic console routing during runtime
//  */
// export function exampleDynamicConsoleRouting() {
//   // Start with development preset
//   patchConsole(consolePresets.development());
  
//   // Change individual method routing
//   setConsoleRouting.log('both');      // Make logs visible in console
//   setConsoleRouting.table('both');    // Make tables visible in console
//   setConsoleRouting.info('console');  // Make info console-only
  
//   console.log('This is now visible in console');
//   console.info('This only goes to console');
//   console.table([{name: 'John', age: 30}]); // Table visible in console
  
//   // Update multiple methods at once
//   updateConsoleConfig({
//     log: 'otel',
//     debug: 'both',
//     table: 'otel'
//   });
  
//   console.log('Back to OpenTelemetry only');
//   console.debug('Debug now visible in console');
// }

// /**
//  * Example 5: DI integration with enhanced logging
//  */
// export function exampleDIIntegration() {
//   // Initialize with service-specific configuration
//   const logger = initLogging({
//     consoleMonkeyPatch: consolePresets.development(),
//     serviceName: 'user-service',
//     customConfig: {
//       resource: {
//         'service.layer': 'business-logic',
//         'service.team': 'platform'
//       }
//     }
//   });

//   // In your DI-enabled service
//   class UserService {
//     constructor(
//       // Inject the logger service through DI
//       private logger = log // or inject LoggerInterface through DI
//     ) {}
    
//     async createUser(userData: any) {
//       this.logger.info('Creating user', { 
//         userData: userData.email,
//         operation: 'user-creation'
//       });
      
//       try {
//         // Simulate user creation
//         const userId = Math.random().toString(36);
        
//         this.logger.debug('User creation process', {
//           step: 'validation',
//           userId,
//           phase: 'pre-creation'
//         });
        
//         // Use timing wrapper with enhanced logging
//         const user = await devLog.withTiming('user-creation-operation', async () => {
//           // Simulate async operation
//           await new Promise(resolve => setTimeout(resolve, 100));
          
//           // Log intermediate steps
//           console.log('Validating user data'); // → OpenTelemetry only
//           console.warn('User email already exists, merging accounts'); // → Both places
          
//           return { id: userId, ...userData };
//         }, { 
//           service: 'UserService',
//           operation: 'createUser'
//         });
        
//         this.logger.info('User created successfully', { 
//           userId,
//           userEmail: user.email,
//           success: true
//         });
//         return user;
        
//       } catch (error) {
//         // Enhanced error logging with DI-specific context
//         this.logger.error('Failed to create user', error as Error, { 
//           userData: userData.email,
//           service: 'UserService',
//           operation: 'createUser',
//           success: false
//         });
//         throw error;
//       }
//     }
//   }
  
//   const userService = new UserService();
//   userService.createUser({ email: 'test@example.com', name: 'Test User' });
// }

// /**
//  * Example 6: Enhanced TDI2-specific logging with console routing
//  */
// export function exampleTDI2Logging() {
//   // Set up console routing for development
//   patchConsole(consolePresets.development());
  
//   // Log DI registration events
//   log.diRegistration('UserRepository', 'DatabaseUserRepository', 'interface');
//   log.diRegistration('LoggerInterface', 'ConsoleLogger', 'interface');
  
//   // Log DI resolution with performance metrics
//   log.diResolution('UserRepository', 'DatabaseUserRepository', true, 5);
//   log.diResolution('NonExistentService', 'FAILED', false, 15);
  
//   // Log service creation with dependency information
//   log.serviceCreation('UserService', ['UserRepository', 'LoggerInterface'], 10);
//   log.serviceCreation('EmailService', ['SMTPProvider', 'LoggerInterface'], 25);
  
//   // Log component transformation
//   log.componentTransformation('UserProfile', 'functional', ['UserService', 'LoggerInterface']);
//   log.componentTransformation('TodoApp', 'functional', ['TodoService', 'FormService']);
  
//   // Performance metrics with different console routing
//   setConsoleRouting.info('both'); // Make performance logs visible
//   log.performance('component-render', 45, 'ms');
//   log.performance('api-call', 250, 'ms');
//   log.performance('dependency-resolution', 12, 'ms');
  
//   // Memory usage monitoring
//   log.memoryUsage();
  
//   // User actions with context
//   log.userAction('button-click', 'user-123');
//   log.userAction('form-submit', 'user-456');
  
//   // API call logging
//   log.apiCall('POST', '/api/users', 201, 150);
//   log.apiCall('GET', '/api/users/123', 404, 75);
// }

// /**
//  * Example 7: Error categorization with console visibility
//  */
// export function exampleErrorLogging() {
//   // Configure errors to be visible in both places
//   updateConsoleConfig({ error: 'both', warn: 'both' });
  
//   try {
//     // Simulate DI error
//     throw new Error('Cannot resolve dependency: NonExistentService');
//   } catch (error) {
//     errorLog.diError('resolution_failed', 'Service resolution failed', error as Error);
//   }
  
//   try {
//     // Simulate transformation error
//     throw new Error('Cannot parse TypeScript file');
//   } catch (error) {
//     errorLog.transformationError('parse_error', 'UserComponent.tsx', 'Syntax error in component', error as Error);
//   }
  
//   // Demonstrate different error types with context
//   errorLog.diError('circular_dependency', 'Circular dependency detected', undefined);
//   errorLog.transformationError('generation_error', 'TodoService.ts', 'Failed to generate DI config', new Error('Unknown symbol'));
// }

// /**
//  * Example 8: Development helpers with console integration
//  */
// export function exampleDevelopmentHelpers() {
//   // Enable debug output in console for development
//   updateConsoleConfig({ debug: 'both', info: 'both' });
  
//   const oldUserData = { name: 'John', age: 30, preferences: { theme: 'dark' } };
//   const newUserData = { name: 'John', age: 31, preferences: { theme: 'light', notifications: true } };
  
//   // Log object differences with enhanced context
//   devLog.diff('user-profile-update', oldUserData, newUserData);
  
//   // Log debug information with structured data
//   devLog.debugInfo('component-state', {
//     componentName: 'UserProfile',
//     propsCount: 5,
//     stateKeys: ['user', 'loading', 'error', 'preferences'],
//     renderCount: 3,
//     lastUpdated: new Date().toISOString()
//   });
  
//   // Log with timing for performance analysis
//   const result = devLog.withTiming('expensive-calculation', () => {
//     // Simulate expensive operation
//     let sum = 0;
//     for (let i = 0; i < 1000000; i++) {
//       sum += Math.sqrt(i);
//     }
//     return sum;
//   }, {
//     operation: 'mathematical-computation',
//     complexity: 'O(n)',
//     inputSize: 1000000
//   });
  
//   console.log('Calculation result:', result);
// }

// /**
//  * Example 9: Context management with console monkey patch
//  */
// export function exampleContextManagement() {
//   const logger = logging.auto();
  
//   // Set global context
//   logger.setGlobalContext({
//     userId: 'user-123',
//     sessionId: 'session-456',
//     version: '1.0.0',
//     environment: 'development'
//   });
  
//   // Create child logger with additional context
//   const componentLogger = logger.createChildLogger('UserComponent', {
//     component: 'UserProfile',
//     page: 'dashboard',
//     feature: 'user-management'
//   });
  
//   componentLogger.info('Component rendered');
  
//   // Use logger with temporary context
//   const tempLogger = componentLogger.withContext({
//     operation: 'data-fetch',
//     requestId: 'req-789',
//     retryAttempt: 1
//   });
  
//   tempLogger.debug('Fetching user data');
  
//   // Console logs will also include this context when captured
//   console.log('This console log will include the global context');
//   console.warn('This warning includes all the context information');
// }

// /**
//  * Example 10: Environment-specific behavior with console routing
//  */
// export function exampleEnvironmentSpecific() {
//   // Different behavior based on environment
//   if (process.env.NODE_ENV === 'development') {
//     // Development: verbose logging, warnings and errors in console
//     logging.forDevelopment();
    
//     // Override with more verbose console output for debugging
//     updateConsoleConfig(consolePresets.debug());
    
//   } else if (process.env.NODE_ENV === 'production') {
//     // Production: minimal logging, only errors in console
//     logging.forProduction();
    
//     // Ensure only critical errors are visible
//     updateConsoleConfig(consolePresets.production());
    
//   } else if (process.env.NODE_ENV === 'test') {
//     // Test: silent logging, nothing in console
//     logging.forTesting();
    
//     // Complete silence in console for tests
//     updateConsoleConfig(consolePresets.silent());
//   }
// }

// /**
//  * Example 11: Integration with React components
//  */
// export function exampleReactIntegration() {
//   // Initialize with React-friendly configuration
//   const logger = initLogging({
//     consoleMonkeyPatch: consolePresets.development(),
//     serviceName: 'react-tdi2-app',
//     customConfig: {
//       resource: {
//         'framework': 'react',
//         'framework.version': '19.1.0'
//       }
//     }
//   });
  
//   // Example React component with enhanced logging
//   function UserProfileComponent(props: { userId: string }) {
//     const componentLogger = logger.createChildLogger('UserProfile', {
//       component: 'UserProfile',
//       userId: props.userId,
//       renderTimestamp: new Date().toISOString()
//     });
    
//     // React.useEffect(() => {
//     //   componentLogger.logUserAction('component-mount', props.userId);
//     //   
//     //   // Console logs within components are also captured
//     //   console.log(`UserProfile mounted for user ${props.userId}`);
//     //   
//     //   return () => {
//     //     componentLogger.logUserAction('component-unmount', props.userId);
//     //     console.log(`UserProfile unmounted for user ${props.userId}`);
//     //   };
//     // }, []);
    
//     const handleClick = () => {
//       componentLogger.logUserAction('profile-click', props.userId);
      
//       // This will be captured and routed according to console configuration
//       console.info(`User ${props.userId} clicked on profile`);
//     };
    
//     const handleError = (error: Error) => {
//       componentLogger.error('Component error occurred', error, {
//         component: 'UserProfile',
//         userId: props.userId,
//         action: 'handleError'
//       });
      
//       // Error will be visible in console (development preset)
//       console.error('UserProfile error:', error);
//     };
    
//     return {
//       onClick: handleClick,
//       onError: handleError,
//       userId: props.userId
//     };
//   }
  
//   return UserProfileComponent;
// }

// /**
//  * Example 12: Testing with logging and console control
//  */
// export function exampleTestingWithLogging() {
//   // In test files
//   beforeEach(() => {
//     // Initialize silent logging for tests
//     logging.forTesting();
    
//     // Ensure complete console silence during tests
//     updateConsoleConfig(consolePresets.silent());
//   });
  
//   afterEach(async () => {
//     // Clean up logging
//     const logger = logging.auto();
//     await logger.forceFlush();
//   });
  
//   // Test with controlled console output
//   it('should log user creation with proper routing', async () => {
//     const logger = logging.auto();
    
//     // Create a test logger to capture logs
//     const testLogger = logger.createChildLogger('test', {
//       testName: 'user-creation-test',
//       testId: 'test-123'
//     });
    
//     // Temporarily enable console output for verification
//     updateConsoleConfig({ info: 'console', error: 'console' });
    
//     try {
//       // Your test logic here
//       testLogger.info('Test log message');
//       console.log('This should be visible during test');
      
//       // Verify logging behavior
//       // ... test assertions ...
      
//     } finally {
//       // Restore silent mode
//       updateConsoleConfig(consolePresets.silent());
//     }
    
//     // Flush logs
//     await logger.forceFlush();
//   });
// }

// /**
//  * Example 13: Advanced console routing patterns
//  */
// export function exampleAdvancedConsoleRouting() {
//   // Start with base configuration
//   patchConsole(consolePresets.development());
  
//   // Scenario 1: Debug session - make everything visible temporarily
//   console.log('=== Starting debug session ===');
//   updateConsoleConfig(consolePresets.debug());
  
//   console.log('Debug info visible');
//   console.debug('Detailed debug information');
//   console.table([{name: 'John', age: 30}, {name: 'Jane', age: 25}]);
  
//   // Scenario 2: Performance testing - only performance logs to console
//   updateConsoleConfig({
//     log: 'otel',
//     debug: 'otel',
//     info: 'console',  // Performance logs use info level
//     warn: 'otel',
//     error: 'both',
//     table: 'otel'
//   });
  
//   log.performance('api-response-time', 245, 'ms');
//   console.info('Performance test completed'); // Visible in console
  
//   // Scenario 3: Error investigation - errors and warnings visible
//   updateConsoleConfig({
//     log: 'otel',
//     debug: 'otel',
//     info: 'otel',
//     warn: 'both',
//     error: 'both',
//     table: 'console'  // Tables for data inspection
//   });
  
//   console.warn('Investigation mode active');
//   console.table({error: 'UserNotFound', count: 5, lastOccurred: new Date()});
  
//   // Scenario 4: Production incident - only critical errors to console
//   updateConsoleConfig(consolePresets.production());
//   console.error('Critical production error logged');
  
//   console.log('=== Debug session ended ===');
// }

// /**
//  * Example 14: Application initialization with comprehensive logging setup
//  */
// export function exampleApplicationInit() {
//   // At the very start of your application (main.tsx or index.ts)
  
//   // Determine environment-specific console configuration
//   const getConsoleConfig = (): ConsoleMonkeyPatchConfig => {
//     const env = process.env.NODE_ENV;
//     const debugMode = process.env.DEBUG === 'true';
    
//     if (debugMode) return consolePresets.debug();
//     if (env === 'production') return consolePresets.production();
//     if (env === 'test') return consolePresets.silent();
//     return consolePresets.development(); // Default for development
//   };
  
//   // Initialize logging before anything else
//   const logger = initLogging({
//     environment: 'auto',
//     consoleMonkeyPatch: getConsoleConfig(),
//     serviceName: 'tdi2-react-app',
//     serviceVersion: process.env.REACT_APP_VERSION || '1.0.0',
//     customConfig: {
//       resource: {
//         'service.name': 'tdi2-react-app',
//         'service.version': process.env.REACT_APP_VERSION || '1.0.0',
//         'deployment.environment': process.env.NODE_ENV || 'development',
//         'git.commit.sha': process.env.REACT_APP_GIT_SHA || 'unknown',
//         'build.timestamp': new Date().toISOString()
//       }
//     }
//   });
  
//   // Log application startup
//   logger.info('Application starting', {
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV,
//     version: process.env.REACT_APP_VERSION,
//     userAgent: navigator.userAgent,
//     location: window.location.href,
//     consoleConfig: getConsoleConfig()
//   });
  
//   // Set up global error handler with enhanced logging
//   window.addEventListener('error', (event) => {
//     logger.error('Uncaught error', event.error, {
//       filename: event.filename,
//       lineno: event.lineno,
//       colno: event.colno,
//       type: 'global-error'
//     });
    
//     // Temporarily show error in console for debugging
//     setConsoleRouting.error('both');
//     console.error('Global error captured:', event.error);
//   });
  
//   window.addEventListener('unhandledrejection', (event) => {
//     logger.error('Unhandled promise rejection', event.reason, {
//       type: 'unhandled-rejection',
//       reason: event.reason
//     });
    
//     // Show promise rejections in console
//     setConsoleRouting.error('both');
//     console.error('Unhandled promise rejection:', event.reason);
//   });
  
//   // Log when the app is about to unload
//   window.addEventListener('beforeunload', async () => {
//     logger.info('Application shutting down');
//     await logger.forceFlush();
//   });
  
//   // Development-specific console commands
//   if (process.env.NODE_ENV === 'development') {
//     // Add global debugging functions
//     (window as any).debugConsole = {
//       showAll: () => updateConsoleConfig(consolePresets.debug()),
//       hideAll: () => updateConsoleConfig(consolePresets.silent()),
//       errorsOnly: () => updateConsoleConfig(consolePresets.production()),
//       development: () => updateConsoleConfig(consolePresets.development()),
//       config: () => console.table(consoleMonkeyPatch.getConfig())
//     };
    
//     console.log('Debug commands available: window.debugConsole');
//   }
  
//   return logger;
// }

// // Export all examples for easy testing
// export const examples = {
//   basicInitialization: exampleBasicInitialization,
//   finegrainedConsoleControl: exampleFinegrainedConsoleControl,
//   consolePresets: exampleConsolePresets,
//   dynamicConsoleRouting: exampleDynamicConsoleRouting,
//   diIntegration: exampleDIIntegration,
//   tdi2Logging: exampleTDI2Logging,
//   errorLogging: exampleErrorLogging,
//   developmentHelpers: exampleDevelopmentHelpers,
//   contextManagement: exampleContextManagement,
//   environmentSpecific: exampleEnvironmentSpecific,
//   reactIntegration: exampleReactIntegration,
//   testingWithLogging: exampleTestingWithLogging,
//   advancedConsoleRouting: exampleAdvancedConsoleRouting,
//   applicationInit: exampleApplicationInit
// };

// export function exampleTestingWithLogging() {
//   // In test files
//   beforeEach(() => {
//     // Initialize silent logging for tests
//     logging.forTesting();
//   });
  
//   afterEach(async () => {
//     // Clean up logging
//     const logger = logging.auto();
//     await logger.forceFlush();
//   });
  
//   // Test with logging verification
//   it('should log user creation', async () => {
//     const logger = logging.auto();
    
//     // Create a test logger to capture logs
//     const testLogger = logger.createChildLogger('test');
    
//     // Your test logic here
//     testLogger.info('Test log message');
    
//     // Flush logs
//     await logger.forceFlush();
//   });
// }

// /**
//  * Example 12: Application initialization
//  */
// export function exampleApplicationInit() {
//   // At the very start of your application (main.tsx or index.ts)
  
//   // Initialize logging before anything else
//   const logger = logging.auto({
//     resource: {
//       'service.name': 'tdi2-react-app',
//       'service.version': process.env.REACT_APP_VERSION || '1.0.0',
//       'deployment.environment': process.env.NODE_ENV || 'development'
//     }
//   });
  
//   // Log application startup
//   logger.info('Application starting', {
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV,
//     version: process.env.REACT_APP_VERSION
//   });
  
//   // Set up global error handler
//   window.addEventListener('error', (event) => {
//     logger.error('Uncaught error', event.error, {
//       filename: event.filename,
//       lineno: event.lineno,
//       colno: event.colno
//     });
//   });
  
//   window.addEventListener('unhandledrejection', (event) => {
//     logger.error('Unhandled promise rejection', event.reason, {
//       type: 'unhandledrejection'
//     });
//   });
  
//   // Log when the app is about to unload
//   window.addEventListener('beforeunload', async () => {
//     logger.info('Application shutting down');
//     await logger.forceFlush();
//   });
  
//   return logger;
// }

// // Export all examples for easy testing
// export const examples = {
//   basicInitialization: exampleBasicInitialization,
//   customConfiguration: exampleCustomConfiguration,
//   consoleMonkeyPatch: exampleConsoleMonkeyPatch,
//   diIntegration: exampleDIIntegration,
//   tdi2Logging: exampleTDI2Logging,
//   errorLogging: exampleErrorLogging,
//   developmentHelpers: exampleDevelopmentHelpers,
//   contextManagement: exampleContextManagement,
//   environmentSpecific: exampleEnvironmentSpecific,
//   reactIntegration: exampleReactIntegration,
//   testingWithLogging: exampleTestingWithLogging,
//   applicationInit: exampleApplicationInit
// };