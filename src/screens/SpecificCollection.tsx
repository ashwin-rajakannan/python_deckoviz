import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FavouriteCards from '../components/favouriteCards';
import TVCardScroller from '../components/TvCardScroller';
import { useTVEventHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CollectionCards from '../components/CollectionCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 300;
const SPACING = 16;

const SpecificCollection = ({ route }) => {
  const currentCollection = route?.params?.currentCollection;
  const tvCardScrollerRef = useRef();
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  const [focusOnCards, setFocusOnCards] = useState(false);
  const [focusedButton, setFocusedButton] = useState(null);
  const [focusOnButtons, setFocusOnButtons] = useState(false); // New state for button focus


  console.log('Current coll data is ',currentCollection)


  const handleCardPress = (item, index) => {
    navigation.navigate('DisplayArtWork', { artWork: item });
  };

  const handleDisplayPress = (item, index) => {
    navigation.navigate('DisplayArtWork', { artWork: item });
  };

 useTVEventHandler((evt) => {

  
  console.log('TV Event:', evt.eventType, 'focusOnButtons:', focusOnButtons, 'focusedButton:', focusedButton, 'focusOnCards:', focusOnCards);

  if (evt.eventType === 'up') {
    if (focusOnCards) {
      setFocusOnCards(false);
      setFocusOnButtons(true);
      setFocusedButton('start'); // Focus on start button (bottom button) when coming from cards
    } else if (focusOnButtons) {
      if (focusedButton === 'start') {
        setFocusedButton('browse'); // Move from start to browse (upward)
      } else if (focusedButton === 'browse') {
        // Already at top button, can either stay or exit button focus
        setFocusOnButtons(false);
        setFocusedButton(null);
      }
    }
  } else if (evt.eventType === 'down') {
    if (focusOnButtons) {
      if (focusedButton === 'browse') {
        setFocusedButton('start'); // Move from browse to start (downward)
      } else if (focusedButton === 'start') {
        // Move from start button to cards
        setFocusOnButtons(false);
        setFocusOnCards(true);
        setFocusedButton(null);
      }
    } else if (!focusOnCards && !focusOnButtons) {
      
        setFocusOnButtons(true);
        setFocusedButton('browse'); // Start with browse button (top button)
      }
    
  } else if (evt.eventType === 'left') {
    if (focusOnCards) {
      tvCardScrollerRef.current?.scrollLeft?.();
    }
    // Remove left/right navigation for buttons since they're vertically stacked
  } else if (evt.eventType === 'right') {
    if (focusOnCards) {
      tvCardScrollerRef.current?.scrollRight?.();
    }
    // Remove left/right navigation for buttons since they're vertically stacked
  } else if (evt.eventType === 'select') {
    console.log('Select pressed - focusOnButtons:', focusOnButtons, 'focusedButton:', focusedButton);
    
    if (focusOnCards) {
      const currentCardIndex = tvCardScrollerRef.current?.getCurrentIndex?.();
      if (typeof currentCardIndex === 'number') {
        handleCardPress(currentCardIndex);
      }
    } else if (focusOnButtons && focusedButton) {
      if (focusedButton === 'browse') {
        console.log('Navigating to Browse Mode');
        const displayTime = Math.round(currentCollection?.display_time / 60) + ' Min';
        const images = currentCollection?.collection_images?.map((item) => ({
          id: item.id,
          uri: item.image.file,
          title: item.image.title || `Artwork ${item.id}`,
        }));
        navigation.navigate('BrowseModeScreen', {
          displayTime,
          images,
          collectionName: currentCollection.name,
        });
      } else if (focusedButton === 'start') {
        console.log('Navigating to DisplayArtWork');
        navigation.navigate('DisplayArtWork', {
          collection_images: currentCollection.collection_images,
          display_time: Math.round(currentCollection.display_time / 60),
          music: currentCollection.music,
        });
      }
    }
  }
});

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const onBackPress = () => {
    navigation.goBack();
  };

  // ✅ SHOW THIS WHEN NO COLLECTION
  if (!currentCollection || !currentCollection.collection_images || currentCollection.collection_images.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 20 }}>No Collection Available</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: '#6F48DB', padding: 10, borderRadius: 6, marginTop: 20 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.background} contentContainerStyle={{paddingBottom:20}}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{currentCollection.name}</Text>
      </View>

   {/*  {/* Debug Info - Remove this in production 
      <View style={{ position: 'absolute', top: 80, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 4, zIndex: 100 }}>
        <Text style={{ color: 'white', fontSize: 10 }}>
          Buttons: {focusOnButtons ? 'TRUE' : 'FALSE'} | Focused: {focusedButton || 'NONE'} | Cards: {focusOnCards ? 'TRUE' : 'FALSE'}
        </Text>
      </View>*/}

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Description Box */}
        <View style={styles.descriptionBox}>
          <View style={{ flex: 1 }}>
            <View style={styles.infoHeader}>
              <Text style={styles.subTitle}>{currentCollection.name}</Text>
              <View style={styles.infoTextContainer}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={24} color="white" />
                  <Text style={styles.infoText}>{Math.round(currentCollection.display_time / 60)} Min</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="images-outline" size={24} color="white" />
                  <Text style={styles.infoText}> {currentCollection.collection_images?.length} Pieces</Text>
                </View>
              </View>
            </View>

            <Text style={styles.descriptionText}>{currentCollection.description}</Text>

            <View style={styles.tagRow}>
              <View style={styles.tagGroup}>
                {currentCollection?.tags?.length > 0 &&
                  JSON.parse(currentCollection.tags[0]).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag || ''}</Text>
                    </View>
                  ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.browseButton,
                  focusOnButtons && focusedButton === 'browse' && styles.focusedButton
                ]}
                onPress={() => {
                  const displayTime = Math.round(currentCollection?.display_time / 60) + ' Min';
                  const images = currentCollection?.collection_images?.map((item) => ({
                    id: item.id,
                    uri: item.image.file,
                    title: item.image.title || `Artwork ${item.id}`,
                  }));
                  navigation.navigate('BrowseModeScreen', {
                    displayTime,
                    images,
                    collectionName: currentCollection.name,
                  });
                }}
              >
                <Text style={styles.browseButtonText}>Start in Browse Mode</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="musical-notes" size={18} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.footerText}>
                {currentCollection.musicTitle || 'Beautiful things By McSlang'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.startButton,
                focusOnButtons && focusedButton === 'start' && styles.focusedButton
              ]}
              onPress={() =>
                navigation.navigate('DisplayArtWork', {
                  collection_images: currentCollection.collection_images,
                  display_time: Math.round(currentCollection.display_time / 60),
                  music: currentCollection.music,
                })
              }
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Box */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                currentCollection?.collection_images?.[0]?.image?.file ??
                'https://images.unsplash.com/photo-1747134392471-831ea9a48e1e?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            }}
            style={styles.imageBox}
          />
        </View>
      </View>

      {/* TV Card Scroller */}
      <TVCardScroller
        ref={tvCardScrollerRef}
        hasFocus={focusOnCards}
        CardComponent={FavouriteCards}
        onCardPress={handleCardPress}
        onDisplayPress={handleDisplayPress}
        data={currentCollection}
      />
    </ScrollView>
  );
};

export default SpecificCollection;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  cardSpacing: {
    marginRight: 16,
  },
  headerContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  contentContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    marginBottom: 20,
  },
  infoTextContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  descriptionBox: {
    width: '50%',
    height: 260,
    padding: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  descriptionText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagGroup: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: '#452D8E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  footerText: {
    color: 'white',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#6F48DB',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  startButtonText: {
    color: 'white',
    paddingHorizontal: 10,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '50%',
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBox: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  browseButton: {
    backgroundColor: '#6F48DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  focusedButton: {
    borderColor: '#fff',
    borderWidth: 2,
    backgroundColor: '#8A5FE8', // Slightly lighter when focused
  },
});