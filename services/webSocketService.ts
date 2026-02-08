/**
 * WebSocket Service - Real-time order and complaint updates
 * Requirements: 7.1, 7.3, 7.4, 2.4, 2.5
 */

import { Order } from '@/types/order';
import { Complaint } from '@/types/complaint';
import logger from '@/lib/logger';

/**
 * WebSocket event types
 */
export type WebSocketEventType = 
  | 'order:update'
  | 'order:new'
  | 'order:delete'
  | 'connection:status'
  | 'subscription:changed'
  | 'dashboard:metrics:updated'
  | 'complaint:new'
  | 'complaint:update';

/**
 * Complaint-specific WebSocket event types
 * Requirements: 2.4, 2.5
 */
export type ComplaintEventType = 'complaint:new' | 'complaint:update';

/**
 * Complaint WebSocket message structure
 * Requirements: 2.4, 2.5
 */
export interface ComplaintWebSocketMessage {
  type: ComplaintEventType;
  payload: Complaint;
  timestamp: string;
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: Order | Complaint | { orderId: string } | { status: string } | SubscriptionChangePayload | DashboardMetricsPayload;
  timestamp: string;
}

/**
 * Connection state
 */
export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Subscription change payload
 */
export interface SubscriptionChangePayload {
  plan: 'starter' | 'pro' | 'business' | 'enterprise';
  previousPlan?: string;
}

/**
 * Dashboard metrics update payload
 */
export interface DashboardMetricsPayload {
  ordersReceived?: number;
  ordersConfirmed?: number;
  ordersPending?: number;
  ordersRejected?: number;
  confirmationRate?: number;
  revenue?: number;
  revenueChange?: number;
  averageOrderValue?: number;
}

/**
 * Callback types for WebSocket events
 */
export type OrderUpdateCallback = (order: Order) => void;
export type NewOrderCallback = (order: Order) => void;
export type OrderDeleteCallback = (orderId: string) => void;
export type ConnectionChangeCallback = (connected: boolean, state: ConnectionState) => void;
export type SubscriptionChangeCallback = (payload: SubscriptionChangePayload) => void;
export type DashboardMetricsCallback = (payload: DashboardMetricsPayload) => void;

/**
 * Callback types for complaint WebSocket events
 * Requirements: 2.4, 2.5
 */
export type ComplaintNewCallback = (complaint: Complaint) => void;
export type ComplaintUpdateCallback = (complaint: Complaint) => void;

/**
 * WebSocket Service Configuration
 */
export interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
  reconnectAttempts: 10,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
};


