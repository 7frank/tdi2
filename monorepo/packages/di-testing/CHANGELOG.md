# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2024-12-XX

### Added

- Initial release of @tdi2/di-testing
- TestContainer with service mocking capabilities  
- Spring Boot-inspired testing decorators (@MockService, @TestInject, @TestConfig, @TestBean, @SpyService)
- Test utilities (setupTest, teardownTest, createMock, createSpy)
- Comprehensive test isolation and scoping support
- Symbol token support for advanced DI scenarios
- Type-safe composition architecture avoiding inheritance conflicts
- Full integration with @tdi2/di-core dependency injection system

### Features

- **Service Mocking**: Mock any service in your DI container for testing
- **Test Isolation**: Each test gets its own container scope by default  
- **Spy Support**: Create partial mocks that preserve original behavior
- **Multiple Override Support**: Override multiple services in a single test
- **Service Restoration**: Restore original implementations after testing
- **Edge Case Handling**: Robust handling of non-existent services and symbol tokens

### Supported Patterns

- Unit testing with service mocks
- Integration testing with selective mocking
- Component testing with DI context
- Decorator-based test configuration (Phase 2 roadmap)