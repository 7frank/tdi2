export interface WebSocketMessage {
  type: 'analysis_update' | 'config_reload' | 'error' | 'ping' | 'pong';
  data?: any;
  timestamp: number;
}

export interface WebSocketServiceInterface {
  state: {
    connected: boolean;
    reconnecting: boolean;
    messages: WebSocketMessage[];
    connectionAttempts: number;
    lastError: string | null;
  };
  
  connect(): void;
  disconnect(): void;
  send(message: Omit<WebSocketMessage, 'timestamp'>): void;
  onMessage(callback: (message: WebSocketMessage) => void): void;
  removeMessageListener(callback: (message: WebSocketMessage) => void): void;
}