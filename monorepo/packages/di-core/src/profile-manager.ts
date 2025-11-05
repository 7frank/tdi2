// src/profile-manager.ts - Profile management for environment-aware DI

export interface ProfileManagerOptions {
  verbose?: boolean;
  defaultProfiles?: string[]; // Profiles to use when no profiles are active
}

/**
 * ProfileManager handles profile-based service filtering
 * Supports Spring Boot style profile expressions and environment integration
 */
export class ProfileManager {
  private activeProfiles: Set<string> = new Set();
  private options: ProfileManagerOptions;
  private static readonly DEFAULT_PROFILE = "default";

  constructor(options: ProfileManagerOptions = {}) {
    this.options = {
      verbose: options.verbose || false,
      defaultProfiles: options.defaultProfiles || [
        ProfileManager.DEFAULT_PROFILE,
      ],
    };

    // Initialize with environment profiles if available
    this.initializeFromEnvironment();
  }

  /**
   * Set active profiles for the container
   */
  setActiveProfiles(profiles: string[]): void {
    this.activeProfiles.clear();

    for (const profile of profiles) {
      if (profile && profile.trim()) {
        this.activeProfiles.add(profile.trim());
      }
    }

    if (this.options.verbose) {
      console.log(
        `🎯 Active profiles set: [${Array.from(this.activeProfiles).join(", ")}]`
      );
    }
  }

  /**
   * Add additional profiles to active set
   */
  addActiveProfiles(profiles: string[]): void {
    for (const profile of profiles) {
      if (profile && profile.trim()) {
        this.activeProfiles.add(profile.trim());
      }
    }

    if (this.options.verbose) {
      console.log(
        `🎯 Added profiles: [${profiles.join(", ")}]. Active: [${Array.from(this.activeProfiles).join(", ")}]`
      );
    }
  }

  /**
   * Get currently active profiles
   */
  getActiveProfiles(): string[] {
    if (this.activeProfiles.size === 0) {
      return this.options.defaultProfiles || [ProfileManager.DEFAULT_PROFILE];
    }
    return Array.from(this.activeProfiles);
  }

  /**
   * Check if a specific profile is active
   */
  isProfileActive(profile: string): boolean {
    if (!profile || !profile.trim()) {
      return true; // Empty profile is always active
    }

    const activeProfiles = this.getActiveProfiles();

    // Handle negation profiles (e.g., "!prod")
    if (profile.startsWith("!")) {
      const negatedProfile = profile.substring(1);
      return !activeProfiles.includes(negatedProfile);
    }

    return activeProfiles.includes(profile.trim());
  }

  /**
   * Check if service should be loaded based on its profile requirements
   */
  shouldLoadService(serviceProfiles?: string[]): boolean {
    // If no profiles specified, service is always loaded
    if (!serviceProfiles || serviceProfiles.length === 0) {
      return true;
    }

    // Service is loaded if ANY of its profiles match active profiles
    return serviceProfiles.some((profile) => this.isProfileActive(profile));
  }

  /**
   * Check if configuration class should be loaded based on profiles
   */
  shouldLoadConfiguration(configProfiles?: string[]): boolean {
    return this.shouldLoadService(configProfiles);
  }

  /**
   * Check if bean method should be loaded considering both config and method profiles
   */
  shouldLoadBean(configProfiles?: string[], beanProfiles?: string[]): boolean {
    // Bean method profiles override configuration profiles
    const effectiveProfiles =
      beanProfiles && beanProfiles.length > 0 ? beanProfiles : configProfiles;

    return this.shouldLoadService(effectiveProfiles);
  }

  /**
   * Filter service implementations by active profiles
   */
  filterServicesByProfiles<T extends { profiles?: string[] }>(
    services: T[]
  ): T[] {
    return services.filter((service) =>
      this.shouldLoadService(service.profiles)
    );
  }

  /**
   * Get profile match reason for debugging
   */
  getProfileMatchReason(serviceProfiles?: string[]): string {
    if (!serviceProfiles || serviceProfiles.length === 0) {
      return "No profiles specified - always loaded";
    }

    const activeProfiles = this.getActiveProfiles();
    const matchingProfiles = serviceProfiles.filter((profile) =>
      this.isProfileActive(profile)
    );

    if (matchingProfiles.length > 0) {
      return `Matches active profiles: ${matchingProfiles.join(", ")} (active: ${activeProfiles.join(", ")})`;
    } else {
      return `No matching profiles. Service profiles: [${serviceProfiles.join(", ")}], Active: [${activeProfiles.join(", ")}]`;
    }
  }

  /**
   * Validate profile expressions
   */
  validateProfileExpression(profile: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!profile || typeof profile !== "string") {
      return { isValid: false, error: "Profile must be a non-empty string" };
    }

    const trimmed = profile.trim();
    if (trimmed.length === 0) {
      return {
        isValid: false,
        error: "Profile cannot be empty or whitespace only",
      };
    }

    // Check for valid negation syntax
    if (trimmed.startsWith("!")) {
      const negatedProfile = trimmed.substring(1).trim();
      if (negatedProfile.length === 0) {
        return {
          isValid: false,
          error: 'Negated profile cannot be empty (e.g., "!prod", not "!")',
        };
      }
    }

    // Check for invalid characters (basic validation)
    if (!/^[!]?[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return {
        isValid: false,
        error:
          "Profile contains invalid characters. Use only letters, numbers, underscore, hyphen, and optional leading !",
      };
    }

    return { isValid: true };
  }

  /**
   * Get environment variables in a browser-safe way
   */
  private getEnvironmentVariables(): Record<string, string | undefined> {
    if (typeof process === "undefined" || !process?.env) {
      console.warn(
        "⚠️ process.env is undefined, skipping environment profile initialization."
      );

      return {};
    }

    return process.env;
  }

  /**
   * Initialize profiles from environment variables
   */
  private initializeFromEnvironment(): void {
    // Check common environment variables for profile activation
    const env = this.getEnvironmentVariables();

    const envProfiles =
      env.TDI2_PROFILES || env.ACTIVE_PROFILES || env.PROFILES || env.NODE_ENV;

    if (envProfiles) {
      const profiles = envProfiles
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (profiles.length > 0) {
        this.setActiveProfiles(profiles);

        if (this.options.verbose) {
          console.log(
            `🌍 Profiles loaded from environment: [${profiles.join(", ")}]`
          );
        }
      }
    }
  }

  /**
   * Get debug information about current profile state
   */
  getDebugInfo(): {
    activeProfiles: string[];
    defaultProfiles: string[];
    hasEnvironmentProfiles: boolean;
    environmentSource: string | null;
  } {
    const env = this.getEnvironmentVariables();
    const envProfiles =
      env.TDI2_PROFILES || env.ACTIVE_PROFILES || env.PROFILES || env.NODE_ENV;

    return {
      activeProfiles: this.getActiveProfiles(),
      defaultProfiles: this.options.defaultProfiles || [
        ProfileManager.DEFAULT_PROFILE,
      ],
      hasEnvironmentProfiles: !!envProfiles,
      environmentSource: envProfiles || null,
    };
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.activeProfiles.clear();
    this.initializeFromEnvironment();
  }

  /**
   * Create a profile expression matcher (for advanced use cases)
   */
  static createProfileMatcher(
    expression: string
  ): (activeProfiles: string[]) => boolean {
    return (activeProfiles: string[]) => {
      if (expression.startsWith("!")) {
        const negatedProfile = expression.substring(1);
        return !activeProfiles.includes(negatedProfile);
      }
      return activeProfiles.includes(expression);
    };
  }
}
