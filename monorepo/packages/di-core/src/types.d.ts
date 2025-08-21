export type Constructor<T = object> = new (...args: any[]) => T;
export interface ServiceMetadata {
    token?: string | symbol;
    scope?: "singleton" | "transient" | "scoped";
    implementation: Constructor;
    autoResolve?: boolean;
    profiles?: string[];
    primary?: boolean;
    qualifier?: string;
}
export interface DIContainer {
    register<T>(token: string | symbol, implementation: Constructor<T>, scope?: "singleton" | "transient" | "scoped"): void;
    resolve<T>(token: string | symbol): T;
    has(token: string | symbol): boolean;
    createScope(): DIContainer;
    registerByInterface<T>(interfaceName: string, implementation: () => T, scope?: "singleton" | "transient" | "scoped"): void;
    resolveByInterface<T>(interfaceName: string): T;
    hasInterface(interfaceName: string): boolean;
    getScope(token: string | symbol): "singleton" | "transient" | "scoped" | undefined;
    hasFactory(token: string | symbol): boolean;
    getFactory(token: string | symbol): any;
    hasService(token: string | symbol): boolean;
    getService(token: string | symbol): any;
    hasLifecycleHooks(instance: any): {
        onMount: boolean;
        onUnmount: boolean;
        onInit: boolean;
        onDestroy: boolean;
    };
    executeOnMountLifecycle<T>(instance: T, options?: {
        signal?: AbortSignal;
    }): Promise<void>;
    executeOnUnmountLifecycle<T>(instance: T): Promise<void>;
}
export interface ServiceOptions {
    token?: string | symbol;
    profiles?: string[];
    primary?: boolean;
    qualifier?: string;
}
export interface ConfigurationOptions {
    profiles?: string[];
    priority?: number;
}
export interface ConfigurationMetadata {
    profiles: string[];
    priority: number;
    beans: BeanMetadata[];
    className: string;
    filePath: string;
}
export interface BeanMetadata {
    methodName: string | symbol;
    returnType: string;
    parameters: BeanParameterMetadata[];
    scope: "singleton" | "transient" | "scoped";
    primary: boolean;
    qualifier?: string;
    autoResolve: boolean;
    profiles?: string[];
}
export interface BeanParameterMetadata {
    parameterName: string;
    parameterType: string;
    isOptional: boolean;
    qualifier?: string;
}
export interface InjectMetadata {
    token?: string | symbol;
    propertyKey?: string | symbol;
    parameterIndex?: number;
    target: string;
    autoResolve?: boolean;
    optional?: boolean;
    qualifier?: string;
}
export type ServiceFactory<T> = (container?: any) => T;
type ServiceFactoryFactory<T> = (container?: any) => () => T;
export interface DIMap {
    [token: string]: {
        factory: ServiceFactory<any> | ServiceFactoryFactory<any>;
        scope: "singleton" | "transient" | "scoped";
        dependencies: string[];
        interfaceName?: string;
        implementationClass: string;
        isAutoResolved: boolean;
        qualifier?: string;
        isBean?: boolean;
        beanMethodName?: string;
        configurationClass?: string;
        profiles?: string[];
    };
}
export interface InterfaceMapping {
    [interfaceName: string]: {
        implementations: string[];
        primary?: string;
        tokens: string[];
    };
}
export interface ContainerConfiguration {
    diMap: DIMap;
    interfaceMapping: InterfaceMapping;
    configurations: ConfigurationMetadata[];
    profiles?: string[];
    environment?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    type: "missing-implementation" | "circular-dependency" | "ambiguous-implementation";
    message: string;
    details: any;
}
export interface ValidationWarning {
    type: "optional-missing" | "multiple-implementations" | "unused-service";
    message: string;
    details: any;
}
export interface InterfaceResolutionData {
    interfaceName: string;
    sanitizedKey: string;
    implementations: Array<{
        className: string;
        filePath: string;
        isPrimary: boolean;
        qualifier?: string;
        scope: string;
    }>;
    isGeneric: boolean;
    typeParameters: string[];
}
export interface DependencyNode {
    id: string;
    interfaceName?: string;
    dependencies: DependencyEdge[];
    scope: string;
    isAutoResolved: boolean;
}
export interface DependencyEdge {
    targetInterface: string;
    targetImplementation?: string;
    isOptional: boolean;
    qualifier?: string;
}
export interface EnvironmentConfig {
    name: string;
    profiles: string[];
    overrides: {
        [interfaceName: string]: string;
    };
    mocks: {
        [interfaceName: string]: any;
    };
}
export interface OnInit {
    onInit(): void | Promise<void>;
}
export interface OnDestroy {
    onDestroy(): void | Promise<void>;
}
export interface OnMount {
    onMount(options?: {
        signal?: AbortSignal;
    }): void | Promise<void>;
}
export interface OnUnmount {
    onUnmount(): void | Promise<void>;
}
export interface ComponentLifecycleOptions {
    signal?: AbortSignal;
}
export interface DebugInfo {
    configHash: string;
    environment: string;
    activeProfiles: string[];
    interfaceResolutions: InterfaceResolutionData[];
    dependencyGraph: DependencyNode[];
    validation: ValidationResult;
    containerStats: {
        totalServices: number;
        autoResolvedServices: number;
        manualTokenServices: number;
        interfacesWithMultipleImpls: number;
    };
}
export {};