/**
 * WebSocket Service Class
 * Manages WebSocket connection with automatic reconnection using exponential backoff
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempt = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private lastEventTimestamp: string | null = null;
  
  // Event callbacks
  private orderUpdateCallbacks: Set<OrderUpdateCallback> = new Set();
  private newOrderCallbacks: Set<NewOrderCallback> = new Set();
  private orderDeleteCallbacks: Set<OrderDeleteCallback> = new Set();
  private connectionChangeCallbacks: Set<ConnectionChangeCallback> = new Set();
  private subscriptionChangeCallbacks: Set<SubscriptionChangeCallback> = new Set();
  private dashboardMetricsCallbacks: Set<DashboardMetricsCallback> = new Set();
  private complaintNewCallbacks: Set<ComplaintNewCallback> = new Set();
  private complaintUpdateCallbacks: Set<ComplaintUpdateCallback> = new Set();

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get last event timestamp for sync purposes
   */
  getLastEventTimestamp(): string | null {
    return this.lastEventTimestamp;
  }

  /**
   * Connect to WebSocket server
   * Requirements: 7.1
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.cleanup();
    
    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      logger.error('WebSocket connection error:', error, 'WebSocket');
      this.handleDisconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.cleanup();
    this.setConnectionState('disconnected');
    this.reconnectAttempt = 0;
  }

  /**
   * Register callback for order updates
   * Requirements: 7.1
   */
  onOrderUpdate(callback: OrderUpdateCallback): () => void {
    this.orderUpdateCallbacks.add(callback);
    return () => this.orderUpdateCallbacks.delete(callback);
  }

  /**
   * Register callback for new orders
   * Requirements: 7.2
   */
  onNewOrder(callback: NewOrderCallback): () => void {
    this.newOrderCallbacks.add(callback);
    return () => this.newOrderCallbacks.delete(callback);
  }

  /**
   * Register callback for order deletions
   */
  onOrderDelete(callback: OrderDeleteCallback): () => void {
    this.orderDeleteCallbacks.add(callback);
    return () => this.orderDeleteCallbacks.delete(callback);
  }

  /**
   * Register callback for connection state changes
   * Requirements: 7.3
   */
  onConnectionChange(callback: ConnectionChangeCallback): () => void {
    this.connectionChangeCallbacks.add(callback);
    return () => this.connectionChangeCallbacks.delete(callback);
  }

  /**
   * Register callback for subscription changes
   * Requirements: 6.2
   */
  onSubscriptionChange(callback: SubscriptionChangeCallback): () => void {
    this.subscriptionChangeCallbacks.add(callback);
    return () => this.subscriptionChangeCallbacks.delete(callback);
  }

  /**
   * Register callback for dashboard metrics updates
   * Requirements: 6.1
   */
  onDashboardMetricsUpdate(callback: DashboardMetricsCallback): () => void {
    this.dashboardMetricsCallbacks.add(callback);
    return () => this.dashboardMetricsCallbacks.delete(callback);
  }

  /**
   * Register callback for new complaints
   * Requirements: 2.4
   */
  onComplaintNew(callback: ComplaintNewCallback): () => void {
    this.complaintNewCallbacks.add(callback);
    return () => this.complaintNewCallbacks.delete(callback);
  }

  /**
   * Register callback for complaint updates
   * Requirements: 2.5
   */
  onComplaintUpdate(callback: ComplaintUpdateCallback): () => void {
    this.complaintUpdateCallbacks.add(callback);
    return () => this.complaintUpdateCallbacks.delete(callback);
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logger.info('WebSocket connected', undefined, 'WebSocket');
      this.reconnectAttempt = 0;
      this.setConnectionState('connected');
      
      // Request missed updates if we have a last timestamp
      // Requirements: 7.4
      if (this.lastEventTimestamp) {
        this.requestMissedUpdates(this.lastEventTimestamp);
      }
    };

    this.ws.onclose = (event) => {
      logger.info('WebSocket closed:', { code: event.code, reason: event.reason }, 'WebSocket');
      this.handleDisconnect();
    };

    this.ws.onerror = (error) => {
      logger.error('WebSocket error:', error, 'WebSocket');
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      // Update last event timestamp for sync
      if (message.timestamp) {
        this.lastEventTimestamp = message.timestamp;
      }

      switch (message.type) {
        case 'order:update':
          this.orderUpdateCallbacks.forEach(cb => cb(message.payload as Order));
          break;
        case 'order:new':
          this.newOrderCallbacks.forEach(cb => cb(message.payload as Order));
          break;
        case 'order:delete':
          const deletePayload = message.payload as { orderId: string };
          this.orderDeleteCallbacks.forEach(cb => cb(deletePayload.orderId));
          break;
        case 'subscription:changed':
          this.subscriptionChangeCallbacks.forEach(cb => cb(message.payload as SubscriptionChangePayload));
          break;
        case 'dashboard:metrics:updated':
          this.dashboardMetricsCallbacks.forEach(cb => cb(message.payload as DashboardMetricsPayload));
          break;
        case 'complaint:new':
          this.complaintNewCallbacks.forEach(cb => cb(message.payload as Complaint));
          break;
        case 'complaint:update':
          this.complaintUpdateCallbacks.forEach(cb => cb(message.payload as Complaint));
          break;
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error, 'WebSocket');
    }
  }

  /**
   * Handle disconnection with exponential backoff reconnection
   * Requirements: 7.3
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempt >= this.config.reconnectAttempts) {
      logger.warn('Max reconnection attempts reached', undefined, 'WebSocket');
      this.setConnectionState('disconnected');
      return;
    }

    this.setConnectionState('reconnecting');
    
    // Calculate delay with exponential backoff
    const delay = this.calculateReconnectDelay();
    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1}/${this.config.reconnectAttempts})`, undefined, 'WebSocket');

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempt++;
      this.connect();
    }, delay);
  }

  /**
   * Calculate reconnection delay using exponential backoff
   * Requirements: 7.3
   */
  private calculateReconnectDelay(): number {
    const delay = this.config.initialReconnectDelay * Math.pow(2, this.reconnectAttempt);
    return Math.min(delay, this.config.maxReconnectDelay);
  }

  /**
   * Request missed updates from server
   * Requirements: 7.4
   */
  private requestMissedUpdates(since: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'sync:request',
        payload: { since },
      }));
    }
  }

  /**
   * Update connection state and notify callbacks
   */
  private setConnectionState(state: ConnectionState): void {
    const previousState = this.connectionState;
    this.connectionState = state;
    
    if (previousState !== state) {
      const isConnected = state === 'connected';
      this.connectionChangeCallbacks.forEach(cb => cb(isConnected, state));
    }
  }

  /**
   * Cleanup WebSocket and timers
   */
  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}

/**
 * Singleton instance for global use
 */
let webSocketServiceInstance: WebSocketService | null = null;

/**
 * Get or create WebSocket service singleton
 */
export function getWebSocketService(config?: Partial<WebSocketConfig>): WebSocketService {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService(config);
  }
  return webSocketServiceInstance;
}

/**
 * Reset WebSocket service (useful for testing)
 */
export function resetWebSocketService(): void {
  if (webSocketServiceInstance) {
    webSocketServiceInstance.disconnect();
    webSocketServiceInstance = null;
  }
}

export default WebSocketService;
