import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCollectionQueue } from './CollectionQueue';
import { CommonActions } from '@react-navigation/native';
import audioManager from '../AudioManager'; // Import the audio manager
import { Alert } from 'react-native';

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
  const [rituals, setRituals] = useState([]);
  const [currentRitual, setCurrentRitual] = useState(null);
  const [isRitualPlaying, setIsRitualPlaying] = useState(false);
  
  const webSocketRef = useRef(null);
  const ritualTimersRef = useRef({});
  const navigationRef = useRef(null);
  const { setCollectionQueue, addToQueue, insertAtIndex, isQueuePlaying } = useCollectionQueue();
  
  // WebSocket connection parameters
  const [roomId, setRoomId] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [token, setToken] = useState(null);

  // Method to set navigation ref from App.js
  const setNavigationRef = (ref) => {
    navigationRef.current = ref;
  };

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

  // Cleanup audio manager on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up audio manager...');
      audioManager.cleanup();
    };
  }, []);

  // Update connection parameters (for route params)
  const updateConnectionParams = (newRoomId, newDeviceId, newToken) => {
    setRoomId(newRoomId || roomId);
    setDeviceId(newDeviceId || deviceId);
    setToken(newToken || token);
  };

  // Helper function to parse time string to today's date
  const parseTimeToDate = (timeString) => {
    const today = new Date();
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const targetDate = new Date(today);
    targetDate.setHours(hours, minutes, seconds || 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (targetDate < today) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    return targetDate;
  };

  // Helper function to check if a ritual should run today based on repeat type and details
  const shouldRitualRunToday = (ritual) => {
    const { repeat_type, repeat_details } = ritual;
    const today = new Date();
    
    console.log(`🔍 Checking if ritual "${ritual.ritualName}" should run today:`, {
      repeat_type,
      repeat_details,
      today: today.toDateString()
    });

    switch (repeat_type) {
      case 'daily':
        console.log('✅ Daily ritual - should run today');
        return true;

      case 'weekly':
        const todayWeekday = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        const mondayBasedWeekday = todayWeekday === 0 ? 6 : todayWeekday - 1; // Convert to 0=Monday, 6=Sunday
        
        if (repeat_details?.weekdays && Array.isArray(repeat_details.weekdays)) {
          const shouldRun = repeat_details.weekdays.includes(mondayBasedWeekday);
          console.log(`📅 Weekly ritual - today is ${mondayBasedWeekday}, allowed days: ${repeat_details.weekdays}, should run: ${shouldRun}`);
          return shouldRun;
        }
        
        console.log('❌ Weekly ritual - no valid weekdays specified');
        return false;

      case 'monthly':
        const todayDate = today.getDate();
        
        if (repeat_details?.monthday && typeof repeat_details.monthday === 'number') {
          const shouldRun = todayDate === repeat_details.monthday;
          console.log(`📅 Monthly ritual - today is ${todayDate}, target day: ${repeat_details.monthday}, should run: ${shouldRun}`);
          return shouldRun;
        }
        
        console.log('❌ Monthly ritual - no valid monthday specified');
        return false;

      case 'yearly':
        const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
        const todayDay = today.getDate();
        
        if (repeat_details?.month && repeat_details?.day && 
            typeof repeat_details.month === 'number' && 
            typeof repeat_details.day === 'number') {
          const shouldRun = todayMonth === repeat_details.month && todayDay === repeat_details.day;
          console.log(`📅 Yearly ritual - today is ${todayMonth}/${todayDay}, target: ${repeat_details.month}/${repeat_details.day}, should run: ${shouldRun}`);
          return shouldRun;
        }
        
        console.log('❌ Yearly ritual - no valid month/day specified');
        return false;

      default:
        console.log(`❌ Unknown repeat type: ${repeat_type}, defaulting to daily`);
        return true; // Default to daily if unknown type
    }
  };

  // Helper function to get next occurrence date for a ritual
  const getNextOccurrenceDate = (ritual) => {
    const { repeat_type, repeat_details, time } = ritual;
    const now = new Date();
    
    switch (repeat_type) {
      case 'daily':
        return parseTimeToDate(time);

      case 'weekly':
        if (!repeat_details?.weekdays || !Array.isArray(repeat_details.weekdays)) {
          return null;
        }
        
        const targetTime = time.split(':').map(Number);
        const todayWeekday = now.getDay() === 0 ? 6 : now.getDay() - 1; // Convert to Monday=0 system
        
        // Find the next occurrence
        for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
          const checkDate = new Date(now);
          checkDate.setDate(now.getDate() + daysAhead);
          const checkWeekday = checkDate.getDay() === 0 ? 6 : checkDate.getDay() - 1;
          
          if (repeat_details.weekdays.includes(checkWeekday)) {
            const targetDate = new Date(checkDate);
            targetDate.setHours(targetTime[0], targetTime[1], targetTime[2] || 0, 0);
            
            if (targetDate > now) {
              return targetDate;
            }
          }
        }
        
        // If no occurrence found this week, check next week
        const nextWeekDate = new Date(now);
        nextWeekDate.setDate(now.getDate() + 7);
        const nextWeekday = repeat_details.weekdays[0]; // Take first allowed weekday
        const daysToAdd = (nextWeekday - todayWeekday + 7) % 7;
        nextWeekDate.setDate(now.getDate() + daysToAdd + 7);
        nextWeekDate.setHours(targetTime[0], targetTime[1], targetTime[2] || 0, 0);
        
        return nextWeekDate;

      case 'monthly':
        if (!repeat_details?.monthday || typeof repeat_details.monthday !== 'number') {
          return null;
        }
        
        const targetTime2 = time.split(':').map(Number);
        const targetDate = new Date(now);
        targetDate.setDate(repeat_details.monthday);
        targetDate.setHours(targetTime2[0], targetTime2[1], targetTime2[2] || 0, 0);
        
        if (targetDate <= now) {
          targetDate.setMonth(targetDate.getMonth() + 1);
        }
        
        return targetDate;

      case 'yearly':
        if (!repeat_details?.month || !repeat_details?.day || 
            typeof repeat_details.month !== 'number' || 
            typeof repeat_details.day !== 'number') {
          return null;
        }
        
        const targetTime3 = time.split(':').map(Number);
        const targetDate2 = new Date(now);
        targetDate2.setMonth(repeat_details.month - 1, repeat_details.day); // month is 0-indexed
        targetDate2.setHours(targetTime3[0], targetTime3[1], targetTime3[2] || 0, 0);
        
        if (targetDate2 <= now) {
          targetDate2.setFullYear(targetDate2.getFullYear() + 1);
        }
        
        return targetDate2;

      default:
        return parseTimeToDate(time);
    }
  };

  // Navigate to DisplayArtwork screen with ritual interruption handling
  const navigateToDisplayArtwork = async (collection) => {
    console.log('🚀 navigateToDisplayArtwork called with collection:', collection);
    
    if (!navigationRef.current) {
      console.error('❌ Navigation ref not available - this is likely the main issue!');
      console.log('Make sure you call setNavigationRef from your App.js');
      return false;
    }

    try {
      console.log('🎨 Navigating to DisplayRitualScreen for ritual:', collection.ritualName);
      console.log('Navigation ref state:', navigationRef.current.isReady?.());

      const navParams = {
        collection_images: collection.collection_images || [],
        display_time: collection.display_time || 0,
        music: collection.music || null,
        isRitual: true,
        ritualName: collection.ritualName,
        triggerTime: collection.triggerTime
      };

      console.log('Navigation params:', navParams);

      // Check if navigation is ready
      if (navigationRef.current.isReady && !navigationRef.current.isReady()) {
        console.error('❌ Navigation is not ready yet');
        return false;
      }

      // Navigate to DisplayRitualScreen
      navigationRef.current.dispatch(
        CommonActions.navigate({
          name: 'DisplayRitualScreen', // Make sure this screen exists in your navigator
          params: navParams
        })
      );

      console.log(`✅ Successfully dispatched navigation to DisplayRitualScreen`);
      return true;
    } catch (error) {
      console.error('❌ Error navigating to DisplayRitualScreen:', error);
      return false;
    }
  };

  // Enhanced schedule ritual with repeat type checks
  const scheduleRitual = (ritual) => {
    const { ritualName, time, collection, repeat_type, repeat_details } = ritual;
    
    console.log(`⏰ Attempting to schedule ritual "${ritualName}" with repeat type: ${repeat_type}`);
    
    // Check if ritual should run today
    if (!shouldRitualRunToday(ritual)) {
      console.log(`⏭️ Ritual "${ritualName}" should not run today, skipping scheduling`);
      return;
    }
    
    // Get the next occurrence date
    const targetDate = getNextOccurrenceDate(ritual);
    
    if (!targetDate) {
      console.error(`❌ Could not determine next occurrence for ritual "${ritualName}"`);
      return;
    }
    
    const now = new Date();
    const delay = targetDate.getTime() - now.getTime();
    
    console.log(`⏰ Scheduling ritual "${ritualName}" for ${targetDate.toLocaleString()}`);
    
    // Clear any existing timer for this ritual
    if (ritualTimersRef.current[ritualName]) {
      clearTimeout(ritualTimersRef.current[ritualName]);
    }
    
    // Schedule the ritual
    ritualTimersRef.current[ritualName] = setTimeout(() => {
      console.log(`🎨 Triggering ritual: "${ritualName}"`);
      triggerRitual(ritual);
      
      // Schedule next occurrence
      scheduleNextOccurrence(ritual);
    }, delay);
  };

  // Schedule next occurrence of a ritual
  const scheduleNextOccurrence = (ritual) => {
    const { ritualName, repeat_type } = ritual;
    
    console.log(`🔄 Scheduling next occurrence of ritual "${ritualName}"`);
    
    // Calculate delay to next occurrence based on repeat type
    let nextDelay;
    
    switch (repeat_type) {
      case 'daily':
        nextDelay = 24 * 60 * 60 * 1000; // 24 hours
        break;
      
      case 'weekly':
        // Schedule check for next day, the shouldRitualRunToday will handle the logic
        nextDelay = 24 * 60 * 60 * 1000; // Check again tomorrow
        break;
      
      case 'monthly':
        // Schedule check for next day, the shouldRitualRunToday will handle the logic
        nextDelay = 24 * 60 * 60 * 1000; // Check again tomorrow
        break;
      
      case 'yearly':
        // Schedule check for next day, the shouldRitualRunToday will handle the logic
        nextDelay = 24 * 60 * 60 * 1000; // Check again tomorrow
        break;
      
      default:
        nextDelay = 24 * 60 * 60 * 1000; // Default to daily
    }
    
    ritualTimersRef.current[ritualName] = setTimeout(() => {
      scheduleRitual(ritual);
    }, nextDelay);
  };

  // Trigger ritual display with audio interruption handling
  const triggerRitual = async (ritual) => {
    const { ritualName, collection } = ritual;
    console.log(`🔮 Triggering ritual: "${ritualName}"`);
    
    // Format collection for display
    const ritualCollection = {
      ...collection,
      isRitual: true,
      ritualName: ritualName,
      triggerTime: new Date().toISOString()
    };
    
    console.log('ISQUEUEPLAY', isQueuePlaying);
    
    if (isQueuePlaying) {
     // Alert.alert('Queue ritual started')
      // If queue is playing, insert ritual as next item in queue
      console.log('⏭️ Queue is playing - inserting ritual as next item');
      insertAtIndex(ritualCollection, 1); // Add at position 1 (right after current)
      return;
    }
    
    // Update state
    setCurrentRitual(ritualCollection);
    setIsRitualPlaying(true);
    
    // Navigate to DisplayArtwork screen - audio interruption will be handled there
    await navigateToDisplayArtwork(ritualCollection);
    
    console.log(`✨ Ritual "${ritualName}" is now playing`);
  };

  // Handle ritual completion with audio resumption
  const completeRitual = async () => {
    console.log('🎯 Completing ritual...');
    
    try {
      // Stop any ritual audio
      await audioManager.stopAudio();
      
      // Try to resume interrupted content
      const resumed = await audioManager.resumeInterrupted();
      console.log('🎵 Resumed interrupted content after ritual:', resumed);
      
      // Update state
      setCurrentRitual(null);
      setIsRitualPlaying(false);
      
      // Navigate back to previous screen or home
      if (navigationRef.current) {
        const canGoBack = navigationRef.current.canGoBack();
        
        if (canGoBack) {
          navigationRef.current.dispatch(CommonActions.goBack());
        } else {
          // If can't go back, navigate to home or main screen
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }], // Adjust this to your main screen name
            })
          );
        }
      }
      
      console.log('✅ Ritual completion handled successfully');
    } catch (error) {
      console.error('❌ Error completing ritual:', error);
    }
  };

  // Manual ritual completion (for user cancellation)
  const cancelRitual = async () => {
    console.log('🚫 Canceling ritual...');
    
    try {
      // Stop ritual audio
      await audioManager.stopAudio();
      
      // Clear any interruption since user manually canceled
      audioManager.clearInterruption();
      
      // Update state
      setCurrentRitual(null);
      setIsRitualPlaying(false);
      
      // Navigate back
      if (navigationRef.current && navigationRef.current.canGoBack()) {
        navigationRef.current.dispatch(CommonActions.goBack());
      }
      
      console.log('✅ Ritual canceled successfully');
    } catch (error) {
      console.error('❌ Error canceling ritual:', error);
    }
  };

  // Load saved rituals on mount
  useEffect(() => {
    const loadSavedRituals = async () => {
      try {
        const saved = await AsyncStorage.getItem('savedRituals');
        if (saved) {
          const parsed = JSON.parse(saved);
          setRituals(parsed);
          parsed.forEach((ritual) => {
            if (ritual.time && ritual.collection) {
              scheduleRitual(ritual);
            }
          });
          console.log('📁 Loaded rituals from AsyncStorage');
        }
      } catch (err) {
        console.error('❌ Failed to load rituals from storage:', err);
      }
    };

    loadSavedRituals();
  }, []);

  // Process ritual collections from WebSocket
  const processRitualCollections = async (ritualsData) => {
    try {
      console.log('📅 Replacing rituals from socket:', ritualsData.length);

      // 1. Overwrite state
      setRituals(ritualsData);

      // 2. Overwrite AsyncStorage
      await AsyncStorage.setItem('savedRituals', JSON.stringify(ritualsData));

      // 3. Clear existing timers
      Object.values(ritualTimersRef.current).forEach(clearTimeout);
      ritualTimersRef.current = {};

      // 4. Reschedule new ones with repeat type checks
      ritualsData.forEach((ritual) => {
        if (ritual.time && ritual.collection) {
          scheduleRitual(ritual);
        }
      });

      console.log(`✅ Overwritten and scheduled ${ritualsData.length} rituals`);
    } catch (error) {
      console.error('❌ Error processing ritual collections:', error);
    }
  };

  // Helper function to process WebSocket messages with consistent logic
  const processWebSocketMessage = (data) => {
    try {
      // Handle ritual collections
      if (data.type === 'rituals_collection' && Array.isArray(data.payload)) {
        console.log('📅 Processing ritual collections message');
        processRitualCollections(data.payload);
        return;
      }

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
      // Handle ritual collections in individual messages
      if (message.data?.type === 'rituals_collection' && Array.isArray(message.data.payload)) {
        console.log('📅 Found ritual collections in individual message');
        processRitualCollections(message.data.payload);
        return;
      }

      // Handle new format: message.data.data.type === 'collectionQueue'
      if (message.data?.data?.type === 'collectionQueue') {
        const payload = message.data.data.payload;
        console.log('✅ Found collection data (new format):', payload);
        
        if (payload.queue) {
          console.log('🔄 Updating collection queue:', payload.queue);
          setCollectionQueue(payload.queue);
        }
        
        // Fix: Handle currentCollection even when it's null
        if (payload.hasOwnProperty('currentCollection')) {
          console.log('🎨 Updating current collection:', payload.currentCollection);
          setCurrentCollection(payload.currentCollection || null);
        }
        return;
      }

      // Handle legacy format: message.data.currentcollection
      if (message.data?.currentcollection) {
        console.log('✅ Found current collection (legacy format):', message.data.currentcollection);
        setCurrentCollection(message.data.currentcollection);
        return;
      }

      // Handle ritual collections in message.data
      if (message.data?.type === 'rituals_collection' && Array.isArray(message.data.payload)) {
        console.log('📅 Found ritual collections in message.data');
        processRitualCollections(message.data.payload);
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
          setRetryCount(0);
          setConnectionError(null);
          
          // Set up heartbeat to keep connection alive
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
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
      
      // Clear ritual timers
      Object.values(ritualTimersRef.current).forEach(timer => clearTimeout(timer));
      ritualTimersRef.current = {};
      
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

  // Enhanced getNextRitual with repeat type awareness
  const getNextRitual = () => {
    const now = new Date();
    return rituals
      .map(ritual => ({
        ...ritual,
        scheduledTime: getNextOccurrenceDate(ritual)
      }))
      .filter(ritual => ritual.scheduledTime && ritual.scheduledTime > now)
      .sort((a, b) => a.scheduledTime - b.scheduledTime)[0];
  };

  // Enhanced getTodayRituals with repeat type awareness
  const getTodayRituals = () => {
    const today = new Date();
    return rituals
      .filter(ritual => shouldRitualRunToday(ritual))
      .map(ritual => ({
        ...ritual,
        scheduledTime: parseTimeToDate(ritual.time)
      }))
      .sort((a, b) => a.scheduledTime - b.scheduledTime);
  };

  // Manual trigger ritual (for testing)
  const manualTriggerRitual = (ritualName) => {
    const ritual = rituals.find(r => r.ritualName === ritualName);
    if (ritual) {
      triggerRitual(ritual);
    }
  };

  // Get audio manager state for debugging
  const getAudioState = () => {
    return audioManager.getState();
  };

  // New helper function to get ritual schedule info
  const getRitualScheduleInfo = (ritual) => {
    const { repeat_type, repeat_details } = ritual;
    
    switch (repeat_type) {
      case 'daily':
        return 'Every day';
      
      case 'weekly':
        if (repeat_details?.weekdays) {
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const selectedDays = repeat_details.weekdays.map(day => dayNames[day]).join(', ');
          return `Every ${selectedDays}`;
        }
        return 'Weekly (no days specified)';
      
      case 'monthly':
        if (repeat_details?.monthday) {
          const suffix = getOrdinalSuffix(repeat_details.monthday);
          return `${repeat_details.monthday}${suffix} of every month`;
        }
        return 'Monthly (no day specified)';
      
      case 'yearly':
        if (repeat_details?.month && repeat_details?.day) {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          const suffix = getOrdinalSuffix(repeat_details.day);
          return `${monthNames[repeat_details.month - 1]} ${repeat_details.day}${suffix} every year`;
        }
        return 'Yearly (no date specified)';
      
      default:
        return 'Custom schedule';
    }
  };

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
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
    setNavigationRef,
    // Ritual-related values
    rituals,
    currentRitual,
    isRitualPlaying,
    completeRitual,
    cancelRitual, // New method for manual cancellation
    getNextRitual,
    getTodayRituals,
    manualTriggerRitual,
    getAudioState, // New method for debugging audio state
    getRitualScheduleInfo, // New method for getting schedule descriptions
    shouldRitualRunToday, // New method for checking if ritual should run today
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