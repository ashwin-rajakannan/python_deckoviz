import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const FavouriteCards = ({
  item = {},
  data = {},
  width = 400,
  height = 400,
  focused = false,
  isFavorite = false,
  onHeartPress = () => {},
  onDisplayPress = () => {},
  buttonLabel = 'Display',
  tags = '["Modern", "Contemporary"]',
}) => {
  const imageHeight = height * 0.6;
  const contentHeight = height * 0.4;
  const scale = width / 400;

  const fallbackSource = item?.file || data?.file || 'https://via.placeholder.com/400x240?text=No+Image';
  const fallbackTitle = item?.title || data?.title || 'Fallen Angel\'s Grace';
  const fallbackDescription = item?.description || data?.description || 'Once radiant with divine light, the fallen angel now drifts between heaven and earth.';
  const rawTags = item?.tags || data?.tags || tags;

let parsedTags = [];
try {
  if (typeof rawTags === 'string') {
    parsedTags = JSON.parse(rawTags);
  } else if (Array.isArray(rawTags)) {
    if (
      rawTags.length === 1 &&
      typeof rawTags[0] === 'string' &&
      rawTags[0].startsWith('[')
    ) {
      parsedTags = JSON.parse(rawTags[0]);
    } else {
      parsedTags = rawTags;
    }
  } else {
    parsedTags = ['Modern', 'Contemporary'];
  }
} catch (err) {
  parsedTags = ['Modern', 'Contemporary'];
}
  useEffect(()=>{
    console.log('Tags are',tags)
  },[tags])

  return (
    <View style={[
      styles.card,
      { width, height },
      focused && { borderColor: '#6C5CE7', borderWidth: 2 },
    ]}>
      <Image
        source={{ uri: fallbackSource }}
        style={[styles.image, { height: imageHeight }]}
      />

      <TouchableOpacity
        hasTVPreferredFocus={false}
        onPress={onHeartPress}
        style={[
          styles.likeButton,
          isFavorite ? styles.liked : styles.unliked,
          {
            padding: 8 * scale,
            borderRadius: 20 * scale,
            top: 16 * scale,
            right: 16 * scale,
          },
        ]}
      >
        <Icon name="heart" size={18 * scale} color={isFavorite ? 'red' : 'white'} />
      </TouchableOpacity>

      <View style={[styles.contentContainer, { height: contentHeight, padding: 16 * scale }]}>
        <Text style={[styles.title, { fontSize: 20 * scale, marginBottom: 6 * scale }]}>
          {fallbackTitle}
        </Text>
        <Text style={[styles.description, { fontSize: 14 * scale, lineHeight: 18 * scale, marginBottom: 12 * scale }]}>
          {fallbackDescription}
        </Text>

        <View style={styles.tagsRow}>
          <View style={[styles.tagsContainer, { gap: 8 * scale }]}>
            {parsedTags.map((tag, index) => (
              <View
                key={index}
                style={[styles.tagPill, {
                  paddingHorizontal: 12 * scale,
                  paddingVertical: 6 * scale,
                  borderRadius: 10 * scale,
                }]}
              >
                <Text style={[styles.tagText, { fontSize: 12 * scale }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            hasTVPreferredFocus={focused}
            onPress={onDisplayPress}
            style={[
              styles.displayButton,
              {
                paddingHorizontal: 16 * scale,
                paddingVertical: 6 * scale,
                borderRadius: 10 * scale,
              },
            ]}
          >
            <Text style={[styles.buttonText, { fontSize: 14 * scale }]}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    justifyContent: 'flex-end',
  },
  likeButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  liked: {
    backgroundColor: 'white',
  },
  unliked: {
    backgroundColor: 'black',
  },
  title: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    color: '#CCCCCC',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#2A2A3E',
  },
  tagText: {
    color: '#FFFFFF',
  },
  displayButton: {
    backgroundColor: '#6C5CE7',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default FavouriteCards;
