// tools/__tests__/profile-support.test.ts - Tests for @Profile runtime support

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { CompileTimeDIContainer, DIContainerOptions } from '../../src/container';
import { ProfileManager } from '../../src/profile-manager';
import type { ConfigurationMetadata, BeanMetadata, DIMap, ContainerConfiguration } from '../../src/types';

describe('@Profile Runtime Support', () => {
  let container: CompileTimeDIContainer;
  let profileManager: ProfileManager;
  let originalEnvVars: Record<string, string | undefined>;

  beforeEach(() => {
    // Store and clear environment variables that affect profile initialization
    originalEnvVars = {
      TDI2_PROFILES: process.env.TDI2_PROFILES,
      ACTIVE_PROFILES: process.env.ACTIVE_PROFILES,
      PROFILES: process.env.PROFILES,
      NODE_ENV: process.env.NODE_ENV
    };
    
    delete process.env.TDI2_PROFILES;
    delete process.env.ACTIVE_PROFILES;
    delete process.env.PROFILES;
    delete process.env.NODE_ENV;
    
    container = new CompileTimeDIContainer(undefined, { verbose: false });
    profileManager = new ProfileManager({ verbose: false });
  });

  afterEach(() => {
    // Restore environment variables
    for (const [key, value] of Object.entries(originalEnvVars)) {
      if (value !== undefined) {
        process.env[key] = value;
      }
    }
  });

  describe('ProfileManager', () => {
    it('should initialize with default profiles when no profiles are active', () => {
      const activeProfiles = profileManager.getActiveProfiles();
      expect(activeProfiles).toEqual(['default']);
    });

    it('should set and get active profiles', () => {
      profileManager.setActiveProfiles(['dev', 'test']);
      const activeProfiles = profileManager.getActiveProfiles();
      expect(activeProfiles).toEqual(['dev', 'test']);
    });

    it('should add additional profiles', () => {
      profileManager.setActiveProfiles(['dev']);
      profileManager.addActiveProfiles(['test', 'debug']);
      const activeProfiles = profileManager.getActiveProfiles();
      expect(activeProfiles).toContain('dev');
      expect(activeProfiles).toContain('test');
      expect(activeProfiles).toContain('debug');
    });

    it('should check if specific profile is active', () => {
      profileManager.setActiveProfiles(['dev', 'test']);
      
      expect(profileManager.isProfileActive('dev')).toBe(true);
      expect(profileManager.isProfileActive('test')).toBe(true);
      expect(profileManager.isProfileActive('prod')).toBe(false);
    });

    it('should handle negated profiles correctly', () => {
      profileManager.setActiveProfiles(['dev', 'test']);
      
      expect(profileManager.isProfileActive('!prod')).toBe(true); // prod is NOT active
      expect(profileManager.isProfileActive('!dev')).toBe(false); // dev IS active
    });

    it('should determine if service should be loaded based on profiles', () => {
      profileManager.setActiveProfiles(['dev', 'test']);
      
      // Service with matching profile
      expect(profileManager.shouldLoadService(['dev'])).toBe(true);
      expect(profileManager.shouldLoadService(['test', 'prod'])).toBe(true); // test matches
      
      // Service with no matching profiles
      expect(profileManager.shouldLoadService(['prod'])).toBe(false);
      expect(profileManager.shouldLoadService(['staging', 'prod'])).toBe(false);
      
      // Service with no profiles (always loaded)
      expect(profileManager.shouldLoadService([])).toBe(true);
      expect(profileManager.shouldLoadService(undefined)).toBe(true);
    });

    it('should handle bean profile inheritance correctly', () => {
      profileManager.setActiveProfiles(['dev']);
      
      // Bean with specific profiles overrides config profiles
      expect(profileManager.shouldLoadBean(['prod'], ['dev'])).toBe(true); // Bean profile wins
      expect(profileManager.shouldLoadBean(['prod'], ['staging'])).toBe(false); // Bean profile wins
      
      // Bean without profiles inherits config profiles
      expect(profileManager.shouldLoadBean(['dev'], undefined)).toBe(true); // Config profile used
      expect(profileManager.shouldLoadBean(['prod'], undefined)).toBe(false); // Config profile used
      
      // Bean with empty profiles inherits config profiles
      expect(profileManager.shouldLoadBean(['dev'], [])).toBe(true); // Config profile used
    });

    it('should validate profile expressions', () => {
      expect(profileManager.validateProfileExpression('dev')).toEqual({ isValid: true });
      expect(profileManager.validateProfileExpression('!prod')).toEqual({ isValid: true });
      expect(profileManager.validateProfileExpression('dev-staging')).toEqual({ isValid: true });
      expect(profileManager.validateProfileExpression('dev_test')).toEqual({ isValid: true });
      
      expect(profileManager.validateProfileExpression('').isValid).toBe(false);
      expect(profileManager.validateProfileExpression('!').isValid).toBe(false);
      expect(profileManager.validateProfileExpression('dev@prod').isValid).toBe(false);
    });

    it('should filter services by profiles', () => {
      profileManager.setActiveProfiles(['dev']);
      
      const services = [
        { name: 'service1', profiles: ['dev'] },
        { name: 'service2', profiles: ['prod'] },
        { name: 'service3', profiles: ['dev', 'test'] },
        { name: 'service4' }, // No profiles
      ];
      
      const filtered = profileManager.filterServicesByProfiles(services);
      
      expect(filtered).toHaveLength(3); // service1, service3, service4
      expect(filtered.find(s => s.name === 'service1')).toBeDefined();
      expect(filtered.find(s => s.name === 'service3')).toBeDefined();
      expect(filtered.find(s => s.name === 'service4')).toBeDefined();
      expect(filtered.find(s => s.name === 'service2')).toBeUndefined();
    });
  });

  describe('Container Profile Integration', () => {
    it('should set and get active profiles through container', () => {
      container.setActiveProfiles(['dev', 'test']);
      const activeProfiles = container.getActiveProfiles();
      expect(activeProfiles).toEqual(['dev', 'test']);
      
      expect(container.isProfileActive('dev')).toBe(true);
      expect(container.isProfileActive('prod')).toBe(false);
    });

    it('should initialize container with active profiles', () => {
      const containerWithProfiles = new CompileTimeDIContainer(undefined, {
        activeProfiles: ['dev', 'test'],
        verbose: false
      });
      
      expect(containerWithProfiles.getActiveProfiles()).toEqual(['dev', 'test']);
    });

    it('should filter services during loadConfiguration', () => {
      container.setActiveProfiles(['dev']);
      
      const mockDIMap: DIMap = {
        'DevService': {
          factory: () => () => ({ type: 'dev' }),
          scope: 'singleton',
          dependencies: [],
          interfaceName: 'TestServiceInterface',
          implementationClass: 'DevService',
          isAutoResolved: true,
          profiles: ['dev']
        },
        'ProdService': {
          factory: () => () => ({ type: 'prod' }),
          scope: 'singleton',
          dependencies: [],
          interfaceName: 'TestServiceInterface',
          implementationClass: 'ProdService',
          isAutoResolved: true,
          profiles: ['prod']
        },
        'UniversalService': {
          factory: () => () => ({ type: 'universal' }),
          scope: 'singleton',
          dependencies: [],
          interfaceName: 'UniversalServiceInterface',
          implementationClass: 'UniversalService',
          isAutoResolved: true
          // No profiles - should always load
        }
      };
      
      container.loadConfiguration(mockDIMap);
      
      // Only DevService and UniversalService should be registered
      expect(container.has('DevService')).toBe(true);
      expect(container.has('UniversalService')).toBe(true);
      expect(container.has('ProdService')).toBe(false);
    });

    it('should filter configurations during loadContainerConfiguration', () => {
      const mockConfig: ContainerConfiguration = {
        profiles: ['dev'], // Set active profiles in config
        diMap: {
          'DevService': {
            factory: () => () => ({ type: 'dev' }),
            scope: 'singleton',
            dependencies: [],
            interfaceName: 'TestServiceInterface',
            implementationClass: 'DevService',
            isAutoResolved: true,
            profiles: ['dev']
          }
        },
        interfaceMapping: {},
        configurations: [
          {
            className: 'DevConfig',
            filePath: '/test/DevConfig.ts',
            profiles: ['dev'],
            priority: 0,
            beans: []
          },
          {
            className: 'ProdConfig',
            filePath: '/test/ProdConfig.ts',
            profiles: ['prod'],
            priority: 0,
            beans: []
          }
        ]
      };
      
      container.loadContainerConfiguration(mockConfig);
      
      // Should have loaded dev configuration and set active profiles
      expect(container.getActiveProfiles()).toEqual(['dev']);
      expect(container.has('DevService')).toBe(true);
    });

    it('should handle configuration class profile inheritance', () => {
      const mockConfigurations: ConfigurationMetadata[] = [
        {
          className: 'ExternalLibConfig',
          filePath: '/test/ExternalLibConfig.ts',
          profiles: ['external-libs'],
          priority: 0,
          beans: [
            {
              methodName: 'httpClient',
              returnType: 'HttpClientInterface',
              parameters: [],
              scope: 'singleton',
              primary: true,
              autoResolve: true
              // No bean-specific profiles - inherits from config
            },
            {
              methodName: 'prodDatabase',
              returnType: 'DatabaseInterface',
              parameters: [],
              scope: 'singleton',
              primary: false,
              autoResolve: true,
              profiles: ['prod'] // Bean-specific profiles override config
            }
          ]
        }
      ];
      
      container.setActiveProfiles(['external-libs']);
      // This would be called by loadConfigurationClasses, but testing the logic
      
      const config = mockConfigurations[0];
      const httpClientBean = config.beans[0];
      const prodDatabaseBean = config.beans[1];
      
      // Test would be done through actual configuration loading in real scenario
      // For now just verify the ProfileManager logic works correctly
      const pm = new ProfileManager();
      pm.setActiveProfiles(['external-libs']);
      
      // HttpClient should be loaded (inherits external-libs profile from config)
      expect(pm.shouldLoadBean(config.profiles, httpClientBean.profiles)).toBe(true);
      
      // ProdDatabase should not be loaded (has prod profile, but only external-libs is active)
      expect(pm.shouldLoadBean(config.profiles, prodDatabaseBean.profiles)).toBe(false);
    });
  });

  describe('Bean Profile Inheritance', () => {
    it('should handle bean method profile override', () => {
      const configMetadata: ConfigurationMetadata = {
        className: 'TestConfig',
        filePath: '/test/TestConfig.ts',
        profiles: ['config-profile'],
        priority: 0,
        beans: [
          {
            methodName: 'serviceWithConfigProfile',
            returnType: 'ServiceInterface',
            parameters: [],
            scope: 'singleton',
            primary: false,
            autoResolve: true
            // No profiles - inherits config profile
          },
          {
            methodName: 'serviceWithBeanProfile',
            returnType: 'ServiceInterface',
            parameters: [],
            scope: 'singleton',
            primary: false,
            autoResolve: true,
            profiles: ['bean-profile'] // Overrides config profile
          }
        ]
      };

      profileManager.setActiveProfiles(['config-profile']);
      
      // First bean should load (inherits config profile)
      expect(profileManager.shouldLoadBean(
        configMetadata.profiles,
        configMetadata.beans[0].profiles
      )).toBe(true);
      
      // Second bean should not load (bean profile doesn't match active)
      expect(profileManager.shouldLoadBean(
        configMetadata.profiles,
        configMetadata.beans[1].profiles
      )).toBe(false);
      
      // Change active profiles to include bean profile
      profileManager.setActiveProfiles(['bean-profile']);
      
      // Now second bean should load
      expect(profileManager.shouldLoadBean(
        configMetadata.profiles,
        configMetadata.beans[1].profiles
      )).toBe(true);
      
      // First bean should not load (config profile not active)
      expect(profileManager.shouldLoadBean(
        configMetadata.profiles,
        configMetadata.beans[0].profiles
      )).toBe(false);
    });
  });

  describe('Environment Integration', () => {
    it('should initialize profiles from environment variables', () => {
      // Mock environment variables
      const originalEnv = process.env.TDI2_PROFILES;
      process.env.TDI2_PROFILES = 'dev,test,debug';
      
      const envProfileManager = new ProfileManager({ verbose: false });
      const profiles = envProfileManager.getActiveProfiles();
      
      expect(profiles).toContain('dev');
      expect(profiles).toContain('test');
      expect(profiles).toContain('debug');
      
      // Restore environment
      if (originalEnv !== undefined) {
        process.env.TDI2_PROFILES = originalEnv;
      } else {
        delete process.env.TDI2_PROFILES;
      }
    });

    it('should provide debug information', () => {
      profileManager.setActiveProfiles(['dev', 'test']);
      
      const debugInfo = profileManager.getDebugInfo();
      
      expect(debugInfo.activeProfiles).toEqual(['dev', 'test']);
      expect(debugInfo.defaultProfiles).toEqual(['default']);
      expect(debugInfo.hasEnvironmentProfiles).toBeDefined();
      expect(debugInfo.environmentSource).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty and invalid profiles gracefully', () => {
      profileManager.setActiveProfiles(['', '  ', 'valid']);
      const activeProfiles = profileManager.getActiveProfiles();
      
      expect(activeProfiles).toEqual(['valid']);
    });

    it('should handle profile reset', () => {
      profileManager.setActiveProfiles(['dev', 'test']);
      expect(profileManager.getActiveProfiles()).toEqual(['dev', 'test']);
      
      profileManager.reset();
      expect(profileManager.getActiveProfiles()).toEqual(['default']);
    });

    it('should provide meaningful profile match reasons', () => {
      profileManager.setActiveProfiles(['dev']);
      
      const matchReason = profileManager.getProfileMatchReason(['dev', 'test']);
      expect(matchReason).toContain('Matches active profiles: dev');
      
      const noMatchReason = profileManager.getProfileMatchReason(['prod']);
      expect(noMatchReason).toContain('No matching profiles');
    });

    it('should handle services with no profiles when default profile is active', () => {
      const defaultProfileManager = new ProfileManager({ verbose: false });
      // Should have 'default' profile active by default
      
      expect(defaultProfileManager.shouldLoadService(undefined)).toBe(true);
      expect(defaultProfileManager.shouldLoadService([])).toBe(true);
      expect(defaultProfileManager.shouldLoadService(['specific-profile'])).toBe(false);
    });
  });

  describe('Spring Boot Compatibility', () => {
    it('should support multiple profiles like Spring Boot', () => {
      profileManager.setActiveProfiles(['dev', 'external-services', 'debug']);
      
      // Service matches any active profile
      expect(profileManager.shouldLoadService(['dev', 'prod'])).toBe(true);
      expect(profileManager.shouldLoadService(['external-services'])).toBe(true);
      expect(profileManager.shouldLoadService(['prod', 'staging'])).toBe(false);
    });

    it('should support profile negation like Spring Boot', () => {
      profileManager.setActiveProfiles(['dev']);
      
      expect(profileManager.isProfileActive('!prod')).toBe(true);
      expect(profileManager.isProfileActive('!test')).toBe(true);
      expect(profileManager.isProfileActive('!dev')).toBe(false);
      
      expect(profileManager.shouldLoadService(['!prod'])).toBe(true);
      expect(profileManager.shouldLoadService(['!dev'])).toBe(false);
    });

    it('should handle default profile behavior like Spring Boot', () => {
      const emptyProfileManager = new ProfileManager({ verbose: false });
      
      // When no profiles are explicitly set, should use default
      expect(emptyProfileManager.getActiveProfiles()).toEqual(['default']);
      expect(emptyProfileManager.shouldLoadService(['default'])).toBe(true);
      expect(emptyProfileManager.shouldLoadService(['dev'])).toBe(false);
    });
  });
});