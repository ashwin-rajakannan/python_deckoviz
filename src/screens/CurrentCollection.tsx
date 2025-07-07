import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  Image,
  Animated,
  useTVEventHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FavouriteCards from '../components/favouriteCards';
import Logo from '../assets/logo.png';
import TVCardScroller from '../components/TvCardScroller';
import { useNavigation } from '@react-navigation/native';
import CollectionCards from '../components/CollectionCard';
import { useActiveCategory } from '../components/context/ActiveCategory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavorites } from '../components/context/FavouriteCollections';
import { useCollectionQueue } from '../components/context/CollectionQueue';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;
const HORIZONTAL_MARGIN = 20;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;

// Focus zones enum for better organization
const FOCUS_ZONES = {
  NAV: 'nav',
  CARDS: 'cards', 
  BUTTON: 'button',
  HEADER: 'header' // Added header focus zone
};



const VerticalNav = ({ 
  navItemRefs, 
  hasFocus, 
  onFocus, 
  navigation, 
  categoryToScreenMap, 
  categories, 
  activeCategory, 
  setActiveCategory, 
  isNavigatingRef 
}) => {
  return (
    <View style={styles.navContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category}
            ref={(ref) => { navItemRefs.current[index] = ref; }}
            onPress={() => {
              if (hasFocus && activeCategory === category && !isNavigatingRef.current) {
                isNavigatingRef.current = true;
                setActiveCategory(category);
                const screen = categoryToScreenMap[category];
                if (screen) {
                  navigation.navigate(screen);
                  setTimeout(() => {
                    isNavigatingRef.current = false;
                  }, 500);
                } else {
                  isNavigatingRef.current = false;
                }
              }
            }}
            style={[
              styles.navItem,
              activeCategory === category && styles.activeNavItem,
              hasFocus && activeCategory === category && styles.focusedNavItem,
            ]}
            activeOpacity={1}
            hasTVPreferredFocus={hasFocus && activeCategory === category}
            tvParallaxProperties={{
              enabled: hasFocus,
            }}
            onFocus={() => {
              if (hasFocus) {
                setActiveCategory(category);
              }
            }}
          >
            <Text style={styles.navText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default function CurrentCollection({route}) {
  const [roomId, setRoomId] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [token, setToken] = useState(null);
  const navigation = useNavigation();
  const { activeCategory, setActiveCategory } = useActiveCategory();
  const [likedCards, setLikedCards] = useState([]);
  const navItemRefs = useRef([]);
  const qrButtonRef = useRef(null); // Ref for QR button
  const profileButtonRef = useRef(null); // Ref for profile button

  // Enhanced focus management
  const [currentFocusZone, setCurrentFocusZone] = useState(FOCUS_ZONES.NAV);
  
  
  // Add navigation flag to prevent duplicate navigation
const isNavigatingRef = useRef(false);
  const [connectionError, setConnectionError] = useState(null);
  const scrollRef = useRef();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const tvCardScrollerRef = useRef();
  const webSocketRef = useRef(null);
  const [currentCollection, setCurrentCollection] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const { setCollectionQueue, collectionQueue } = useCollectionQueue();
  const { favorites } = useFavorites();
  const [retryCount, setRetryCount] = useState(0);
  const openCollectionButtonRef = useRef();

  const categories = [
    'Current Collection',
    'Permanent Collection On Device',
    'All Collection in Device Queue',
  ];
  async function getTokens(){
    const roomId = await AsyncStorage.getItem('roomId')
    const deviceId =await AsyncStorage.getItem('deviceId')
    const userToken = await AsyncStorage.getItem('userToken')

    console.log(`room is ${roomId} and  device is ${deviceId} and user is ${userToken}`)
  }

  useEffect(()=>{
    getTokens();
  },[])

  const [randomFavorites, setRandomFavorites] = useState([]);
  
  const getTwoUniqueFavoritesWithImages = (collections) => {
    const valid = collections.filter(
      item => item.collection_images?.[0]?.image?.file || item.collection_images?.[0]?.file
    );

    const shuffled = [...valid].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2).map((item, i) => ({
      id: `carousel-fav-${i}`,
      name: item.name || `Favorite ${i + 1}`,
      description: item.description || 'No description available',
      image: item.collection_images?.[0]?.image?.file ||
             item.collection_images?.[0]?.file ||
             'https://via.placeholder.com/300',
    }));
  };
useEffect(() => {
  if (connectionError && retryCount >= 5) {
    const timer = setTimeout(() => {
      navigation.navigate('Home');
    }, 3000);
    
    return () => clearTimeout(timer);
  }
}, [connectionError, retryCount, navigation]);
  useEffect(() => {
    const fallbackItems = currentCollection?.collection_images?.slice(0, 2).map((img, i) => ({
      id: `fallback-${i}`,
      name: currentCollection.name || 'Current Collection',
      description: currentCollection.description || 'No description available',
      image: img?.image?.file || img?.file || 'https://via.placeholder.com/300',
    }));
    
    if (favorites.length > 0) {
      const favs = getTwoUniqueFavoritesWithImages(favorites);
      setRandomFavorites(favs);
    } else if (currentCollection?.collection_images?.length > 0) {
      const firstTwo = currentCollection.collection_images.slice(0, 2);
      setRandomFavorites(fallbackItems);
    } else {
      setRandomFavorites([]);
    }
  }, [favorites, currentCollection]);

  useEffect(() => {
    const getParams = async () => {
      try {
        const routeRoom = route?.params?.roomId;
        const routeDevice = route?.params?.deviceId;
        const routeToken = route?.params?.token;

        const storedRoomId = await AsyncStorage.getItem('roomId');
        const storedDeviceId = await AsyncStorage.getItem('deviceId');
        const storedToken = await AsyncStorage.getItem('userToken');
        console.log('storedss',storedRoomId)
        setRoomId(routeRoom || storedRoomId);
        setDeviceId(routeDevice || storedDeviceId);
        setToken(routeToken || storedToken);
      } catch (err) {
        console.error('Failed to load data from AsyncStorage:', err);
      }
    };

    getParams();
  }, []);

  useEffect(() => {
    const currentCategoryIndex = categories.indexOf(activeCategory);

    if (currentFocusZone === FOCUS_ZONES.NAV) {
      navItemRefs.current[currentCategoryIndex]?.focus?.();
    } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
      tvCardScrollerRef.current?.focusCurrentCard?.();
    } else if (currentFocusZone === FOCUS_ZONES.BUTTON) {
      openCollectionButtonRef.current?.focus?.();
    }
  }, [currentFocusZone, activeCategory]);

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
  } else if (retryCount >= 5) {
    // Max retries reached, navigate to Home
    setConnectionError('Max connection retries reached. Please reconnect.');
    setTimeout(() => {
      if (isComponentMounted) {
        navigation.navigate('Home');
      }
    }, 2000);
  }
};
      ws.onclose = (event) => {
        console.log('🔌 TV WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Clear heartbeat on close
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        // Attempt to reconnect if component is still mounted and it wasn't a clean close
        if (isComponentMounted && event.code !== 1000 && retryCount < 5) {
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
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
    }
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
}, [roomId, deviceId, token, retryCount]); // Added retryCount to dependencies

