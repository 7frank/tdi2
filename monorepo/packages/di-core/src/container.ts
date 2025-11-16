// src/di/container.ts - FIXED to properly load all services

import type {
  DIContainer,
  ServiceFactory,
  DIMap,
  ComponentLifecycleOptions,
  OnInit,
  OnDestroy,
  OnMount,
  OnUnmount,
  ConfigurationMetadata,
  ContainerConfiguration
} from './types';

import { ProfileManager } from './profile-manager';
import { consoleFor } from '../tools/logger';

const console = consoleFor('di-core:container');

export interface DIContainerOptions {
  activeProfiles?: string[];
}

export class CompileTimeDIContainer implements DIContainer {
  private services = new Map<string | symbol, any>();
  private instances = new Map<string | symbol, any>();
  private factories = new Map<string | symbol, ServiceFactory<any>>();
  private scopes = new Map<
    string | symbol,
    "singleton" | "transient" | "scoped"
  >();
  private destructionCallbacks = new Map<string | symbol, (() => void | Promise<void>)[]>();
  private configurations = new Map<string, ConfigurationMetadata>();
  private configurationInstances = new Map<string, any>(); // Configuration class instances
  private profileManager: ProfileManager;
  private parent?: DIContainer;

  constructor(parent?: DIContainer, options: DIContainerOptions = {}) {
    this.parent = parent;

    this.profileManager = new ProfileManager();

    // Set initial active profiles if provided
    if (options.activeProfiles) {
      this.profileManager.setActiveProfiles(options.activeProfiles);
    }
  }

  register<T>(
    token: string | symbol,
    implementation: any, // This will be a factory function generated at compile time
    scope: "singleton" | "transient" | "scoped" = "singleton"
  ): void {
    const tokenKey = this.getTokenKey(token);

    if (typeof implementation === "function") {
      // Check if it's a factory function (returns another function) or a constructor
      try {
        const result = implementation(this);
        if (typeof result === "function") {
          // It's a factory function
          this.factories.set(tokenKey, result);
        } else {
          // It's a constructor or direct instance
          this.services.set(tokenKey, implementation);
        }
      } catch (e) {
        // Fallback to treating as constructor
        this.services.set(tokenKey, implementation);
      }
    } else {
      // Direct instance
      this.instances.set(tokenKey, implementation);
    }

    this.scopes.set(tokenKey, scope);
  }

  resolve<T>(token: string | symbol): T {
    const tokenKey = this.getTokenKey(token);
    // Check local scope first, then parent scope
    const scope = this.scopes.get(tokenKey) || this.parent?.getScope(token) || "singleton";

    // Handle different scopes
    switch (scope) {
      case "singleton":
        // Check if already instantiated for singletons
        if (this.instances.has(tokenKey)) {
          return this.instances.get(tokenKey);
        }
        // Check parent container for singleton instances
        if (this.parent && this.parent.has(token)) {
          const parentInstance = this.parent.resolve<T>(token);
          // Cache the parent's singleton instance locally for faster access
          this.instances.set(tokenKey, parentInstance);
          return parentInstance;
        }
        break;

      case "transient":
        // Always create new instance for transient scope
        return this.createInstanceSync<T>(token);
    }

    // Check if service exists locally or in parent
    if (!this.hasLocalService(token) && this.parent) {
      // For singletons, always delegate to parent
      return this.parent.resolve(token);
    }

    // Create new instance
    const instance = this.createInstanceSync<T>(token);

    // Store instances only for singleton scope
    if (scope === "singleton") {
      this.instances.set(tokenKey, instance);
    }
    // Transient instances are never stored

    return instance;
  }

