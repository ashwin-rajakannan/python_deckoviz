import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCollectionQueue } from './CollectionQueue';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [currentCollection, setCurrentCollection] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const webSocketRef = useRef(null);
  const { setCollectionQueue } = useCollectionQueue();
  
  // WebSocket connection parameters
  const [roomId, setRoomId] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [token, setToken] = useState(null);

  // Load connection parameters from AsyncStorage
  useEffect(() => {
    const loadConnectionParams = async () => {
      try {
        const storedRoomId = await AsyncStorage.getItem('roomId');
        const storedDeviceId = await AsyncStorage.getItem('deviceId');
        const storedToken = await AsyncStorage.getItem('userToken');
        
        console.log('Loaded connection params:', { storedRoomId, storedDeviceId, storedToken });
        
        setRoomId(storedRoomId);
        setDeviceId(storedDeviceId);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to load connection params from AsyncStorage:', error);
      }
    };

    loadConnectionParams();
  }, []);

  // Update connection parameters (for route params)
  const updateConnectionParams = (newRoomId, newDeviceId, newToken) => {
    setRoomId(newRoomId || roomId);
    setDeviceId(newDeviceId || deviceId);
    setToken(newToken || token);
  };

  // Helper function to process WebSocket messages with consistent logic
  const processWebSocketMessage = (data) => {
    try {
      // Handle history messages (contains array of past messages)
      if (data.type === 'history' && Array.isArray(data.messages)) {
        console.log('📜 Processing history message with', data.messages.length, 'messages');
        
        // Process each message in history
        data.messages.forEach((message, index) => {
          console.log(`Processing history message ${index + 1}:`, message);
          processIndividualMessage(message);
        });
        return;
      }

      // Handle direct messages
      if (data.type === 'message') {
        processIndividualMessage(data);
        return;
      }

      // Handle legacy messages array format
      if (Array.isArray(data.messages)) {
        console.log('📜 Processing legacy messages array format');
        data.messages.forEach((message, index) => {
          if (message.type === 'message') {
            console.log(`Processing legacy message ${index + 1}:`, message);
            processIndividualMessage(message);
          }
        });
        return;
      }

      // Handle other message types
      console.log('ℹ️ Received other message type:', data.type);
      
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
    }
  };

  // Helper function to process individual messages consistently
  const processIndividualMessage = (message) => {
    try {
      // Handle new format: message.data.data.type === 'collectionQueue'
      if (message.data?.data?.type === 'collectionQueue') {
        const payload = message.data.data.payload;
        console.log('✅ Found collection data (new format):', payload);
        
        if (payload.queue) {
          console.log('🔄 Updating collection queue:', payload.queue);
          setCollectionQueue(payload.queue);
        }
        
        if (payload.currentCollection) {
          console.log('🎨 Updating current collection:', payload.currentCollection);
          setCurrentCollection(payload.currentCollection);
        }
        return;
      }

      // Handle legacy format: message.data.currentcollection
      if (message.data?.currentcollection) {
        console.log('✅ Found current collection (legacy format):', message.data.currentcollection);
        setCurrentCollection(message.data.currentcollection);
        return;
      }

      // Handle other data formats
      if (message.data) {
        console.log('ℹ️ Received message with unhandled data structure:', message.data);
      }
      
    } catch (error) {
      console.error('❌ Error processing individual message:', error);
    }
  };

  // WebSocket connection effect
  useEffect(() => {
    if (!roomId || !deviceId || !token) {
      console.warn('Missing required parameters for WebSocket connection');
      setConnectionStatus('missing_params');
      return;
    }

    let reconnectTimeout = null;
    let heartbeatInterval = null;
    let isComponentMounted = true;

    const connectWebSocket = () => {
      if (!isComponentMounted) return;

      try {
        // Close existing connection if any
        if (webSocketRef.current && webSocketRef.current.readyState !== WebSocket.CLOSED) {
          webSocketRef.current.close();
        }

        setConnectionStatus('connecting');
        console.log('🔄 Attempting WebSocket connection...');
        
        const wsUrl = `wss://api.deckoviz.com/ws/tv/?room=${roomId}&device_id=${deviceId}`;
        webSocketRef.current = new WebSocket(wsUrl);
        const ws = webSocketRef.current;

        ws.onopen = () => {
          if (!isComponentMounted) return;
          console.log('✅ TV connected to WebSocket');
          console.log('Socket state:', ws.readyState);
          setConnectionStatus('connected');
          setRetryCount(0); // Reset retry count on successful connection
          setConnectionError(null); // Clear any previous errors
          
          // Set up heartbeat to keep connection alive
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000); // Send ping every 30 seconds
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted) return;
          
          try {
            const data = JSON.parse(event.data);
            console.log('📨 TV received raw data:', data);

            // Handle pong responses
            if (data.type === 'pong') {
              console.log('💓 Received heartbeat pong');
              return;
            }

            // Process the message based on its structure
            processWebSocketMessage(data);
            
          } catch (parseError) {
            console.error('❌ Error parsing WebSocket message:', parseError);
            console.log('Raw message that failed to parse:', event.data);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ TV WebSocket error:', error);
          setConnectionStatus('error');
          setConnectionError(error.message || 'WebSocket connection error');
          
          // Clear heartbeat on error
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
        };

        ws.onclose = (event) => {
          console.log('🔌 TV WebSocket closed:', event.code, event.reason);
          setConnectionStatus('disconnected');
          
          // Set error if not a normal closure
          if (event.code !== 1000) {
            setConnectionError(event.reason || 'WebSocket connection closed unexpectedly');
          }
          
          // Clear heartbeat on close
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }

          // Attempt to reconnect if component is still mounted and it wasn't a clean close
          if (isComponentMounted && event.code !== 1000 && retryCount < 5) {
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            console.log(`🔄 Scheduling reconnect in ${backoffDelay}ms (attempt ${retryCount + 1}/5)`);
            
            reconnectTimeout = setTimeout(() => {
              if (isComponentMounted) {
                setRetryCount(prev => prev + 1);
                connectWebSocket();
              }
            }, backoffDelay);
          }
        };

      } catch (error) {
        console.error('❌ WebSocket initialization error:', error);
        setConnectionStatus('error');
        setConnectionError(error.message || 'WebSocket initialization failed');
      }
    };

    // Initial connection
    connectWebSocket();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket connection...');
      isComponentMounted = false;
      
      // Clear timers
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      // Close WebSocket connection
      if (webSocketRef.current) {
        const ws = webSocketRef.current;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          console.log('🔌 Closing WebSocket connection...');
          ws.close(1000, 'Component unmounted');
        }
        webSocketRef.current = null;
      }
    };
  }, [roomId, deviceId, token, retryCount]);

  // Optional: Add a connection status indicator for debugging
  useEffect(() => {
    console.log('🔗 Connection status changed to:', connectionStatus);
  }, [connectionStatus]);

  // Send message through WebSocket
  const sendMessage = (message) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket not connected, cannot send message');
    return false;
  };

  // Disconnect WebSocket
  const disconnect = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close(1000, 'Manual disconnect');
    }
  };

  // Reconnect WebSocket
  const reconnect = () => {
    setRetryCount(0);
    setConnectionError(null);
    // The useEffect will handle reconnection when retryCount changes
  };

  const value = {
    currentCollection,
    connectionStatus,
    connectionError,
    retryCount,
    sendMessage,
    disconnect,
    reconnect,
    updateConnectionParams,
    // Expose connection params for debugging
    roomId,
    deviceId,
    token,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};