// Optional: Add a connection status indicator for debugging
useEffect(() => {
  console.log('🔗 Connection status changed to:', connectionStatus);
}, [connectionStatus]);

  const categoryToScreenMap = {
    'Current Collection': 'CurrentCollection',
    'Permanent Collection On Device': 'PermanentCollection',
    'All Collection in Device Queue': 'AllCollectionScreen',
  };

  // Enhanced TV remote event handler
  useTVEventHandler((evt) => {
    console.log('TV Event:', evt.eventType, 'Current Focus Zone:', currentFocusZone);
    
    const currentCategoryIndex = categories.indexOf(activeCategory);
    
    switch (evt.eventType) {
      case 'up':
        if (currentFocusZone === FOCUS_ZONES.BUTTON) {
          if (currentCollection?.collection_images?.length > 0) {
            setCurrentFocusZone(FOCUS_ZONES.CARDS);
            setTimeout(() => tvCardScrollerRef.current?.focusCurrentCard?.(), 50);
          } else {
            setCurrentFocusZone(FOCUS_ZONES.NAV);
            setTimeout(() => navItemRefs.current[currentCategoryIndex]?.focus?.(), 50);
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          setCurrentFocusZone(FOCUS_ZONES.NAV);
          setTimeout(() => navItemRefs.current[currentCategoryIndex]?.focus?.(), 50);
        } else if (currentFocusZone === FOCUS_ZONES.NAV && currentCategoryIndex > 0) {
          setActiveCategory(categories[currentCategoryIndex - 1]);
          setTimeout(() => navItemRefs.current[currentCategoryIndex - 1]?.focus?.(), 50);
        } else if (currentFocusZone === FOCUS_ZONES.NAV && currentCategoryIndex === 0) {
          setCurrentFocusZone(FOCUS_ZONES.HEADER);
          setTimeout(() => qrButtonRef.current?.focus?.(), 50);
        } else if (currentFocusZone === FOCUS_ZONES.HEADER) {
          // Already at top, no action
        }
        break;

      case 'down':
        if (currentFocusZone === FOCUS_ZONES.HEADER) {
          setCurrentFocusZone(FOCUS_ZONES.NAV);
          setTimeout(() => navItemRefs.current[currentCategoryIndex]?.focus?.(), 50);
        } else if (currentFocusZone === FOCUS_ZONES.NAV) {
          if (currentCategoryIndex < categories.length - 1) {
            setActiveCategory(categories[currentCategoryIndex + 1]);
            setTimeout(() => navItemRefs.current[currentCategoryIndex + 1]?.focus?.(), 50);
          } else {
            if (currentCollection?.collection_images?.length > 0) {
              setCurrentFocusZone(FOCUS_ZONES.CARDS);
              setTimeout(() => tvCardScrollerRef.current?.focusCurrentCard?.(), 50);
            } else {
              setCurrentFocusZone(FOCUS_ZONES.BUTTON);
              setTimeout(() => openCollectionButtonRef.current?.focus?.(), 50);
            }
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          setCurrentFocusZone(FOCUS_ZONES.BUTTON);
          setTimeout(() => openCollectionButtonRef.current?.focus?.(), 50);
        }
        break;

      case 'left':
        if (currentFocusZone === FOCUS_ZONES.HEADER) {
          // Move between QR and profile buttons
          if (qrButtonRef.current?.isFocused?.()) {
            profileButtonRef.current?.focus?.();
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          const currentCardIndex = tvCardScrollerRef.current?.getCurrentIndex();
          if (currentCardIndex === 0) {
            setCurrentFocusZone(FOCUS_ZONES.NAV);
            setTimeout(() => {
              navItemRefs.current[categories.indexOf(activeCategory)]?.focus?.();
            }, 50);
          } else {
            tvCardScrollerRef.current?.scrollLeft();
          }
        }
        break;

      case 'right':
        if (currentFocusZone === FOCUS_ZONES.HEADER) {
          // Move between profile and QR buttons
          if (profileButtonRef.current?.isFocused?.()) {
            qrButtonRef.current?.focus?.();
          }
        } else if (currentFocusZone === FOCUS_ZONES.NAV) {
          setCurrentFocusZone(FOCUS_ZONES.CARDS);
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          tvCardScrollerRef.current?.scrollRight();
        }
        break;

      case 'select':
        if (isNavigatingRef.current) {
          return;
        }
        
        if (currentFocusZone === FOCUS_ZONES.HEADER) {
          isNavigatingRef.current = true;
          if (qrButtonRef.current?.isFocused?.()) {
            navigation.navigate('Home');
          } else if (profileButtonRef.current?.isFocused?.()) {
            // Handle profile button press if needed
          }
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 500);
        } else if (currentFocusZone === FOCUS_ZONES.NAV) {
          isNavigatingRef.current = true;
          const screen = categoryToScreenMap[activeCategory];
          if (screen) {
            navigation.navigate(screen);
            setTimeout(() => {
              isNavigatingRef.current = false;
            }, 500);
          } else {
            isNavigatingRef.current = false;
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          isNavigatingRef.current = true;
          const currentCardIndex = tvCardScrollerRef.current?.getCurrentIndex();
          const currentItem = currentCollection?.collection_images?.[currentCardIndex];
          if (currentItem) {
            handleCardPress(currentItem);
            setTimeout(() => {
              isNavigatingRef.current = false;
            }, 500);
          } else {
            isNavigatingRef.current = false;
          }
        } else if (currentFocusZone === FOCUS_ZONES.BUTTON) {
          isNavigatingRef.current = true;
          navigation.navigate('SpecificCollection', {currentCollection: currentCollection});
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 500);
        }
        break;

      default:
        break;
    }
  });

  useEffect(() => {
    console.log('📦 Collection Queue updated in context');
  }, [collectionQueue]);

  useEffect(() => {
    if (currentCollection?.collection_images?.length > 0) {
      setIsLoading(false);
    } else if (retryCount < 5) {
      const timer = setTimeout(() => {
        console.log('Retrying to load collection...');
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentCollection, retryCount]);

  const handleLike = (index) => {
    setLikedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const onScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + HORIZONTAL_MARGIN));
    setActiveIndex(index);
  };

  const handleCardPress = (item) => {
    console.log('HANDLED',item)
    navigation.navigate('DisplayArtWork', { artWork: item });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
          <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image source={Logo} style={styles.logoImage} />
            </View>
            <Text style={styles.logoText}>Deckoviz</Text>
          </View>
          <View style={styles.headerIconsContainer}>
            <TouchableOpacity
              ref={qrButtonRef}
              style={[
                styles.headerButton,
                currentFocusZone === FOCUS_ZONES.HEADER && qrButtonRef.current?.isFocused?.() && styles.headerButtonFocused
              ]}
              onPress={() => navigation.navigate('Home')}
              hasTVPreferredFocus={currentFocusZone === FOCUS_ZONES.HEADER}
              tvParallaxProperties={{
                enabled: currentFocusZone === FOCUS_ZONES.HEADER,
              }}
              onFocus={() => setCurrentFocusZone(FOCUS_ZONES.HEADER)}
            >
              <Icon name="qr-code" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              ref={profileButtonRef}
              style={[
                styles.headerButton,
                currentFocusZone === FOCUS_ZONES.HEADER && profileButtonRef.current?.isFocused?.() && styles.headerButtonFocused
              ]}
              onPress={() => {}}
              tvParallaxProperties={{
                enabled: currentFocusZone === FOCUS_ZONES.HEADER,
              }}
              onFocus={() => setCurrentFocusZone(FOCUS_ZONES.HEADER)}
            >
              <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profilePic} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            ref={scrollRef}
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            snapToInterval={CARD_WIDTH + HORIZONTAL_MARGIN}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.scrollContent}
          >
            {randomFavorites.map((item, index) => {
              const imageUrl = item.image || 'https://via.placeholder.com/300';
              const title = item.name || 'Untitled Collection';
              const description = item.description || 'No description available';

              return (
                <View
                  key={item.id + index}
                  style={[
                    styles.cardContainer,
                    {
                      width: CARD_WIDTH,
                      marginRight: index === randomFavorites.length - 1 ? 0 : HORIZONTAL_MARGIN,
                    },
                  ]}
                >
                  <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.cardBackground}
                    imageStyle={styles.cardImage}
                  >
                    <View style={styles.cardTextWrapper}>
                      <Text style={styles.cardTitle}>{title}</Text>
                      <Text style={styles.cardSubtitle}>Current Collection</Text>
                      <Text style={styles.cardDescription}>{description}</Text>
                    </View>

                    <View style={styles.pagination}>
                      {randomFavorites.map((_, dotIndex) => (
                        <View
                          key={dotIndex}
                          style={[
                            styles.dot,
                            activeIndex === dotIndex && styles.activeDot,
                          ]}
                        />
                      ))}
                    </View>
                  </ImageBackground>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Nav + Collection Cards */}
        <View style={styles.navAndFavouritesContainer}>
   <VerticalNav
            navItemRefs={navItemRefs}
            hasFocus={currentFocusZone === FOCUS_ZONES.NAV}
            onFocus={setCurrentFocusZone}
            navigation={navigation}
            categoryToScreenMap={categoryToScreenMap}
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            isNavigatingRef={useRef(false)}
          />
          
          {currentCollection?.collection_images?.length > 0 ? (
         <TVCardScroller
            ref={tvCardScrollerRef}
            hasFocus={currentFocusZone === FOCUS_ZONES.CARDS}
            data={currentCollection}
            CardComponent={CollectionCards}
            onCardPress={(item) => console.log(item)}
          />
          ) : (
            <View style={styles.emptyMessageContainer}>
              <Text style={styles.emptyMessageText}>No current selection</Text>
            </View>
          )}
        </View>

        {/* Open Collection Button */}
        <View style={styles.openAllButtonWrapper}>
          <TouchableOpacity
            style={[
              styles.openAllButton,
              currentFocusZone === FOCUS_ZONES.BUTTON && styles.openAllButtonFocused
            ]}
            onPress={() => navigation.navigate('SpecificCollection',{currentCollection:currentCollection})}
          >
            <Text style={styles.openAllButtonText}>Open Current Collection</Text>
          </TouchableOpacity>
        </View>
        
         
       {/* <View style={styles.debugContainer}>
          <Text style={styles.debugText}>Current Focus: {currentFocusZone}</Text>
        </View>*/}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mainContent: { flex: 1, paddingTop: 40 },
  navContainer: {
    width: 160,
    backgroundColor: '#1E1F3F',
    paddingVertical: 20,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    marginRight: 10,
  },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  activeNavItem: { backgroundColor: '#683DD8' },
  navText: { fontSize: 14, color: 'white', fontWeight: '500' },
  focusedNavItem: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
   headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerButtonFocused: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoBackground: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
    marginRight: 10,
  },
  logoImage: { width: 40, height: 40, resizeMode: 'contain' },
  logoText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  profilePic: { width: 40, height: 40, borderRadius: 20 },
  carouselContainer: {
    height: 220,
    justifyContent: 'center',
    marginBottom: 20,
  },
  scrollContent: { paddingHorizontal: HORIZONTAL_MARGIN },
  cardContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardImage: { borderRadius: 0 },
  likeButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-end',
  },
  liked: { backgroundColor: 'white' },
  unliked: { backgroundColor: 'rgba(255,255,255,0.2)' },
  cardTextWrapper: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
  },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: 'white', fontSize: 14, marginTop: 4 },
  cardDescription: { color: 'white', fontSize: 12, marginTop: 6 },
  pagination: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: { width: 20, borderRadius: 5, backgroundColor: 'white' },
  navAndFavouritesContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  openAllButtonWrapper: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  openAllButton: {
    backgroundColor: '#683DD8',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  openAllButtonFocused: {
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: '#7B4AE8',
  },
  openAllButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#1E1F3F',
    borderRadius: 16,
    marginTop: 20,
    marginLeft: 10,
    marginRight: 10,
  },
  emptyMessageText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Debug styles - remove in production
  debugContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: 'yellow',
    fontSize: 12,
  },
});