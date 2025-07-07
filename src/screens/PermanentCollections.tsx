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
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Logo from '../assets/logo.png';
import TVCardScroller from '../components/TvCardScroller';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useActiveCategory } from '../components/context/ActiveCategory';
import { useFavorites } from '../components/context/FavouriteCollections';
import AllCollectionCard from '../components/AllCollectionCard';
import { useTVEventHandler } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 20;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;

const FOCUS_ZONES = {
  HEADER: 'header',
  NAV: 'nav',
  CARDS: 'cards',
  BUTTON: 'button'
};

const VerticalNav = React.memo(({ 
  navItemRefs, 
  hasFocus, 
  navigation, 
  categoryToScreenMap, 
  categories, 
  activeCategory, 
  setActiveCategory, 
  isNavigatingRef,
  currentFocusZone,
  setCurrentFocusZone,
  safeNavigate
}) => {
  return (
    <View style={styles.navContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category}
            ref={(ref) => { navItemRefs.current[index] = ref; }}
            onPress={() => {
              if (!hasFocus || isNavigatingRef.current) return;
              const screen = categoryToScreenMap[category];
              if (screen && screen !== 'PermanentCollection') {
                safeNavigate(screen);
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
              enabled: hasFocus && currentFocusZone === FOCUS_ZONES.NAV,
            }}
            onFocus={() => {
              if (hasFocus) {
                setActiveCategory(category);
                setCurrentFocusZone(FOCUS_ZONES.NAV);
              }
            }}
          >
            <Text style={styles.navText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

export default function PermanentCollection() {
  const navigation = useNavigation();
  const { activeCategory, setActiveCategory } = useActiveCategory();
  const navItemRefs = useRef([]);
  const [currentFocusZone, setCurrentFocusZone] = useState(FOCUS_ZONES.NAV);
  const isNavigatingRef = useRef(false);
  
  const scrollRef = useRef();
  const [activeIndex, setActiveIndex] = useState(0);
  const tvCardScrollerRef = useRef();
  const openAllButtonRef = useRef();
  const { favorites } = useFavorites();
  const [randomFavorites, setRandomFavorites] = useState([]);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [currentHeaderButton, setCurrentHeaderButton] = useState('qr');
  const qrButtonRef = useRef(null);
  const profileButtonRef = useRef(null);
  const lastNavigationTime = useRef(0);

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

  // 1. Safe navigation function with lock and cooldown
  const safeNavigate = useCallback((screenName, params) => {
    const now = Date.now();
    const navigationCooldown = 500; // ms
    
    if (isNavigatingRef.current || (now - lastNavigationTime.current < navigationCooldown)) {
      return;
    }

    isNavigatingRef.current = true;
    lastNavigationTime.current = now;

    navigation.navigate(screenName, params);

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, navigationCooldown);
  }, [navigation]);

  // 2. Get random favorites with memoization
  const getTwoRandomFavorites = useCallback((collections) => {
    if (!collections || collections.length === 0) return [];
    const shuffled = [...collections].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }, []);

  useEffect(() => {
    setRandomFavorites(getTwoRandomFavorites(favorites));
  }, [favorites, getTwoRandomFavorites]);

  // 3. Back handler with focus zone management
  const handleBackPress = useCallback(() => {
    if (currentFocusZone !== FOCUS_ZONES.NAV) {
      setCurrentFocusZone(FOCUS_ZONES.NAV);
      return true;
    }
    return false;
  }, [currentFocusZone]);

  // 4. Focus management setup
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      isNavigatingRef.current = false;
      
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

      return () => {
        setIsScreenFocused(false);
        backHandler.remove();
      };
    }, [handleBackPress])
  );

  // 5. Focus zone effect
  useEffect(() => {
    if (!isScreenFocused) return;

    const focusTimeout = setTimeout(() => {
      try {
        switch (currentFocusZone) {
          case FOCUS_ZONES.HEADER:
            if (currentHeaderButton === 'qr') {
              qrButtonRef.current?.focus?.();
            } else {
              profileButtonRef.current?.focus?.();
            }
            break;
          case FOCUS_ZONES.NAV:
            const currentCategoryIndex = categories.indexOf(activeCategory);
            navItemRefs.current[currentCategoryIndex]?.focus?.();
            break;
          case FOCUS_ZONES.BUTTON:
            openAllButtonRef.current?.focus?.();
            break;
          case FOCUS_ZONES.CARDS:
            tvCardScrollerRef.current?.focusCurrentCard?.();
            break;
        }
      } catch (error) {
        console.warn('Focus error:', error);
      }
    }, 50);

    return () => clearTimeout(focusTimeout);
  }, [currentFocusZone, activeCategory, currentHeaderButton, isScreenFocused]);

  // 6. TV event handler with throttle
  const lastEventTime = useRef(0);
  const eventThrottle = 300;

  const handleTVEvent = useCallback((evt) => {
    if (!isScreenFocused || isNavigatingRef.current) return;
    
    const now = Date.now();
    if (now - lastEventTime.current < eventThrottle) return;
    lastEventTime.current = now;

    const currentCategoryIndex = categories.indexOf(activeCategory);
    
    switch (evt.eventType) {
      case 'up':
        if (currentFocusZone === FOCUS_ZONES.BUTTON) {
          setCurrentFocusZone(favorites.length > 0 ? FOCUS_ZONES.CARDS : FOCUS_ZONES.NAV);
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          setCurrentFocusZone(FOCUS_ZONES.NAV);
        } else if (currentFocusZone === FOCUS_ZONES.NAV) {
          if (currentCategoryIndex > 0) {
            setActiveCategory(categories[currentCategoryIndex - 1]);
          } else {
            setCurrentFocusZone(FOCUS_ZONES.HEADER);
            setCurrentHeaderButton('qr');
          }
        }
        break;

      case 'down':
        if (currentFocusZone === FOCUS_ZONES.HEADER) {
          setCurrentFocusZone(FOCUS_ZONES.NAV);
        } else if (currentFocusZone === FOCUS_ZONES.NAV) {
          if (currentCategoryIndex < categories.length - 1) {
            setActiveCategory(categories[currentCategoryIndex + 1]);
          } else {
            setCurrentFocusZone(favorites.length > 0 ? FOCUS_ZONES.CARDS : FOCUS_ZONES.BUTTON);
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          setCurrentFocusZone(FOCUS_ZONES.BUTTON);
        }
        break;

      case 'left':
        if (currentFocusZone === FOCUS_ZONES.HEADER) {
          setCurrentHeaderButton(prev => prev === 'qr' ? 'profile' : 'qr');
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          const currentCardIndex = tvCardScrollerRef.current?.getCurrentIndex() || 0;
          if (currentCardIndex === 0) {
            setCurrentFocusZone(FOCUS_ZONES.NAV);
          } else {
            tvCardScrollerRef.current?.scrollLeft();
          }
        }
        break;

      case 'right':
        if (currentFocusZone === FOCUS_ZONES.HEADER) {
          setCurrentHeaderButton(prev => prev === 'qr' ? 'profile' : 'qr');
        } else if (currentFocusZone === FOCUS_ZONES.NAV && favorites.length > 0) {
          setCurrentFocusZone(FOCUS_ZONES.CARDS);
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          tvCardScrollerRef.current?.scrollRight();
        }
        break;

      case 'select':
        if (currentFocusZone === FOCUS_ZONES.HEADER && currentHeaderButton === 'qr') {
          safeNavigate('Home');
        } else if (currentFocusZone === FOCUS_ZONES.NAV) {
          const screen = categoryToScreenMap[activeCategory];
          if (screen && screen !== 'PermanentCollection') {
            safeNavigate(screen);
          }
        } else if (currentFocusZone === FOCUS_ZONES.CARDS) {
          const focusedIndex = tvCardScrollerRef.current?.getCurrentIndex() || 0;
          const currentItem = favorites[focusedIndex];
          if (currentItem) {
            safeNavigate('SpecificCollection', { currentCollection: currentItem });
          }
        } else if (currentFocusZone === FOCUS_ZONES.BUTTON) {
          safeNavigate('AllTimeFavourite');
        }
        break;

      default:
        break;
    }
  }, [
    currentFocusZone, 
    activeCategory, 
    favorites, 
    isScreenFocused, 
    categories, 
    currentHeaderButton,
    safeNavigate
  ]);

  useTVEventHandler(handleTVEvent);

  const onScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + HORIZONTAL_MARGIN));
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
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
                currentFocusZone === FOCUS_ZONES.HEADER && 
                currentHeaderButton === 'qr' && 
                styles.headerButtonFocused
              ]}
              onPress={() => safeNavigate('Home')}
              hasTVPreferredFocus={currentFocusZone === FOCUS_ZONES.HEADER && currentHeaderButton === 'qr'}
              tvParallaxProperties={{
                enabled: currentFocusZone === FOCUS_ZONES.HEADER,
              }}
              onFocus={() => {
                setCurrentFocusZone(FOCUS_ZONES.HEADER);
                setCurrentHeaderButton('qr');
              }}
            >
              <Icon name="qr-code" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              ref={profileButtonRef}
              style={[
                styles.headerButton,
                currentFocusZone === FOCUS_ZONES.HEADER && 
                currentHeaderButton === 'profile' && 
                styles.headerButtonFocused
              ]}
              onPress={() => {}}
              hasTVPreferredFocus={currentFocusZone === FOCUS_ZONES.HEADER && currentHeaderButton === 'profile'}
              tvParallaxProperties={{
                enabled: currentFocusZone === FOCUS_ZONES.HEADER,
              }}
              onFocus={() => {
                setCurrentFocusZone(FOCUS_ZONES.HEADER);
                setCurrentHeaderButton('profile');
              }}
            >
              <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profilePic} />
            </TouchableOpacity>
          </View>
        </View>

        {randomFavorites.length > 0 && (
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
              {randomFavorites.map((collection, index) => {
                const imageUrl =
                  collection.collection_images?.[0]?.image?.file ||
                  collection.collection_images?.[0]?.file ||
                  'https://via.placeholder.com/300';
                const title = collection.name || 'Untitled Collection';
                const description = collection.description || 'No description available';
                const imageCount = collection.collection_images?.length || 0;

                return (
                  <View
                    key={collection.id}
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
                        <Text style={styles.cardSubtitle}>{imageCount} Images</Text>
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
        )}

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
            currentFocusZone={currentFocusZone}
            setCurrentFocusZone={setCurrentFocusZone}
            safeNavigate={safeNavigate}
          />
          
          {favorites.length === 0 ? (
            <View style={styles.emptyMessage}>
              <Text style={styles.emptyText}>No Favorites Stored On Device</Text>
            </View>
          ) : (
            <TVCardScroller
              ref={tvCardScrollerRef}
              hasFocus={currentFocusZone === FOCUS_ZONES.CARDS}
              CardComponent={AllCollectionCard}
              onCardPress={(item) => safeNavigate('SpecificCollection', { currentCollection: item })}
              cardType='Collections'
              data={favorites}
              onFocus={() => setCurrentFocusZone(FOCUS_ZONES.CARDS)}
            />
          )}
        </View>

        <View style={styles.openAllButtonWrapper}>
          <TouchableOpacity
            ref={openAllButtonRef}
            style={[
              styles.openAllButton,
              currentFocusZone === FOCUS_ZONES.BUTTON && styles.openAllButtonFocused
            ]}
            onPress={() => safeNavigate('AllTimeFavourite')}
            hasTVPreferredFocus={currentFocusZone === FOCUS_ZONES.BUTTON}
            tvParallaxProperties={{
              enabled: currentFocusZone === FOCUS_ZONES.BUTTON,
            }}
            onFocus={() => setCurrentFocusZone(FOCUS_ZONES.BUTTON)}
          >
            <Text style={styles.openAllButtonText}>Open All Collections Stored On Device</Text>
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
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoBackground: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
    marginRight: 10,
  },
  logoImage: { width: 40, height: 40, resizeMode: 'contain' },
  logoText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
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
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  openAllButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyMessage: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    fontStyle: 'italic',
  }
});