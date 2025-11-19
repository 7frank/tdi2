/**
 * Integration tests for ESLint plugin
 */

import { describe, it, expect } from 'vitest';
import plugin from '../src/index.js';

describe('ESLint Plugin TDI2', () => {
  it('should export rules object', () => {
    expect(plugin.rules).toBeDefined();
    expect(typeof plugin.rules).toBe('object');
  });

  it('should export show-interface-resolution rule', () => {
    expect(plugin.rules['show-interface-resolution']).toBeDefined();
    expect(plugin.rules['show-interface-resolution'].meta).toBeDefined();
    expect(plugin.rules['show-interface-resolution'].create).toBeDefined();
  });

  it('should export show-implementation-context rule', () => {
    expect(plugin.rules['show-implementation-context']).toBeDefined();
    expect(plugin.rules['show-implementation-context'].meta).toBeDefined();
    expect(plugin.rules['show-implementation-context'].create).toBeDefined();
  });

  it('should export show-interface-implementations rule', () => {
    expect(plugin.rules['show-interface-implementations']).toBeDefined();
    expect(plugin.rules['show-interface-implementations'].meta).toBeDefined();
    expect(plugin.rules['show-interface-implementations'].create).toBeDefined();
  });

  it('should export configs', () => {
    expect(plugin.configs).toBeDefined();
    expect(plugin.configs.recommended).toBeDefined();
    expect(plugin.configs.strict).toBeDefined();
  });

  describe('recommended config', () => {
    it('should include all three rules', () => {
      const { recommended } = plugin.configs;

      expect(recommended.plugins).toContain('tdi2');
      expect(recommended.rules['tdi2/show-interface-resolution']).toBe('warn');
      expect(recommended.rules['tdi2/show-implementation-context']).toBe('warn');
      expect(recommended.rules['tdi2/show-interface-implementations']).toBe('warn');
    });
  });

  describe('strict config', () => {
    it('should include all three rules with options', () => {
      const { strict } = plugin.configs;

      expect(strict.plugins).toContain('tdi2');
      expect(strict.rules['tdi2/show-interface-resolution']).toEqual([
        'warn',
        {
          showDependencies: true,
          showScope: true,
          showFilePath: true,
          showOtherImplementations: true,
          warnOnAmbiguous: true,
        },
      ]);
    });
  });

  describe('rule metadata', () => {
    it('show-interface-resolution should have correct metadata', () => {
      const rule = plugin.rules['show-interface-resolution'];

      expect(rule.meta.type).toBe('suggestion');
      expect(rule.meta.docs?.description).toContain('Inject<>');
      expect(rule.meta.messages.configNotFound).toBeDefined();
      expect(rule.meta.messages.interfaceResolved).toBeDefined();
      expect(rule.meta.messages.interfaceAmbiguous).toBeDefined();
      expect(rule.meta.schema).toBeDefined();
      expect(rule.meta.schema).toHaveLength(1);
    });

    it('show-implementation-context should have correct metadata', () => {
      const rule = plugin.rules['show-implementation-context'];

      expect(rule.meta.type).toBe('suggestion');
      expect(rule.meta.docs?.description).toContain('@Service()');
      expect(rule.meta.messages.implementationContext).toBeDefined();
      expect(rule.meta.schema).toBeDefined();
    });

    it('show-interface-implementations should have correct metadata', () => {
      const rule = plugin.rules['show-interface-implementations'];

      expect(rule.meta.type).toBe('suggestion');
      expect(rule.meta.docs?.description).toContain('implementations');
      expect(rule.meta.messages.interfaceImplementations).toBeDefined();
      expect(rule.meta.schema).toBeDefined();
    });
  });

  describe('rule schemas', () => {
    it('show-interface-resolution should accept valid options', () => {
      const rule = plugin.rules['show-interface-resolution'];
      const schema = rule.meta.schema![0] as any;

      expect(schema.type).toBe('object');
      expect(schema.properties.showDependencies).toBeDefined();
      expect(schema.properties.showScope).toBeDefined();
      expect(schema.properties.showFilePath).toBeDefined();
      expect(schema.properties.showOtherImplementations).toBeDefined();
      expect(schema.properties.warnOnAmbiguous).toBeDefined();
    });

    it('show-implementation-context should accept valid options', () => {
      const rule = plugin.rules['show-implementation-context'];
      const schema = rule.meta.schema![0] as any;

      expect(schema.type).toBe('object');
      expect(schema.properties.showUsageStats).toBeDefined();
      expect(schema.properties.showDependencies).toBeDefined();
      expect(schema.properties.showOtherImplementations).toBeDefined();
    });

    it('show-interface-implementations should accept valid options', () => {
      const rule = plugin.rules['show-interface-implementations'];
      const schema = rule.meta.schema![0] as any;

      expect(schema.type).toBe('object');
      expect(schema.properties.showUsageStats).toBeDefined();
      expect(schema.properties.showProfiles).toBeDefined();
      expect(schema.properties.warnOnAmbiguity).toBeDefined();
    });
  });
});
