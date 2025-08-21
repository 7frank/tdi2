export interface ProfileManagerOptions {
    verbose?: boolean;
    defaultProfiles?: string[];
}
/**
 * ProfileManager handles profile-based service filtering
 * Supports Spring Boot style profile expressions and environment integration
 */
export declare class ProfileManager {
    private activeProfiles;
    private options;
    private static readonly DEFAULT_PROFILE;
    constructor(options?: ProfileManagerOptions);
    /**
     * Set active profiles for the container
     */
    setActiveProfiles(profiles: string[]): void;
    /**
     * Add additional profiles to active set
     */
    addActiveProfiles(profiles: string[]): void;
    /**
     * Get currently active profiles
     */
    getActiveProfiles(): string[];
    /**
     * Check if a specific profile is active
     */
    isProfileActive(profile: string): boolean;
    /**
     * Check if service should be loaded based on its profile requirements
     */
    shouldLoadService(serviceProfiles?: string[]): boolean;
    /**
     * Check if configuration class should be loaded based on profiles
     */
    shouldLoadConfiguration(configProfiles?: string[]): boolean;
    /**
     * Check if bean method should be loaded considering both config and method profiles
     */
    shouldLoadBean(configProfiles?: string[], beanProfiles?: string[]): boolean;
    /**
     * Filter service implementations by active profiles
     */
    filterServicesByProfiles<T extends {
        profiles?: string[];
    }>(services: T[]): T[];
    /**
     * Get profile match reason for debugging
     */
    getProfileMatchReason(serviceProfiles?: string[]): string;
    /**
     * Validate profile expressions
     */
    validateProfileExpression(profile: string): {
        isValid: boolean;
        error?: string;
    };
    /**
     * Initialize profiles from environment variables
     */
    private initializeFromEnvironment;
    /**
     * Get debug information about current profile state
     */
    getDebugInfo(): {
        activeProfiles: string[];
        defaultProfiles: string[];
        hasEnvironmentProfiles: boolean;
        environmentSource: string | null;
    };
    /**
     * Reset to default state
     */
    reset(): void;
    /**
     * Create a profile expression matcher (for advanced use cases)
     */
    static createProfileMatcher(expression: string): (activeProfiles: string[]) => boolean;
}
