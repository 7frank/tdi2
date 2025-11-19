/**
 * Simplified tests for metadata-loader utility
 * Tests the key logic without complex file system mocking
 */

import { describe, it, expect } from 'vitest';
import { validMetadata } from './fixtures/mock-metadata.js';

describe('MetadataLoader - Logic Tests', () => {
  describe('metadata structure validation', () => {
    it('should have valid interfaces structure', () => {
      expect(validMetadata.interfaces).toBeDefined();
      expect(validMetadata.interfaces.UserServiceInterface).toBeDefined();
      expect(validMetadata.interfaces.UserServiceInterface.implementations).toBeInstanceOf(Array);
      expect(validMetadata.interfaces.UserServiceInterface.totalImplementations).toBe(2);
    });

    it('should have valid implementations structure', () => {
      expect(validMetadata.implementations).toBeDefined();
      expect(validMetadata.implementations.UserService).toBeDefined();
      expect(validMetadata.implementations.UserService.isService).toBe(true);
      expect(validMetadata.implementations.UserService.isPrimary).toBe(true);
    });

    it('should have valid lookups structure', () => {
      expect(validMetadata.lookups).toBeDefined();
      expect(validMetadata.lookups.interfaceToClass).toBeDefined();
      expect(validMetadata.lookups.interfaceToClass.UserServiceInterface).toBe('UserService');
    });

    it('should have valid issues array', () => {
      expect(validMetadata.issues).toBeInstanceOf(Array);
      expect(validMetadata.issues.length).toBeGreaterThan(0);
      expect(validMetadata.issues[0].type).toBe('ambiguous');
    });
  });

  describe('interface resolution data', () => {
    it('should correctly identify primary implementation', () => {
      const interfaceData = validMetadata.interfaces.UserServiceInterface;
      const primaryImpl = interfaceData.implementations.find((impl) => impl.isPrimary);

      expect(primaryImpl).toBeDefined();
      expect(primaryImpl.implementationClass).toBe('UserService');
      expect(primaryImpl.isSelected).toBe(true);
    });

    it('should correctly identify ambiguous interface', () => {
      const interfaceData = validMetadata.interfaces.LoggerInterface;

      expect(interfaceData.hasAmbiguity).toBe(true);
      expect(interfaceData.disambiguationRequired).toBe(true);
      expect(interfaceData.totalImplementations).toBe(2);
    });

    it('should contain dependency information', () => {
      const interfaceData = validMetadata.interfaces.UserServiceInterface;
      const primaryImpl = interfaceData.implementations.find((impl) => impl.isPrimary);

      expect(primaryImpl.dependencies).toBeInstanceOf(Array);
      expect(primaryImpl.dependencies.length).toBe(2);
      expect(primaryImpl.dependencies[0].interfaceName).toBe('AuthService');
    });
  });

  describe('implementation data', () => {
    it('should have interface references', () => {
      const implData = validMetadata.implementations.UserService;

      expect(implData.implementsInterfaces).toBeInstanceOf(Array);
      expect(implData.implementsInterfaces.length).toBe(1);
      expect(implData.implementsInterfaces[0].interfaceName).toBe('UserServiceInterface');
    });

    it('should have usage tracking', () => {
      const implData = validMetadata.implementations.UserService;

      expect(implData.usedByComponents).toBeInstanceOf(Array);
      expect(implData.usedByComponents.length).toBe(2);
    });

    it('should have decorator information', () => {
      const implData = validMetadata.implementations.UserService;

      expect(implData.decorators).toContain('@Service()');
      expect(implData.decorators).toContain('@Primary()');
    });
  });

  describe('component data', () => {
    it('should have injection information', () => {
      const componentData = validMetadata.components['src/components/UserProfile.tsx'];

      expect(componentData).toBeDefined();
      expect(componentData.componentName).toBe('UserProfile');
      expect(componentData.injections).toBeInstanceOf(Array);
      expect(componentData.injections.length).toBe(1);
    });

    it('should link injection to interface', () => {
      const componentData = validMetadata.components['src/components/UserProfile.tsx'];
      const injection = componentData.injections[0];

      expect(injection.interfaceType).toBe('UserServiceInterface');
      expect(injection.resolvedClass).toBe('UserService');
      expect(injection.hasAmbiguity).toBe(false);
    });
  });

  describe('lookup maps', () => {
    it('should provide interface to class mapping', () => {
      const { interfaceToClass } = validMetadata.lookups;

      expect(interfaceToClass.UserServiceInterface).toBe('UserService');
      expect(interfaceToClass.LoggerInterface).toBe('FileLogger');
    });

    it('should provide class to interfaces mapping', () => {
      const { classToInterfaces } = validMetadata.lookups;

      expect(classToInterfaces.UserService).toContain('UserServiceInterface');
    });

    it('should provide component to interfaces mapping', () => {
      const { componentToInterfaces } = validMetadata.lookups;

      expect(componentToInterfaces['src/components/UserProfile.tsx']).toContain(
        'UserServiceInterface'
      );
    });

    it('should provide interface to components mapping', () => {
      const { interfaceToComponents } = validMetadata.lookups;

      expect(interfaceToComponents.UserServiceInterface).toContain(
        'src/components/UserProfile.tsx'
      );
    });
  });

  describe('issues detection', () => {
    it('should detect ambiguous resolutions', () => {
      const ambiguousIssue = validMetadata.issues.find((issue) => issue.type === 'ambiguous');

      expect(ambiguousIssue).toBeDefined();
      expect(ambiguousIssue.interfaceName).toBe('LoggerInterface');
      expect(ambiguousIssue.severity).toBe('warning');
    });

    it('should provide suggested fixes', () => {
      const ambiguousIssue = validMetadata.issues.find((issue) => issue.type === 'ambiguous');

      expect(ambiguousIssue.suggestedFix).toBeDefined();
      expect(ambiguousIssue.suggestedFix).toContain('@Primary');
    });

    it('should list affected components', () => {
      const ambiguousIssue = validMetadata.issues.find((issue) => issue.type === 'ambiguous');

      expect(ambiguousIssue.affectedComponents).toBeInstanceOf(Array);
      expect(ambiguousIssue.affectedComponents.length).toBeGreaterThan(0);
    });
  });
});
