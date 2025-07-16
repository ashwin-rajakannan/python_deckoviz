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
import { useWebSocket } from '../components/context/Websocket'; // Import the WebSocket context

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;
const HORIZONTAL_MARGIN = 20;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;

// Focus zones enum for better organization
const FOCUS_ZONES = {
  NAV: 'nav',
  CARDS: 'cards', 
  BUTTON: 'button',
  HEADER: 'header'
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

export default function CurrentCollection({ route }) {
  const navigation = useNavigation();
  const { activeCategory, setActiveCategory } = useActiveCategory();
  const [likedCards, setLikedCards] = useState([]);
  const navItemRefs = useRef([]);
  const qrButtonRef = useRef(null);
  const profileButtonRef = useRef(null);

  // Enhanced focus management
  const [currentFocusZone, setCurrentFocusZone] = useState(FOCUS_ZONES.NAV);
  
  // Add navigation flag to prevent duplicate navigation
  const isNavigatingRef = useRef(false);
  const scrollRef = useRef();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const tvCardScrollerRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const { favorites } = useFavorites();
  const openCollectionButtonRef = useRef();

  // Use WebSocket context instead of managing WebSocket locally
  const {
    currentCollection,
    connectionStatus,
    connectionError,
    retryCount,
    updateConnectionParams,
    reconnect,
    roomId,
    deviceId,
    token,
  } = useWebSocket();

  const { setCollectionQueue, collectionQueue } = useCollectionQueue();

  const categories = [
    'Current Collection',
    'Permanent Collection On Device',
    'All Collection in Device Queue',
  ];

  // Load connection parameters and update context
  useEffect(() => {
    const getParams = async () => {
      try {
        const routeRoom = route?.params?.roomId;
        const routeDevice = route?.params?.deviceId;
        const routeToken = route?.params?.token;

        const storedRoomId = await AsyncStorage.getItem('roomId');
        const storedDeviceId = await AsyncStorage.getItem('deviceId');
        const storedToken = await AsyncStorage.getItem('userToken');
        
        console.log('Loaded params:', { storedRoomId, storedDeviceId, storedToken });
        
        // Update context with connection parameters
        updateConnectionParams(
          routeRoom || storedRoomId,
          routeDevice || storedDeviceId,
          routeToken || storedToken
        );
      } catch (err) {
        console.error('Failed to load data from AsyncStorage:', err);
      }
    };

    getParams();
  }, [route?.params]);

  // Handle connection errors and max retries
  useEffect(() => {
    if (connectionError && retryCount >= 5) {
      console.log('Max retries reached, navigating to Home');
      const timer = setTimeout(() => {
        navigation.navigate('Home');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionError, retryCount, navigation]);

  // Update loading state based on current collection
  useEffect(() => {
    if (currentCollection?.collection_images?.length > 0) {
      setIsLoading(false);
    } else if (connectionStatus === 'connected' && retryCount < 5) {
      // Only show loading if we're connected but don't have data yet
      setIsLoading(true);
    }
  }, [currentCollection, connectionStatus, retryCount]);

  // Log connection status changes
  useEffect(() => {
    console.log('🔗 Connection status:', connectionStatus);
  }, [connectionStatus]);

  // Debug token information
  async function getTokens() {
    const roomId = await AsyncStorage.getItem('roomId');
    const deviceId = await AsyncStorage.getItem('deviceId');
    const userToken = await AsyncStorage.getItem('userToken');
    console.log(`room is ${roomId} and device is ${deviceId} and user is ${userToken}`);
  }

  useEffect(() => {
    getTokens();
  }, []);

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
      setRandomFavorites(fallbackItems);
    } else {
      setRandomFavorites([]);
    }
  }, [favorites, currentCollection]);

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
          navigation.navigate('SpecificCollection', { currentCollection: currentCollection });
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 500);
        }
        break;

      default:
        break;
    }
  });

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
    console.log('HANDLED', item);
    navigation.navigate('DisplayArtWork', { artWork: item, music:currentCollection.music });
  };

  // Show connection status for debugging
  const renderConnectionStatus = () => {
  {/*  if (connectionStatus === 'connecting') {
      return <Text style={styles.statusText}>Connecting...</Text>;
    } else if (connectionStatus === 'error' || connectionError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Connection Error: {connectionError}</Text>
          {retryCount < 5 && <Text style={styles.retryText}>Retrying... ({retryCount}/5)</Text>}
        </View>
      );
    } else if (connectionStatus === 'disconnected') {
      return <Text style={styles.statusText}>Disconnected</Text>;
    } else if (connectionStatus === 'connected') {
      return <Text style={styles.connectedText}>Connected</Text>;
    }
    return null;*/} 
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
                currentFocusZone === FOCUS_ZONES.HEADER && styles.headerButtonFocused
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
                currentFocusZone === FOCUS_ZONES.HEADER && styles.headerButtonFocused
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

        {/* Connection Status - Remove in production */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            {renderConnectionStatus()}
          </View>
        )}

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
            isNavigatingRef={isNavigatingRef}
          />
          
          {currentCollection?.collection_images?.length > 0 ? (
            <TVCardScroller
              ref={tvCardScrollerRef}
              hasFocus={currentFocusZone === FOCUS_ZONES.CARDS}
              data={currentCollection}
              CardComponent={CollectionCards}
              onCardPress={handleCardPress}
              tagData={currentCollection.tags}
            />
          ) : (
            <View style={styles.emptyMessageContainer}>
              <Text style={styles.emptyMessageText}>
                {connectionStatus === 'connecting' ? 'Loading collection...' : 'No current selection'}
              </Text>
            </View>
          )}
        </View>

        {/* Open Collection Button */}
        <View style={styles.openAllButtonWrapper}>
          <TouchableOpacity
            ref={openCollectionButtonRef}
            style={[
              styles.openAllButton,
              currentFocusZone === FOCUS_ZONES.BUTTON && styles.openAllButtonFocused
            ]}
            onPress={() => navigation.navigate('SpecificCollection', { currentCollection: currentCollection })}
            hasTVPreferredFocus={currentFocusZone === FOCUS_ZONES.BUTTON}
            tvParallaxProperties={{
              enabled: currentFocusZone === FOCUS_ZONES.BUTTON,
            }}
            onFocus={() => setCurrentFocusZone(FOCUS_ZONES.BUTTON)}
          >
            <Text style={styles.openAllButtonText}>Open Current Collection</Text>
          </TouchableOpacity>
        </View>
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
  padding: 5, // ← Increase this only if you want more white space around the logo
  marginRight: 10,
},
logoImage: {
  width: 40,
  height: 40,
  resizeMode: 'contain',
},
  logoText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  statusText: {
    color: 'yellow',
    fontSize: 12,
    textAlign: 'center',
  },
  connectedText: {
    color: 'green',
    fontSize: 12,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
  },
  retryText: {
    color: 'orange',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});