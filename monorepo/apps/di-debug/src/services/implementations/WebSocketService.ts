import { Service, Inject } from '@tdi2/di-core/decorators';
import type { WebSocketServiceInterface, WebSocketMessage } from '../interfaces/WebSocketServiceInterface';
import type { NotificationServiceInterface } from '../interfaces/NotificationServiceInterface';

@Service()
export class WebSocketService implements WebSocketServiceInterface {
  private ws: WebSocket | null = null;
  private messageListeners: Set<(message: WebSocketMessage) => void> = new Set();
  private reconnectTimer: number | null = null;

  state = {
    connected: false,
    reconnecting: false,
    messages: [] as WebSocketMessage[],
    connectionAttempts: 0,
    lastError: null as string | null,
  };

  constructor(
    @Inject() private notificationService: NotificationServiceInterface
  ) {
    // Auto-connect on service creation
    this.connect();
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.state.connectionAttempts++;
    this.state.lastError = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.state.connected = true;
        this.state.reconnecting = false;
        this.state.connectionAttempts = 0;
        console.log('🔌 Connected to TDI2 server');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.state.messages.push(message);
          
          // Keep only last 100 messages
          if (this.state.messages.length > 100) {
            this.state.messages = this.state.messages.slice(-100);
          }

          // Notify listeners
          this.messageListeners.forEach(listener => {
            try {
              listener(message);
            } catch (error) {
              console.error('Error in WebSocket message listener:', error);
            }
          });
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this.state.connected = false;
        console.log('❌ Disconnected from TDI2 server');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        this.state.lastError = 'WebSocket connection error';
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      this.state.lastError = error.message;
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state.connected = false;
    this.state.reconnecting = false;
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.notificationService.showError('WebSocket not connected');
      return;
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
    };

    try {
      this.ws.send(JSON.stringify(fullMessage));
    } catch (error) {
      this.notificationService.showError('Failed to send WebSocket message');
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.messageListeners.add(callback);
  }

  removeMessageListener(callback: (message: WebSocketMessage) => void): void {
    this.messageListeners.delete(callback);
  }

  private scheduleReconnect(): void {
    if (this.state.reconnecting) return;

    this.state.reconnecting = true;
    
    // Exponential backoff with max 30 seconds
    const delay = Math.min(1000 * Math.pow(2, this.state.connectionAttempts - 1), 30000);
    
    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.state.connectionAttempts})...`);
      this.connect();
    }, delay);
  }
}