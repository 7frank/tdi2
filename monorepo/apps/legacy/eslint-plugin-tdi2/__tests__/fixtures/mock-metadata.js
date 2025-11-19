/**
 * Mock ESLint metadata for testing
 */

export const validMetadata = {
  version: '1.0.0',
  generated: '2025-01-01T00:00:00.000Z',
  configHash: 'test-hash-123',
  activeProfiles: ['prod'],

  interfaces: {
    UserServiceInterface: {
      implementations: [
        {
          implementationClass: 'UserService',
          implementationPath: 'src/services/UserService.ts',
          implementationLocation: { line: 15, column: 0 },
          token: 'UserServiceInterface__src_services_UserService_ts_line_15',
          scope: 'singleton',
          registrationType: 'interface',
          isPrimary: true,
          profiles: [],
          isSelected: true,
          selectionReason: 'Marked with @Primary decorator',
          dependencies: [
            { interfaceName: 'AuthService', isOptional: false },
            { interfaceName: 'LoggerService', isOptional: false },
          ],
          scanDirectory: 'src',
          isGeneric: false,
          typeParameters: [],
        },
        {
          implementationClass: 'MockUserService',
          implementationPath: 'test/mocks/MockUserService.ts',
          implementationLocation: { line: 5, column: 0 },
          token: 'UserServiceInterface__test_mocks_MockUserService_ts_line_5',
          scope: 'transient',
          registrationType: 'interface',
          isPrimary: false,
          profiles: ['test'],
          isSelected: false,
          selectionReason: 'Not selected: UserService is @Primary',
          dependencies: [],
          scanDirectory: 'test',
          isGeneric: false,
          typeParameters: [],
        },
      ],
      totalImplementations: 2,
      hasAmbiguity: false,
      selectedImplementation: 'UserService',
      disambiguationRequired: false,
    },

    LoggerInterface: {
      implementations: [
        {
          implementationClass: 'FileLogger',
          implementationPath: 'src/services/FileLogger.ts',
          implementationLocation: { line: 10, column: 0 },
          token: 'LoggerInterface__src_services_FileLogger_ts_line_10',
          scope: 'singleton',
          registrationType: 'interface',
          isPrimary: false,
          profiles: [],
          isSelected: true,
          selectionReason: 'Default selection (consider adding @Primary)',
          dependencies: [],
          scanDirectory: 'src',
          isGeneric: false,
          typeParameters: [],
        },
        {
          implementationClass: 'ConsoleLogger',
          implementationPath: 'src/services/ConsoleLogger.ts',
          implementationLocation: { line: 8, column: 0 },
          token: 'LoggerInterface__src_services_ConsoleLogger_ts_line_8',
          scope: 'singleton',
          registrationType: 'interface',
          isPrimary: false,
          profiles: [],
          isSelected: false,
          selectionReason: 'Default selection (consider adding @Primary)',
          dependencies: [],
          scanDirectory: 'src',
          isGeneric: false,
          typeParameters: [],
        },
      ],
      totalImplementations: 2,
      hasAmbiguity: true,
      selectedImplementation: 'FileLogger',
      disambiguationRequired: true,
    },

    UnresolvedInterface: {
      implementations: [],
      totalImplementations: 0,
      hasAmbiguity: false,
      selectedImplementation: undefined,
      disambiguationRequired: false,
    },
  },

  implementations: {
    UserService: {
      filePath: 'src/services/UserService.ts',
      location: { line: 15, column: 0 },
      implementsInterfaces: [
        {
          interfaceName: 'UserServiceInterface',
          interfaceFilePath: 'src/interfaces/UserServiceInterface.ts',
          interfaceLocation: { line: 5, column: 0 },
          isExplicit: true,
        },
      ],
      isService: true,
      decorators: ['@Service()', '@Primary()'],
      scope: 'singleton',
      isPrimary: true,
      profiles: [],
      usedByComponents: [
        'src/components/UserProfile.tsx',
        'src/components/UserDashboard.tsx',
      ],
      dependsOn: ['AuthService', 'LoggerService'],
    },

    FileLogger: {
      filePath: 'src/services/FileLogger.ts',
      location: { line: 10, column: 0 },
      implementsInterfaces: [
        {
          interfaceName: 'LoggerInterface',
          interfaceFilePath: 'src/interfaces/LoggerInterface.ts',
          interfaceLocation: { line: 3, column: 0 },
          isExplicit: true,
        },
      ],
      isService: true,
      decorators: ['@Service()'],
      scope: 'singleton',
      isPrimary: false,
      profiles: [],
      usedByComponents: ['src/components/App.tsx'],
      dependsOn: [],
    },
  },

  components: {
    'src/components/UserProfile.tsx': {
      componentName: 'UserProfile',
      injections: [
        {
          paramName: 'userService',
          interfaceType: 'UserServiceInterface',
          isOptional: false,
          resolvedClass: 'UserService',
          resolvedPath: 'src/services/UserService.ts',
          token: 'UserServiceInterface__src_services_UserService_ts_line_15',
          allPossibleImplementations: ['UserService', 'MockUserService'],
          hasAmbiguity: false,
        },
      ],
    },
  },

  lookups: {
    interfaceToClass: {
      UserServiceInterface: 'UserService',
      LoggerInterface: 'FileLogger',
    },
    classToInterfaces: {
      UserService: ['UserServiceInterface'],
      FileLogger: ['LoggerInterface'],
    },
    componentToInterfaces: {
      'src/components/UserProfile.tsx': ['UserServiceInterface'],
    },
    interfaceToComponents: {
      UserServiceInterface: ['src/components/UserProfile.tsx'],
    },
  },

  issues: [
    {
      type: 'ambiguous',
      severity: 'warning',
      interfaceName: 'LoggerInterface',
      message:
        'Multiple implementations found (FileLogger, ConsoleLogger). Consider adding @Primary decorator.',
      affectedComponents: ['src/components/App.tsx'],
      suggestedFix:
        'Add @Primary() decorator to preferred implementation or use @Qualifier at injection point',
    },
  ],
};

export const metadataNotFound = {
  error: 'CONFIG_NOT_FOUND',
  message: 'TDI2 config not found. Run your app once to generate interface resolution data.',
};

export const metadataParseError = {
  error: 'PARSE_ERROR',
  message: 'Failed to parse ESLint metadata: Unexpected token',
};
