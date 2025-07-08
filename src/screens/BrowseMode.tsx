import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
    useTVEventHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FancyCard from '../components/openCollectionCards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 300;
const SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;
const CARD_BORDER_RADIUS = 20; // Match this with your FancyCard's borderRadius

const BrowseModeScreen = ({ route, navigation }) => {
  const { displayTime, images, collectionName,music } = route.params;
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const onBackPress = () => {
    navigation.goBack();
  };


// TV remote left/right handling
useTVEventHandler((evt) => {

    if (evt?.eventType === 'back') {
    // Optional: Show confirmation
    navigation.goBack();
   
  }

  if (evt?.eventType === 'right') {
    scrollToIndex(currentIndex + 1);
  } else if (evt?.eventType === 'left') {
    scrollToIndex(currentIndex - 1);
  } else if (evt?.eventType === 'select') {
    const selectedItem = images[currentIndex];
    if (selectedItem) {
      console.log('selected',selectedItem)
    //  navigation.navigate('DisplayArtWork', { artWork: selectedItem });
    }
  }
});
  const scrollToIndex = (index) => {
    if (index >= 0 && index < images?.length) {
      setCurrentIndex(index);
      flatListRef.current?.scrollToOffset({
        offset: index * SNAP_INTERVAL,
        animated: true,
      });
    }
  };

  useEffect(() => {
    setTimeout(() => scrollToIndex(0), 100);
  }, []);

  const renderItem = ({ item, index }) => {
  const inputRange = [
    (index - 1) * SNAP_INTERVAL,
    index * SNAP_INTERVAL,
    (index + 1) * SNAP_INTERVAL,
  ];


  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1.1, 0.9],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.6, 1, 0.6],
    extrapolate: 'clamp',
  });

  console.log('isss',item)
  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale }],
          opacity,
          marginHorizontal: SPACING / 2,
        },
      ]}
    >
      <FancyCard
        imageUrl={item.uri}
        title={item.title}
        description={item.description}
        onPress={() =>
        navigation.navigate('DisplayArtWork', { artWork: item,music:music })
        }
      />
    </Animated.View>
  );
};
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{collectionName}</Text>
        <View style={styles.infoTextContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="white" />
            <Text style={styles.infoText}>{displayTime}</Text>
          </View>
        </View>
      </View>

<Animated.FlatList
  ref={flatListRef}
  data={images}
  keyExtractor={(item) => item.id.toString()}
  renderItem={renderItem}
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - SPACING / 2,
    paddingBottom: 40, // ✅ Add this to avoid clipping on scale
  }}
  snapToInterval={SNAP_INTERVAL}
  decelerationRate="fast"
  scrollEventThrottle={16}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  )}
  onMomentumScrollEnd={(e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }}
/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  headerContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 4,
    zIndex: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 6,
  },
  cardContainer: {
    width: CARD_WIDTH,
    borderRadius: CARD_BORDER_RADIUS, // Base borderRadius
  },
});

export default BrowseModeScreen;