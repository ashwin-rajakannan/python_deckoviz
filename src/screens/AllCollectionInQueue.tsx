import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import Logo from '../assets/logo.png';
import TVCardScroller from '../components/TvCardScroller';
import { useNavigation } from '@react-navigation/native';
import { useActiveCategory } from '../components/context/ActiveCategory';
import { useCollectionQueue } from '../components/context/CollectionQueue';
import { useFavorites } from '../components/context/FavouriteCollections';
import AllCollectionCard from '../components/AllCollectionCard';
import Icon from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 20;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;

const FOCUS_ZONES = {
  NAV: 'nav',
  CARDS: 'cards',
  VIEW_ALL_BUTTON: 'view_all_button',
  START_QUEUE_BUTTON: 'start_queue_button',
  QR_BUTTON: 'qr_button'
};

const VerticalNav = ({ 
  navItemRefs, 
  hasFocus, 
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
                  }, 1000);
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

export default function AllCollectionInQueue() {
  const navigation = useNavigation();
  const { activeCategory, setActiveCategory } = useActiveCategory();
  const [isLoading, setIsLoading] = useState(true);
  const navItemRefs = useRef([]);
  const [currentFocusZone, setCurrentFocusZone] = useState(FOCUS_ZONES.NAV);
  const isNavigatingRef = useRef(false);
  const scrollRef = useRef();
  const [activeIndex, setActiveIndex] = useState(0);
  const tvCardScrollerRef = useRef();
  const openAllButtonRef = useRef();
  const startQueueButtonRef = useRef();
  const { collectionQueue ,startQueue} = useCollectionQueue();
  const { favorites } = useFavorites();
  const [isInitialized, setIsInitialized] = useState(false);
  const lastEventTime = useRef(0);
  const qrButtonRef = useRef();

  const categories = [
    'Current Collection',
    'Permanent Collection On Device',
    'All Collection in Device Queue',
  ];

  const categoryToScreenMap = {
    'Current Collection': 'CurrentCollection',
    'Permanent Collection On Device': 'PermanentCollection',
    'All Collection in Device Queue': 'AllCollectionScreen',
  };

  useFocusEffect(
    useCallback(() => {
      isNavigatingRef.current = false;
      setCurrentFocusZone(FOCUS_ZONES.NAV);
      
      const currentCategoryIndex = categories.indexOf(activeCategory);
      if (currentCategoryIndex >= 0) {
        setTimeout(() => {
          navItemRefs.current[currentCategoryIndex]?.focus?.();
        }, 100);
      }

      return () => {
        isNavigatingRef.current = false;
      };
    }, [activeCategory])
  );

  const [previewCollections, setPreviewCollections] = useState([]);

  useEffect(() => {
    if (collectionQueue?.length > 0) {
      const twoCollections = [...collectionQueue].slice(0, 2);
      const fallbackCards = twoCollections.map((collection, idx) => {
        const firstImage =
          collection.collection_images?.[0]?.image?.file ||
          collection.collection_images?.[0]?.file ||
          'https://via.placeholder.com/300';

        return {
          id: `${collection.id}-${idx}`,
          name: collection.name || `Collection ${idx + 1}`,
          description: collection.description || 'No description available',
          image: firstImage,
          count: collection.collection_images?.length || 0,
          fullCollection: collection,
        };
      });
      setPreviewCollections(fallbackCards);
      setIsLoading(false);
    } else {
      setPreviewCollections([]);
      setIsLoading(false);
    }
  }, [collectionQueue]);

  useEffect(() => {
    if (isLoading) return;
    
    const currentCategoryIndex = categories.indexOf(activeCategory);
    if (currentFocusZone === FOCUS_ZONES.NAV && navItemRefs.current[currentCategoryIndex]) {
      const timeout = setTimeout(() => {
        navItemRefs.current[currentCategoryIndex]?.focus?.();
      }, 50);
      return () => clearTimeout(timeout);
    } else if (currentFocusZone === FOCUS_ZONES.CARDS && tvCardScrollerRef.current) {
      const timeout = setTimeout(() => {
        tvCardScrollerRef.current?.focusCurrentCard?.();
      }, 50);
      return () => clearTimeout(timeout);
    } else if (currentFocusZone === FOCUS_ZONES.VIEW_ALL_BUTTON && openAllButtonRef.current) {
      const timeout = setTimeout(() => {
        openAllButtonRef.current?.focus?.();
      }, 50);
      return () => clearTimeout(timeout);
    } else if (currentFocusZone === FOCUS_ZONES.START_QUEUE_BUTTON && startQueueButtonRef.current) {
      const timeout = setTimeout(() => {
        startQueueButtonRef.current?.focus?.();
      }, 50);
      return () => clearTimeout(timeout);
    } else if (currentFocusZone === FOCUS_ZONES.QR_BUTTON && qrButtonRef.current) {
      const timeout = setTimeout(() => {
        qrButtonRef.current?.focus?.();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [currentFocusZone, activeCategory, isLoading]);

  const handleNavigation = (screen, params = {}) => {
    if (isNavigatingRef.current) return;
    
    isNavigatingRef.current = true;
    navigation.navigate(screen, params);
    
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };

  const handleCardPress = (item) => {
    if (!item || isNavigatingRef.current) return;
    handleNavigation('SpecificCollection', { currentCollection: item });
  };

  const handleOpenAllPress = () => {
    if (isNavigatingRef.current || !collectionQueue?.length) return;
    handleNavigation('AllQueueCollection', { collectionQueue });
  };

// In AllCollectionInQueue.js
const handleStartQueuePress = () => {
  if (isNavigatingRef.current || !collectionQueue?.length) return;
  startQueue(); // Call this before navigation
  handleNavigation('QueueArtworkDisplay', { collectionQueue });
};
  useTVEventHandler((evt) => {
    if (isLoading || isNavigatingRef.current) return;
    
    const currentCategoryIndex = categories.indexOf(activeCategory);
    const isOnLastNavItem = currentCategoryIndex === categories.length - 1;
    const isOnFirstNavItem = currentCategoryIndex === 0;
    
    if (evt.eventType === 'select') {
      const now = Date.now();
      if (now - lastEventTime.current < 300) return;
      lastEventTime.current = now;
    }
    
    switch (evt.eventType) {
      case 'up':
        if (currentFocusZone === FOCUS_ZONES.VIEW_ALL_BUTTON || 
            currentFocusZone === FOCUS_ZONES.START_QUEUE_BUTTON) {
          if (collectionQueue?.length > 0) {
            setCurrentFocusZone(FOCUS_ZONES.CARDS);
          } else {
            setCurrentFocusZone(FOCUS_ZONES.NAV);
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          setCurrentFocusZone(FOCUS_ZONES.NAV);
        } else if (currentFocusZone === FOCUS_ZONES.NAV && !isOnFirstNavItem) {
          setActiveCategory(categories[currentCategoryIndex - 1]);
        } else if (currentFocusZone === FOCUS_ZONES.QR_BUTTON) {
          setCurrentFocusZone(FOCUS_ZONES.NAV);
        }
        break;

      case 'down':
        if (currentFocusZone === FOCUS_ZONES.NAV && !isOnLastNavItem) {
          setActiveCategory(categories[currentCategoryIndex + 1]);
        } else if (currentFocusZone === FOCUS_ZONES.NAV && isOnLastNavItem) {
          if (collectionQueue?.length > 0) {
            setCurrentFocusZone(FOCUS_ZONES.CARDS);
          } else {
            setCurrentFocusZone(FOCUS_ZONES.VIEW_ALL_BUTTON);
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          setCurrentFocusZone(FOCUS_ZONES.VIEW_ALL_BUTTON);
        }
        break;

      case 'left':
        if (currentFocusZone === FOCUS_ZONES.VIEW_ALL_BUTTON) {
          setCurrentFocusZone(FOCUS_ZONES.START_QUEUE_BUTTON);
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          const currentCardIndex = tvCardScrollerRef.current?.getCurrentIndex?.() || 0;
          if (currentCardIndex === 0) {
            setCurrentFocusZone(FOCUS_ZONES.NAV);
          } else {
            tvCardScrollerRef.current?.scrollLeft();
          }
        } else if (currentFocusZone === FOCUS_ZONES.NAV) {
          setCurrentFocusZone(FOCUS_ZONES.QR_BUTTON);
        }
        break;

      case 'right':
        if (currentFocusZone === FOCUS_ZONES.START_QUEUE_BUTTON) {
          setCurrentFocusZone(FOCUS_ZONES.VIEW_ALL_BUTTON);
        } else if (currentFocusZone === FOCUS_ZONES.NAV) {
          if (collectionQueue?.length > 0) {
            setCurrentFocusZone(FOCUS_ZONES.CARDS);
          } else {
            setCurrentFocusZone(FOCUS_ZONES.VIEW_ALL_BUTTON);
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          tvCardScrollerRef.current?.scrollRight();
        } else if (currentFocusZone === FOCUS_ZONES.QR_BUTTON) {
          setCurrentFocusZone(FOCUS_ZONES.NAV);
        }
        break;

      case 'select':
        if (currentFocusZone === FOCUS_ZONES.NAV) {
          const screen = categoryToScreenMap[activeCategory];
          if (screen) {
            handleNavigation(screen);
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          const currentCardIndex = tvCardScrollerRef.current?.getCurrentIndex?.() || 0;
          const selectedItem = collectionQueue?.[currentCardIndex];
          if (selectedItem) {
            handleCardPress(selectedItem);
          }
        } else if (currentFocusZone === FOCUS_ZONES.VIEW_ALL_BUTTON) {
          handleOpenAllPress();
        } else if (currentFocusZone === FOCUS_ZONES.START_QUEUE_BUTTON) {
          handleStartQueuePress();
        } else if (currentFocusZone === FOCUS_ZONES.QR_BUTTON) {
          handleNavigation('Home');
        }
        break;

      default:
        break;
    }
  });

  const onScroll = (e) => {
    if (isLoading) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + HORIZONTAL_MARGIN));
    setActiveIndex(index);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading collections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image source={Logo} style={styles.logoImage} />
            </View>
            <Text style={styles.logoText}>Deckoviz</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              ref={qrButtonRef}
              style={[
                styles.qrButton,
                currentFocusZone === FOCUS_ZONES.QR_BUTTON && styles.qrButtonFocused
              ]}
              onPress={() => navigation.navigate('Home')}
              hasTVPreferredFocus={currentFocusZone === FOCUS_ZONES.QR_BUTTON}
              onFocus={() => setCurrentFocusZone(FOCUS_ZONES.QR_BUTTON)}
            >
              <Icon name="qr-code" size={24} color="white" />
            </TouchableOpacity>
            <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profilePic} />
          </View>
        </View>

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
            {previewCollections.map((item, index) => {
              const imageUrl = item.image || 'https://via.placeholder.com/300';
              const title = item.name || 'Untitled Collection';
              const description = item.description || 'No description available';
              const imageCount = item.count || 0;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.cardContainer,
                    {
                      width: CARD_WIDTH,
                      marginRight: index === previewCollections.length - 1 ? 0 : HORIZONTAL_MARGIN,
                    },
                  ]}
                >
                  <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.cardBackground}
                    imageStyle={styles.cardImage}
                  >
                    <View style={styles.cardTextWrapper}>
                      <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                        {title}
                      </Text>
                      <Text style={styles.cardSubtitle}>{imageCount} {imageCount === 1 ? 'Image' : 'Images'}</Text>
                      <Text 
                        style={styles.cardDescription} 
                        numberOfLines={2} 
                        ellipsizeMode="tail"
                      >
                        {description}
                      </Text>
                    </View>

                    <View style={styles.pagination}>
                      {previewCollections.map((_, dotIndex) => (
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

        <View style={styles.navAndFavouritesContainer}>
          <VerticalNav
            navItemRefs={navItemRefs}
            hasFocus={currentFocusZone === FOCUS_ZONES.NAV}
            navigation={navigation}
            categoryToScreenMap={categoryToScreenMap}
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            isNavigatingRef={isNavigatingRef}
          />
          
          {collectionQueue?.length > 0 ? (
            <TVCardScroller
              ref={tvCardScrollerRef}
              hasFocus={currentFocusZone === FOCUS_ZONES.CARDS}
              data={collectionQueue}
              CardComponent={AllCollectionCard}
              onCardPress={handleCardPress}
              cardType="Collections"
            />
          ) : (
            <View style={styles.emptyMessageContainer}>
              <Text style={styles.emptyMessageText}>No collections in queue</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            ref={startQueueButtonRef}
            style={[
              styles.queueButton,
              currentFocusZone === FOCUS_ZONES.START_QUEUE_BUTTON && styles.queueButtonFocused
            ]}
            onPress={handleStartQueuePress}
            hasTVPreferredFocus={currentFocusZone === FOCUS_ZONES.START_QUEUE_BUTTON}
            onFocus={() => setCurrentFocusZone(FOCUS_ZONES.START_QUEUE_BUTTON)}
          >
            <Text style={styles.queueButtonText}>Start Queue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            ref={openAllButtonRef}
            style={[
              styles.openAllButton,
              currentFocusZone === FOCUS_ZONES.VIEW_ALL_BUTTON && styles.openAllButtonFocused
            ]}
            onPress={handleOpenAllPress}
            hasTVPreferredFocus={currentFocusZone === FOCUS_ZONES.VIEW_ALL_BUTTON}
            onFocus={() => setCurrentFocusZone(FOCUS_ZONES.VIEW_ALL_BUTTON)}
          >
            <Text style={styles.openAllButtonText}>
              {collectionQueue?.length 
                ? `View All (${collectionQueue.length})` 
                : 'No Collections'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  mainContent: { 
    flex: 1, 
    paddingTop: 40 
  },
  scrollViewContent: {
    paddingBottom: 60,
  },
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
  activeNavItem: { 
    backgroundColor: '#683DD8' 
  },
  navText: { 
    fontSize: 14, 
    color: 'white', 
    fontWeight: '500' 
  },
  focusedNavItem: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
  },
  qrButtonFocused: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoBackground: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
    marginRight: 10,
  },
  logoImage: { 
    width: 40, 
    height: 40, 
    resizeMode: 'contain' 
  },
  logoText: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  profilePic: { 
    width: 40, 
    height: 40, 
    borderRadius: 20 
  },
  carouselContainer: {
    height: 220,
    justifyContent: 'center',
    marginBottom: 20,
  },
  scrollContent: { 
    paddingHorizontal: HORIZONTAL_MARGIN 
  },
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
  cardImage: { 
    borderRadius: 0 
  },
  cardTextWrapper: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
  },
  cardTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: { 
    color: 'white', 
    fontSize: 14, 
    marginBottom: 4,
  },
  cardDescription: { 
    color: 'white', 
    fontSize: 12,
  },
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
  activeDot: { 
    width: 20, 
    borderRadius: 5, 
    backgroundColor: 'white' 
  },
  navAndFavouritesContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    minHeight: 300,
  },
buttonsContainer: {
  marginTop: 10, // <-- Add this for space between cards and buttons
  marginBottom: 20,
  right: 20,
  flexDirection: 'row',
  position: 'relative', // optional: better for scrollable layouts than absolute
  justifyContent: 'flex-end',
},

openAllButton: {
  backgroundColor: '#683DD8',
  paddingVertical: 10, // reduced
  paddingHorizontal: 18, // reduced
  borderRadius: 20,
  minWidth: 140, // reduced
  marginLeft: 10,
  alignItems: 'center',
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
    transform: [{ scale: 1.05 }],
  },
openAllButtonText: {
  color: 'white',
  fontSize: 14, // reduced
  fontWeight: 'bold',
  textAlign: 'center',
},
queueButton: {
  backgroundColor: '#683DD8',
  paddingVertical: 10, // reduced
  paddingHorizontal: 18, // reduced
  borderRadius: 20,
  minWidth: 140, // reduced
  alignItems: 'center',
  marginLeft: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
  elevation: 5,
},
queueButtonFocused: {
  borderWidth: 3,
  borderColor: '#FFD700',
  backgroundColor: '#7B4AE8', // consistent with openAllButtonFocused
  transform: [{ scale: 1.05 }],
},
 queueButtonText: {
  color: 'white',
  fontSize: 14, // reduced
  fontWeight: 'bold',
  textAlign: 'center',
},
  emptyMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(30, 31, 63, 0.7)',
    borderRadius: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  emptyMessageText: {
    color: '#BBB',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});