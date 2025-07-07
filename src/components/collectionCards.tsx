import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const CollectionCards = ({ width = 400, height = 400 }) => {
  const imageHeight = height * 0.7;
  const contentHeight = height * 0.3;
  const scale = width / 400;

  return (
    <View style={[styles.card, { width, height }]}>
      <Image
        source={require('../assets/fallen_angel.webp')}
        style={[styles.image, { height: imageHeight }]}
      />

      <View style={[styles.contentContainer, { height: contentHeight, padding: 16 * scale }]}>
        <Text style={[styles.title, { fontSize: 20 * scale, marginBottom: 6 * scale }]}>
          Modern Collection
        </Text>
        <Text style={[styles.description, { fontSize: 14 * scale, lineHeight: 18 * scale, marginBottom: 12 * scale }]}>
          "The last sunset" can refer to ...
        </Text>

        <View style={styles.tagsRow}>
          <View style={[styles.tagsContainer, { gap: 8 * scale }]}>
            {['Classical', 'Historical'].map((tag) => (
              <View key={tag} style={[styles.tagPill, {
                paddingHorizontal: 12 * scale,
                paddingVertical: 6 * scale,
                borderRadius: 10 * scale,
              }]}>
                <Text style={[styles.tagText, { fontSize: 12 * scale }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.creatorText, { fontSize: 12 * scale }]}>
            Beautiful things By Mc Slang
          </Text>
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
  },
  tagPill: {
    backgroundColor: '#2A2A3E',
  },
  tagText: {
    color: '#FFFFFF',
  },
  creatorText: {
    color: '#CCCCCC',
    fontStyle: 'italic',
  },
});

export default CollectionCards;