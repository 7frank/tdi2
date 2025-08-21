import type { DIContainer, DIMap, ComponentLifecycleOptions, ContainerConfiguration } from './types';
export interface DIContainerOptions {
    verbose?: boolean;
    activeProfiles?: string[];
}
export declare class CompileTimeDIContainer implements DIContainer {
    private services;
    private instances;
    private factories;
    private scopes;
    private destructionCallbacks;
    private configurations;
    private configurationInstances;
    private profileManager;
    private parent?;
    private verbose;
    constructor(parent?: DIContainer, options?: DIContainerOptions);
    register<T>(token: string | symbol, implementation: any, // This will be a factory function generated at compile time
    scope?: "singleton" | "transient" | "scoped"): void;
    resolve<T>(token: string | symbol): T;
    private createInstance;
    private createInstanceSync;
    has(token: string | symbol): boolean;
    hasLocalService(token: string | symbol): boolean;
    createScope(): DIContainer;
    loadConfiguration(diMap: DIMap): void;
    loadContainerConfiguration(config: ContainerConfiguration): void;
    private loadConfigurationClasses;
    private getConfigurationInstance;
    registerConfigurationInstance(className: string, instance: any): void;
    setActiveProfiles(profiles: string[]): void;
    addActiveProfiles(profiles: string[]): void;
    getActiveProfiles(): string[];
    isProfileActive(profile: string): boolean;
    private getTokenKey;
    getRegisteredTokens(): string[];
    debugContainer(): void;
    /**
     * Export container configuration in JSON format
     * Compatible with analytics tools and CLI
     */
    exportConfiguration(): any;
    registerByInterface<T>(interfaceName: string, implementation: () => T, scope?: "singleton" | "transient" | "scoped"): void;
    resolveByInterface<T>(interfaceName: string): T;
    hasInterface(interfaceName: string): boolean;
    getScope(token: string | symbol): "singleton" | "transient" | "scoped" | undefined;
    hasFactory(token: string | symbol): boolean;
    getFactory(token: string | symbol): any;
    hasService(token: string | symbol): boolean;
    getService(token: string | symbol): any;
    private executeOnInitLifecycle;
    private executeOnInitLifecycleSync;
    executeOnMountLifecycle<T>(instance: T, options?: ComponentLifecycleOptions): Promise<void>;
    executeOnUnmountLifecycle<T>(instance: T): Promise<void>;
    private implementsInterface;
    hasLifecycleHooks(instance: any): {
        onMount: boolean;
        onUnmount: boolean;
        onInit: boolean;
        onDestroy: boolean;
    };
    destroyContainer(): Promise<void>;
}
