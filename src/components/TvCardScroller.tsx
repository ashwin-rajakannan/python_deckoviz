import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity
} from 'react-native';
import FavouriteCards from '../components/favouriteCards';
import CollectionCard from './collectionCards';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = SCREEN_WIDTH * 0.3;
const SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;

const TVCardScroller = forwardRef(({ hasFocus, CardComponent, onCardPress, onDisplayPress, cardType, data }, ref) => {
  const tags = data?.tags;
  const DATA = Array.isArray(data) ? data : data?.collection_images || [];
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Start from 0 instead of 1
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    console.log('Tagsss', data);
  }, [data]);

  const scrollToIndex = (index) => {
    if (index >= 0 && index < DATA.length && flatListRef.current) {
      setCurrentIndex(index);
      flatListRef.current.scrollToOffset({
        offset: index * SNAP_INTERVAL,
        animated: true,
      });
    }
  };

  // Initialize after mount
  useEffect(() => {
    if (DATA.length > 0) {
      const timer = setTimeout(() => {
        setIsMounted(true);
        if (DATA.length > 1) {
          scrollToIndex(1); // Start from second item if available
          setCurrentIndex(1);
        } else {
          setCurrentIndex(0);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [DATA.length]);

  useImperativeHandle(ref, () => ({
    scrollLeft: () => {
      const newIndex = Math.max(0, currentIndex - 1);
      scrollToIndex(newIndex);
    },
    scrollRight: () => {
      const newIndex = Math.min(DATA.length - 1, currentIndex + 1);
      scrollToIndex(newIndex);
    },
    scrollUp: () => setCurrentIndex((prev) => prev),
    getCurrentIndex: () => currentIndex,
    focusCurrentCard: () => {
      // This method can be called to ensure the current card is focused
      // You might need to implement actual focus logic here based on your card component
      return currentIndex;
    },
  }));

  const onMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SNAP_INTERVAL);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < DATA.length) {
      setCurrentIndex(newIndex);
    }
  };

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



    const isArrayData = Array.isArray(data);

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale }],
            opacity,
            borderWidth: hasFocus && index === currentIndex ? 2 : 0,
            borderColor: '#683DD8',
          },
        ]}
      >
        <TouchableOpacity 
          onPress={() => {
            console.log('Card pressed:', item);
            onCardPress && onCardPress(item);
          }}
          activeOpacity={0.8}
        >
          <CardComponent
            width={CARD_WIDTH}
            height={CARD_WIDTH}
            focused={hasFocus && index === currentIndex}
            onDisplayPress={() => onDisplayPress?.(item, index)}
            cardType={cardType}
            tags={isArrayData ? item.tags : data.tags}
            data={
              isArrayData
                ? item
                : {
                    ...item.image,
                    title: item.image.title || `Image ${index + 1}`,
                    description: item?.image?.description ||  data?.description || '',
                    music: data?.music || '',
                  }
            }
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!DATA.length) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <Animated.FlatList
        ref={flatListRef}
        data={DATA}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: (SCREEN_WIDTH - SNAP_INTERVAL) / 2,
        }}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={onMomentumScrollEnd}
        removeClippedSubviews={false}
        initialScrollIndex={0}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0E0E23',
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING / 2,
  }, 
});

export default TVCardScroller;