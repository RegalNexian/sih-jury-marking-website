// Real-time synchronization using Socket.IO
// Handles broadcasting and receiving evaluation updates across all jury devices

import { io } from 'socket.io-client';

class SocketRealTimeSync {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Get Socket.IO server URL based on environment
  getSocketUrl() {
    // Check for environment variable first
    if (import.meta.env.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }

    // For production, use the current hostname with different port
    if (import.meta.env.PROD) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const hostname = window.location.hostname;
      
      // For Render deployment, the socket server will be on the same domain
      if (hostname.includes('onrender.com')) {
        return `${protocol}//${hostname}`;
      }
      
      // For Vercel or other platforms, use environment variable
      return import.meta.env.VITE_SOCKET_URL || `${protocol}//${hostname}:3001`;
    }

    // Development - use localhost
    return 'http://localhost:3001';
  }

  // Initialize Socket.IO connection
  async initialize() {
    try {
      console.log('🔗 Initializing Socket.IO connection...');

      // Determine Socket.IO server URL based on environment
      const socketUrl = this.getSocketUrl();
      console.log('📡 Connecting to Socket.IO server:', socketUrl);

      // Create socket connection
      this.socket = io(socketUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      // Set up connection event handlers
      this.setupConnectionEvents();
      
      // Set up evaluation event handlers
      this.setupEvaluationEvents();

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO:', error);
      return false;
    }
  }

  // Set up connection-related events
  setupConnectionEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Socket.IO connected, ID:', this.socket.id);
      this.notifyEventHandlers('connection-status', { 
        connected: true, 
        socketId: this.socket.id 
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket.IO disconnected:', reason);
      this.notifyEventHandlers('connection-status', { 
        connected: false, 
        reason 
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.reconnectAttempts++;
      this.notifyEventHandlers('connection-error', { 
        error, 
        attempts: this.reconnectAttempts 
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
      this.notifyEventHandlers('reconnected', { attemptNumber });
    });
  }

  // Set up evaluation-specific events
  setupEvaluationEvents() {
    if (!this.socket) return;

    // Listen for jury evaluation updates
    this.socket.on('jury-evaluation-updated', (data) => {
      console.log('📊 Received jury evaluation update:', data);
      this.handleJuryEvaluationUpdate(data);
    });

    // Listen for jury completion status
    this.socket.on('jury-completed', (data) => {
      console.log('✅ Jury completed evaluation:', data);
      this.handleJuryCompletion(data);
    });

    // Listen for configuration changes
    this.socket.on('config-updated', (data) => {
      console.log('⚙️ Configuration updated:', data);
      this.handleConfigUpdate(data);
    });

    // Listen for admin actions (reset, etc.)
    this.socket.on('admin-action', (data) => {
      console.log('👨‍💼 Admin action received:', data);
      this.handleAdminAction(data);
    });

    // Listen for real-time statistics
    this.socket.on('evaluation-stats', (data) => {
      console.log('📈 Evaluation statistics update:', data);
      this.notifyEventHandlers('evaluation-stats', data);
    });
  }

  // Handle incoming jury evaluation updates
  handleJuryEvaluationUpdate(data) {
    const { juryId, scores, timestamp, sourceSocketId } = data;
    
    // Don't process updates from our own socket to prevent loops
    if (sourceSocketId === this.socket?.id) {
      console.log('🔄 Ignoring own update to prevent loop');
      return;
    }
    
    try {
      // Get current evaluations from localStorage
      const currentData = JSON.parse(localStorage.getItem('sih_jury_evaluations') || '{}');
      
      // Update the specific jury's evaluation data
      if (currentData.evaluations && currentData.evaluations[juryId]) {
        currentData.evaluations[juryId].scores = scores;
        currentData.evaluations[juryId].lastModified = timestamp;
        currentData.evaluations[juryId].isSubmitted = true;
        currentData.lastUpdated = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('sih_jury_evaluations', JSON.stringify(currentData));
        
        console.log('💾 Updated localStorage with remote jury data');
        
        // Notify event handlers (for UI updates)
        this.notifyEventHandlers('evaluation-updated', {
          juryId,
          scores,
          timestamp,
          source: 'remote'
        });
      }
    } catch (error) {
      console.error('❌ Error handling jury evaluation update:', error);
    }
  }

  // Handle jury completion
  handleJuryCompletion(data) {
    const { juryId, timestamp, sourceSocketId } = data;
    
    // Don't process our own completion updates
    if (sourceSocketId === this.socket?.id) return;
    
    try {
      // Update completion status in localStorage
      const currentData = JSON.parse(localStorage.getItem('sih_jury_evaluations') || '{}');
      
      if (currentData.evaluations && currentData.evaluations[juryId]) {
        currentData.evaluations[juryId].isSubmitted = true;
        currentData.evaluations[juryId].submittedAt = timestamp;
        currentData.lastUpdated = new Date().toISOString();
        
        localStorage.setItem('sih_jury_evaluations', JSON.stringify(currentData));
        
        this.notifyEventHandlers('jury-completed', { 
          juryId, 
          timestamp, 
          source: 'remote' 
        });
      }
    } catch (error) {
      console.error('❌ Error handling jury completion:', error);
    }
  }

  // Handle configuration updates
  handleConfigUpdate(data) {
    const { type, payload } = data;
    console.log('⚙️ Processing config update:', type, payload);
    this.notifyEventHandlers('config-updated', { type, payload });
  }

  // Handle admin actions
  handleAdminAction(data) {
    const { action, payload } = data;
    
    if (action === 'reset-evaluations') {
      // Clear localStorage when admin resets
      localStorage.removeItem('sih_jury_evaluations');
      console.log('🗑️ Cleared localStorage due to admin reset');
      this.notifyEventHandlers('evaluations-reset', payload);
    }
  }

  // Broadcast jury evaluation update
  broadcastJuryEvaluation(juryId, scores) {
    if (!this.isConnected || !this.socket) {
      console.warn('⚠️ Cannot broadcast - Socket.IO not connected');
      return false;
    }

    const data = {
      juryId,
      scores,
      timestamp: new Date().toISOString(),
      sourceSocketId: this.socket.id
    };

    try {
      this.socket.emit('jury-evaluation-update', data);
      console.log('📡 Broadcasted jury evaluation update for jury', juryId);
      return true;
    } catch (error) {
      console.error('❌ Failed to broadcast evaluation:', error);
      return false;
    }
  }

  // Broadcast jury completion
  broadcastJuryCompletion(juryId) {
    if (!this.isConnected || !this.socket) {
      console.warn('⚠️ Cannot broadcast completion - Socket.IO not connected');
      return false;
    }

    const data = {
      juryId,
      timestamp: new Date().toISOString(),
      sourceSocketId: this.socket.id
    };

    try {
      this.socket.emit('jury-completion', data);
      console.log('📡 Broadcasted jury completion for jury', juryId);
      return true;
    } catch (error) {
      console.error('❌ Failed to broadcast completion:', error);
      return false;
    }
  }

  // Request current evaluation statistics
  requestEvaluationStats() {
    if (this.isConnected && this.socket) {
      this.socket.emit('request-evaluation-stats');
    }
  }

  // Event handler management
  addEventListener(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType).push(handler);
  }

  removeEventListener(eventType, handler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  notifyEventHandlers(eventType, data) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('🔌 Socket.IO disconnected');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      connected: this.socket?.connected || false
    };
  }

  // Manual reconnection
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.initialize();
    }
  }
}

// Create singleton instance
export const socketRealTimeSync = new SocketRealTimeSync();

// Auto-initialize when module loads (only in browser)
if (typeof window !== 'undefined') {
  socketRealTimeSync.initialize().catch(error => {
    console.warn('⚠️ Socket.IO initialization failed:', error);
  });
}

export default socketRealTimeSync;