import { describe, it, expect, vi, beforeEach } from 'vitest';
import { diEnhancedPlugin } from '../plugin';
import { getDIPluginDefaults, validateDIPluginOptions, detectDIPatterns } from '../utils';
import type { DIPluginOptions } from '../types';

describe('diEnhancedPlugin', () => {
  it('should create a plugin with the correct name', () => {
    const plugin = diEnhancedPlugin();
    expect(plugin.name).toBe('vite-plugin-di-enhanced');
  });

  it('should use default options when none provided', () => {
    const plugin = diEnhancedPlugin();
    expect(plugin).toBeDefined();
  });

  it('should merge user options with defaults', () => {
    const userOptions: DIPluginOptions = {
      scanDirs: ['./custom-src'],
    };

    const plugin = diEnhancedPlugin(userOptions);
    expect(plugin).toBeDefined();
  });
});

describe('getDIPluginDefaults', () => {
  it('should return correct default options', () => {
    const defaults = getDIPluginDefaults({});

    expect(defaults.scanDirs).toEqual(['./src']);
    expect(defaults.outputDir).toBe('./src/generated');
    expect(defaults.watch).toBe(true);
    expect(defaults.enableFunctionalDI).toBe(true);
    expect(defaults.enableInterfaceResolution).toBe(true);
    expect(defaults.reuseExistingConfig).toBe(true);
  });

  it('should merge user options with defaults', () => {
    const userOptions: DIPluginOptions = {
      scanDirs: ['./custom-src'],
      keepConfigCount: 5,
    };

    const merged = getDIPluginDefaults(userOptions);

    expect(merged.scanDirs).toEqual(['./custom-src']);
    expect(merged.keepConfigCount).toBe(5);
    expect(merged.watch).toBe(true); // Should keep default
  });

  it('should merge advanced options correctly', () => {
    const userOptions: DIPluginOptions = {
      advanced: {
        performance: {
          parallel: false,
        },
      },
    };
    
    const merged = getDIPluginDefaults(userOptions);
    
    expect(merged.advanced.performance.parallel).toBe(false);
    expect(merged.advanced.performance.maxConcurrency).toBe(10); // Should keep default
    expect(merged.advanced.fileExtensions).toEqual(['.ts', '.tsx']); // Should keep default
  });
});

describe('validateDIPluginOptions', () => {
  it('should pass validation for valid options', () => {
    const validOptions = getDIPluginDefaults({});
    expect(() => validateDIPluginOptions(validOptions)).not.toThrow();
  });

  it('should throw for invalid scanDirs', () => {
    const invalidOptions = getDIPluginDefaults({ scanDirs: [] });
    expect(() => validateDIPluginOptions(invalidOptions)).toThrow('scanDirs cannot be empty');
  });

  it('should throw for invalid outputDir', () => {
    const invalidOptions = getDIPluginDefaults({ outputDir: '' });
    expect(() => validateDIPluginOptions(invalidOptions)).toThrow('outputDir must be a non-empty string');
  });

  it('should throw for invalid keepConfigCount', () => {
    const invalidOptions = getDIPluginDefaults({ keepConfigCount: 0 });
    expect(() => validateDIPluginOptions(invalidOptions)).toThrow('keepConfigCount must be at least 1');
  });

  it('should throw for invalid maxConcurrency', () => {
    const invalidOptions = getDIPluginDefaults({
      advanced: {
        performance: {
          maxConcurrency: 0,
        },
      },
    });
    expect(() => validateDIPluginOptions(invalidOptions)).toThrow('maxConcurrency must be at least 1');
  });
});

describe('detectDIPatterns', () => {
  const options = getDIPluginDefaults({});

  it('should detect @Service decorator', () => {
    const content = `
      @Service()
      export class MyService {}
    `;
    
    const result = detectDIPatterns(content, options);
    expect(result.hasDI).toBe(true);
    expect(result.patterns).toContain('@Service');
  });

  it('should detect @Inject decorator', () => {
    const content = `
      constructor(@Inject() private service: MyService) {}
    `;
    
    const result = detectDIPatterns(content, options);
    expect(result.hasDI).toBe(true);
    expect(result.patterns).toContain('@Inject');
  });

  it('should detect Inject<T> markers', () => {
    const content = `
      interface Props {
        services: {
          api: Inject<ApiService>;
        };
      }
    `;
    
    const result = detectDIPatterns(content, options);
    expect(result.hasDI).toBe(true);
    expect(result.patterns).toContain('Inject<T>');
  });

  it('should detect InjectOptional<T> markers', () => {
    const content = `
      interface Props {
        services: {
          logger?: InjectOptional<LoggerService>;
        };
      }
    `;
    
    const result = detectDIPatterns(content, options);
    expect(result.hasDI).toBe(true);
    expect(result.patterns).toContain('Inject<T>');
  });

  it('should detect @Autowired decorator', () => {
    const content = `
      constructor(@Autowired private service: MyService) {}
    `;
    
    const result = detectDIPatterns(content, options);
    expect(result.hasDI).toBe(true);
    expect(result.patterns).toContain('@Autowired');
  });

  it('should detect interface implementations', () => {
    const content = `
      export class MyService implements MyServiceInterface {
        // implementation
      }
    `;
    
    const result = detectDIPatterns(content, options);
    expect(result.hasDI).toBe(true);
    expect(result.patterns).toContain('Interface implementation');
  });

  it('should return false for files without DI patterns', () => {
    const content = `
      export class RegularClass {
        constructor(private value: string) {}
      }
    `;
    
    const result = detectDIPatterns(content, options);
    expect(result.hasDI).toBe(false);
    expect(result.patterns).toHaveLength(0);
  });

  it('should detect multiple patterns in one file', () => {
    const content = `
      @Service()
      export class MyService implements MyServiceInterface {
        constructor(@Inject() private logger: LoggerService) {}
      }
    `;
    
    const result = detectDIPatterns(content, options);
    expect(result.hasDI).toBe(true);
    expect(result.patterns).toContain('@Service');
    expect(result.patterns).toContain('@Inject');
    expect(result.patterns).toContain('Interface implementation');
  });
});

describe('Performance Tracker', () => {
  it('should track transformation time', () => {
    // This would require importing the performance tracker utility
    // and testing its timing functionality
    expect(true).toBe(true); // Placeholder
  });

  it('should track cache hits and misses', () => {
    // This would test the cache tracking functionality
    expect(true).toBe(true); // Placeholder
  });
});