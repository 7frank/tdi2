export interface ConfigData {
  srcPath: string;
  port: number;
  verbose: boolean;
  watch: boolean;
  timestamp: string;
  environment?: string;
}

export interface ConfigServiceInterface {
  state: {
    config: ConfigData | null;
    isLoading: boolean;
    error: string | null;
  };
  
  loadConfig(): Promise<void>;
  reloadConfig(): Promise<void>;
  updateConfig(config: Partial<ConfigData>): Promise<void>;
}