  // Create instance synchronously for backward compatibility
  private createInstanceSync<T>(token: string | symbol): T {
    const tokenKey = this.getTokenKey(token);
    let instance: T;

    if (this.factories.has(tokenKey)) {
      // Use generated factory
      const factory = this.factories.get(tokenKey)!;
      instance = factory();
    } else if (this.services.has(tokenKey)) {
      // Use constructor
      const constructor = this.services.get(tokenKey);
      if (typeof constructor === "function") {
        instance = new constructor();
      } else {
        instance = constructor;
      }
    } else if (this.parent && this.parent.has(token)) {
      // Service is defined in parent - get the factory/service and create instance
      if (this.parent.hasFactory(token)) {
        const factory = this.parent.getFactory(token);
        instance = factory();
      } else if (this.parent.hasService(token)) {
        const constructor = this.parent.getService(token);
        if (typeof constructor === "function") {
          instance = new constructor();
        } else {
          instance = constructor;
        }
      } else {
        // Fallback to parent resolve (shouldn't happen but for safety)
        instance = this.parent.resolve<T>(token);
      }
    } else {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    // Execute OnInit lifecycle hook synchronously (for non-async methods)
    this.executeOnInitLifecycleSync(instance);

    return instance;
  }

  has(token: string | symbol): boolean {
    const tokenKey = this.getTokenKey(token);
    return (
      this.factories.has(tokenKey) ||
      this.services.has(tokenKey) ||
      this.instances.has(tokenKey) ||
      (this.parent?.has(token) ?? false)
    );
  }

  // Check if service is registered locally (not including parent)
  hasLocalService(token: string | symbol): boolean {
    const tokenKey = this.getTokenKey(token);
    return (
      this.factories.has(tokenKey) ||
      this.services.has(tokenKey) ||
      this.instances.has(tokenKey)
    );
  }

  createScope(): DIContainer {
    return new CompileTimeDIContainer(this);
  }

  // FIXED: Enhanced loadConfiguration method with better logging and profile filtering
  loadConfiguration(diMap: DIMap): void {
    console.info("🔧 Loading DI configuration...");
    console.debug("📋 DI_CONFIG keys:", Object.keys(diMap));

    let loaded = 0;
    let skipped = 0;

    for (const [token, config] of Object.entries(diMap)) {
      try {
        if (!config.factory) {
          console.warn(`⚠️  No factory found for token: ${token}`);
          continue;
        }

        // NEW: Check if service should be loaded based on profiles
        if (!this.profileManager.shouldLoadService(config.profiles)) {
          if (this.verbose && this.profileManager.getActiveProfiles().length > 0) {
            console.log(
              `⏭️  Skipping ${token} - Profile mismatch: ${this.profileManager.getProfileMatchReason(config.profiles)}`
            );
          }
          skipped++;
          continue;
        }

        console.debug(
          `🔗 Registering: ${token} -> ${
            config.implementationClass || "unknown"
          }${config.profiles ? ` [profiles: ${config.profiles.join(', ')}]` : ''}`
        );

        // @ts-ignore factory interface wrong?
        // FIXME
        const factory = config.factory(this);
        this.factories.set(token, factory);
        this.scopes.set(token, config.scope);
        loaded++;
      } catch (error) {
        console.error(`❌ Failed to register ${token}:`, error);
        // Continue with other services
      }
    }

    if (this.verbose || skipped > 0) {
      console.log(`✅ DI configuration loaded: ${loaded} services registered, ${skipped} skipped by profiles`);
    }
  }

  // NEW: Enhanced loadConfiguration method that supports full ContainerConfiguration
  loadContainerConfiguration(config: ContainerConfiguration): void {
    console.info("🔧 Loading full container configuration...");
    
    // Set active profiles from configuration if provided
    if (config.profiles && config.profiles.length > 0) {
      this.setActiveProfiles(config.profiles);
    }
    
    // Load regular services and beans from DIMap
    this.loadConfiguration(config.diMap);
    
    // Load configuration classes
    this.loadConfigurationClasses(config.configurations);

    console.info("✅ Full container configuration loaded");
  }

  // NEW: Load configuration classes with @Bean methods (with profile filtering)
  private loadConfigurationClasses(configurations: ConfigurationMetadata[]): void {
    console.info("🏗️  Loading configuration classes...");
    
    // Sort configurations by priority (higher priority first)
    const sortedConfigs = configurations.sort((a, b) => b.priority - a.priority);
    
    let loaded = 0;
    let skipped = 0;

    for (const config of sortedConfigs) {
      try {
        // NEW: Check if configuration should be loaded based on profiles
        if (!this.profileManager.shouldLoadConfiguration(config.profiles)) {
          console.debug(
            `⏭️  Skipping configuration ${config.className} - Profile mismatch: ${this.profileManager.getProfileMatchReason(config.profiles)}`
          );
          skipped++;
          continue;
        }

        console.debug(`📦 Loading configuration: ${config.className}${config.profiles?.length ? ` [profiles: ${config.profiles.join(', ')}]` : ''}`);
        
        // Store configuration metadata
        this.configurations.set(config.className, config);
        
        // Create configuration instance (will be created when first bean is requested)
        // This is lazy loading - the configuration instance is created when needed

        console.debug(`✅ Configuration ${config.className} registered with ${config.beans.length} beans`);
        loaded++;
      } catch (error) {
        console.error(`❌ Failed to load configuration ${config.className}:`, error);
      }
    }

    if (this.verbose || skipped > 0) {
      console.log(`🏗️  Configuration loading complete: ${loaded} loaded, ${skipped} skipped by profiles`);
    }
  }

  // NEW: Get or create configuration instance
  private getConfigurationInstance(className: string): any {
    if (this.configurationInstances.has(className)) {
      return this.configurationInstances.get(className);
    }

    // This will be called by the generated factory functions
    // The transformer will generate code that creates configuration instances
    throw new Error(`Configuration instance not found: ${className}. This should be created by the transformer.`);
  }

  // NEW: Register configuration instance (called by generated code)
  registerConfigurationInstance(className: string, instance: any): void {
    this.configurationInstances.set(className, instance);
  }

  // NEW: Profile management methods
  setActiveProfiles(profiles: string[]): void {
    this.profileManager.setActiveProfiles(profiles);
  }

  addActiveProfiles(profiles: string[]): void {
    this.profileManager.addActiveProfiles(profiles);
  }

  getActiveProfiles(): string[] {
    return this.profileManager.getActiveProfiles();
  }

  isProfileActive(profile: string): boolean {
    return this.profileManager.isProfileActive(profile);
  }

  private getTokenKey(token: string | symbol): string {
    return typeof token === "symbol" ? token.toString() : token;
  }

  // Enhanced debug method to see what's registered
  getRegisteredTokens(): string[] {
    const tokens = new Set<string>();
    this.factories.forEach((_, key) => tokens.add(this.getTokenKey(key)));
    this.services.forEach((_, key) => tokens.add(this.getTokenKey(key)));
    this.instances.forEach((_, key) => tokens.add(this.getTokenKey(key)));
    return Array.from(tokens);
  }

  // NEW: Debug method to inspect the current state
  debugContainer(): void {
    console.log("🔍 Container Debug Info:");
    console.log("📋 Factories:", Array.from(this.factories.keys()));
    console.log("🏗️  Services:", Array.from(this.services.keys()));
    console.log("📦 Instances:", Array.from(this.instances.keys()));
    console.log("🎯 Scopes:", Array.from(this.scopes.entries()));
  }

  // Analytics methods moved to @tdi2/di-debug package
  // Use container-analytics utilities from di-debug for:
  // - getDependencyGraph()
  // - validateConfiguration() 
  // - getResolutionPath()
  // - findCircularDependencies()

  /**
   * Export container configuration in JSON format
   * Compatible with analytics tools and CLI
   */
  exportConfiguration(): any {
    // Convert container state to DI config format
    const config: Record<string, any> = {};
    
    // Export factories as service configurations
    for (const [tokenKey, factory] of this.factories.entries()) {
      const scope = this.scopes.get(tokenKey) || 'singleton';
      config[tokenKey.toString()] = {
        implementationClass: tokenKey, // Simplified for analytics
        scope,
        dependencies: [], // Would need dependency tracking for full analysis
        registrationType: 'factory',
        isClassBased: false,
        isAutoResolved: true
      };
    }

    // Export direct service registrations
    for (const [tokenKey, service] of this.services.entries()) {
      const scope = this.scopes.get(tokenKey) || 'singleton';
      config[tokenKey.toString()] = {
        implementationClass: service.constructor.name,
        scope,
        dependencies: [], // Would need dependency tracking for full analysis
        registrationType: 'class',
        isClassBased: true,
        isAutoResolved: false
      };
    }

    return config;
  }

  // getHealthReport() moved to @tdi2/di-debug package
  // Use container-analytics utilities from di-debug

  // NEW: Method to register by interface (for enhanced interface-based DI)
  registerByInterface<T>(
    interfaceName: string,
    implementation: () => T,
    scope: "singleton" | "transient" | "scoped" = "singleton"
  ): void {
    this.register(interfaceName, implementation, scope);
  }

  // NEW: Method to resolve by interface
  resolveByInterface<T>(interfaceName: string): T {
    return this.resolve<T>(interfaceName);
  }

  // NEW: Method to check if interface is registered
  hasInterface(interfaceName: string): boolean {
    return this.has(interfaceName);
  }

  // Helper methods for parent-child scope resolution
  getScope(token: string | symbol): "singleton" | "transient" | "scoped" | undefined {
    const tokenKey = this.getTokenKey(token);
    return this.scopes.get(tokenKey);
  }

  hasFactory(token: string | symbol): boolean {
    const tokenKey = this.getTokenKey(token);
    return this.factories.has(tokenKey);
  }

  getFactory(token: string | symbol): any {
    const tokenKey = this.getTokenKey(token);
    return this.factories.get(tokenKey);
  }

  hasService(token: string | symbol): boolean {
    const tokenKey = this.getTokenKey(token);
    return this.services.has(tokenKey);
  }

  getService(token: string | symbol): any {
    const tokenKey = this.getTokenKey(token);
    return this.services.get(tokenKey);
  }

  // Interface-based lifecycle management
  private async executeOnInitLifecycle<T>(instance: T): Promise<void> {
    if (this.implementsInterface<OnInit>(instance, 'onInit')) {
      try {
        await (instance as any).onInit();
      } catch (error) {
        console.error('OnInit lifecycle hook failed:', error);
      }
    }
  }

  private executeOnInitLifecycleSync<T>(instance: T): void {
    if (this.implementsInterface<OnInit>(instance, 'onInit')) {
      try {
        const result = (instance as any).onInit();
        // If it returns a promise but we're in sync context, handle it
        if (result instanceof Promise) {
          console.warn('Async onInit called in sync context - will execute without waiting');
          result.catch((error: Error) => {
            console.error('Async onInit failed:', error);
          });
        }
      } catch (error) {
        console.error('OnInit lifecycle hook failed:', error);
      }
    }
  }

  // Component lifecycle methods for React integration
  async executeOnMountLifecycle<T>(instance: T, options: ComponentLifecycleOptions = {}): Promise<void> {
    if (this.implementsInterface<OnMount>(instance, 'onMount')) {
      try {
        await (instance as any).onMount(options);
      } catch (error) {
        console.error('OnMount lifecycle hook failed:', error);
      }
    }
  }

  async executeOnUnmountLifecycle<T>(instance: T): Promise<void> {
    if (this.implementsInterface<OnUnmount>(instance, 'onUnmount')) {
      try {
        await (instance as any).onUnmount();
      } catch (error) {
        console.error('OnUnmount lifecycle hook failed:', error);
      }
    }
  }

  // Helper method to check if instance implements a lifecycle interface
  private implementsInterface<T>(instance: any, methodName: string): instance is T {
    return instance && typeof instance[methodName] === 'function';
  }

  // Check if service has any lifecycle hooks (for transformer use)
  hasLifecycleHooks(instance: any): { onMount: boolean; onUnmount: boolean; onInit: boolean; onDestroy: boolean } {
    return {
      onMount: this.implementsInterface<OnMount>(instance, 'onMount'),
      onUnmount: this.implementsInterface<OnUnmount>(instance, 'onUnmount'),
      onInit: this.implementsInterface<OnInit>(instance, 'onInit'),
      onDestroy: this.implementsInterface<OnDestroy>(instance, 'onDestroy')
    };
  }

  // Cleanup method for container destruction
  async destroyContainer(): Promise<void> {
    // Execute OnDestroy on all singleton instances
    for (const [token, instance] of this.instances.entries()) {
      if (this.implementsInterface<OnDestroy>(instance, 'onDestroy')) {
        try {
          await (instance as any).onDestroy();
        } catch (error) {
          console.error('OnDestroy lifecycle hook failed:', error);
        }
      }
    }

    // Execute any registered destruction callbacks
    for (const callbacks of this.destructionCallbacks.values()) {
      for (const callback of callbacks) {
        try {
          await callback();
        } catch (error) {
          console.error('Destruction callback failed:', error);
        }
      }
    }

    // Clear all maps
    this.instances.clear();
    this.destructionCallbacks.clear();
  }
}
