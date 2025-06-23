// test-di.js - Quick test to verify DI works

import { CompileTimeDIContainer } from './src/di/container';
import { DI_CONFIG } from './src/generated/di-config';

console.log('🧪 Testing DI Container...');

// Create container
const container = new CompileTimeDIContainer();

// Load configuration
container.loadConfiguration(DI_CONFIG);

// Test resolution
try {
  console.log('📋 Registered tokens:', container.getRegisteredTokens());
  
  const logger = container.resolve('LOGGER_TOKEN');
  console.log('✅ Logger resolved:', logger.constructor.name);
  logger.log('Test message from DI!');
  
  const apiService = container.resolve('EXAMPLE_API_TOKEN');
  console.log('✅ API Service resolved:', apiService.constructor.name);
  
  // Test async method
  apiService.getData().then(data => {
    console.log('📊 Test data:', data);
  });
  
} catch (error) {
  console.error('❌ DI Test failed:', error);
}