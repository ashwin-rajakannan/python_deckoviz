// contexts/WebSocketContext.js
import React, { createContext, useContext, useRef, useEffect ,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCollectionQueue } from './CollectionQueue';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const { 
    setCollectionQueue, 
    setCurrentCollection,
    collectionQueue,
    currentCollection
  } = useCollectionQueue();
  const listenersRef = useRef([]);

  const processWebSocketMessage = (data) => {
    try {
      // Handle collection queue updates
      if (data.type === 'collectionQueue') {
        const { queue, currentCollection } = data.payload || {};
        
        if (queue) {
          console.log('Updating collection queue:', queue);
          setCollectionQueue(queue);
        }
        
        if (currentCollection) {
          console.log('Updating current collection:', currentCollection);
          setCurrentCollection(currentCollection);
        }
        return;
      }

      // Handle legacy format
      if (data.currentcollection) {
        console.log('Updating current collection (legacy format)');
        setCurrentCollection(data.currentcollection);
        return;
      }

      // Notify all listeners
      listenersRef.current.forEach(listener => listener(data));
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  const connectWebSocket = async () => {
    try {
      const storedRoomId = await AsyncStorage.getItem('roomId');
      const storedDeviceId = await AsyncStorage.getItem('deviceId');
      const storedToken = await AsyncStorage.getItem('userToken');

      console.log('Connecting with:', storedRoomId, storedDeviceId);

      if (!storedRoomId || !storedDeviceId) {
        throw new Error('Missing room or device ID');
      }

      socketRef.current = new WebSocket(
        `wss://api.deckoviz.com/ws/tv/?room=${storedRoomId}&device_id=${storedDeviceId}`
      );

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        
        // Authenticate if we have a token
        if (storedToken) {
          sendMessage({ 
            type: 'auth',
            token: storedToken
          });
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          processWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      socketRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
    }
  };

  const sendMessage = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send - WebSocket not ready');
    }
  };

  const addMessageListener = (listener) => {
    listenersRef.current.push(listener);
    return () => {
      listenersRef.current = listenersRef.current.filter(l => l !== listener);
    };
  };

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connectionStatus,
        sendMessage,
        addMessageListener,
        currentCollection,
        collectionQueue
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);