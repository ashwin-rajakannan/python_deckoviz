import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  useTVEventHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import FavouriteCards from '../components/favouriteCards';
import { useFavorites } from '../components/context/FavouriteCollections';
import { useCollectionQueue } from '../components/context/CollectionQueue'; // Adjust path as needed

const FILTERS = ['All', 'Favourite'];

const AllTimeFavourite= () => {
  const navigation = useNavigation();
  const { collectionQueue = [] } = useCollectionQueue();

  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const [activeFilter, setActiveFilter] = useState('All');
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);
  const [focusedFilterIndex, setFocusedFilterIndex] = useState(0);
  const [focusSection, setFocusSection] = useState('filters');

  const flatListRef = useRef();

  useEffect(() => {
    console.log('Collections in Queue:', collectionQueue);
  }, [collectionQueue]);

  const cardData = favorites.map((collection, index) => {
    const thumbnail = collection.collection_images?.[0]?.image?.file || null;
    return {
      id: collection.id || index.toString(),
      title: collection.name || `Collection ${index + 1}`,
      description: collection.description || 'No description available',
      tags: JSON.parse(collection.tags?.[0] || '[]'),
      thumbnail,
      fullData: collection,
    };
  });

  const filteredData =
    activeFilter === 'Favourite'
      ? cardData.filter((item) => isFavorite(item.id))
      : cardData;

  const onBackPress = () => {
    navigation.goBack();
  };

  const handleDisplayPress = (item) => {
    navigation.navigate('SpecificCollection', { currentCollection: item });
  };

const handleHeartPress = (item) => {
  toggleFavorite(item.fullData);
};
  useTVEventHandler((evt) => {
    if (evt.eventType === 'right') {
      if (focusSection === 'filters' && focusedFilterIndex < FILTERS.length - 1) {
        const newIndex = focusedFilterIndex + 1;
        setFocusedFilterIndex(newIndex);
        setActiveFilter(FILTERS[newIndex]);
      } else if (focusSection === 'cards' && focusedCardIndex < filteredData.length - 1) {
        const newIndex = focusedCardIndex + 1;
        setFocusedCardIndex(newIndex);
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      }
    }

    if (evt.eventType === 'left') {
      if (focusSection === 'filters' && focusedFilterIndex > 0) {
        const newIndex = focusedFilterIndex - 1;
        setFocusedFilterIndex(newIndex);
        setActiveFilter(FILTERS[newIndex]);
      } else if (focusSection === 'cards' && focusedCardIndex > 0) {
        const newIndex = focusedCardIndex - 1;
        setFocusedCardIndex(newIndex);
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      }
    }

    if (evt.eventType === 'down' && focusSection === 'filters') {
      setFocusSection('cards');
    }

    if (evt.eventType === 'up' && focusSection === 'cards') {
      setFocusSection('filters');
    }

    if (evt.eventType === 'select' && focusSection === 'cards') {
      const selected = filteredData[focusedCardIndex];
      if (selected) handleDisplayPress(selected.fullData);
    }
  });

  return (
    <ScrollView style={styles.background}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Icon name="angle-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>All Time Favorites</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTERS?.map((filter, index) => (
          <TouchableOpacity
            key={filter}
            onPress={() => {
              setActiveFilter(filter);
              setFocusedFilterIndex(index);
            }} 
            style={[
              styles.filterButton,
              activeFilter === filter && styles.activeFilterButton,
              focusedFilterIndex === index &&
                focusSection === 'filters' && {
                  borderWidth: 2,
                  borderColor: 'white',
                },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        ref={flatListRef}
        data={filteredData}
        keyExtractor={(item) => item.id}
        horizontal
        contentContainerStyle={styles.listContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={styles.cardSpacing}>
<FavouriteCards
  item={item}
  isFavorite={isFavorite(item.id)}
  onHeartPress={() => handleHeartPress(item)} // <-- pass full item
  onDisplayPress={() => handleDisplayPress(item.fullData)}
  data={{ file: item.thumbnail }}
  tags={item.tags}
  focused={focusSection === 'cards' && index === focusedCardIndex}
  buttonLabel="Open Collection"
/>
          </View>
        )}
        extraData={{ focusedCardIndex, favorites }}
      />
    </ScrollView>
  );
};

export default AllTimeFavourite;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  headerContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    height: 40,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
    zIndex: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 30,
    color: 'white',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    backgroundColor: '#2A2A3E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#6C5CE7',
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  activeFilterText: {
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardSpacing: {
    marginRight: 16,
  },
});
