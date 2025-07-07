import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AllCollectionCard = ({
  width = 400,
  height = 400,
  cardType = 'Collection',
  data,
  hasFocus = false,
}) => {
  const imageHeight = height * 0.55;
  const contentHeight = height * 0.45;
  const scale = width / 400;
const thumbnail =
  Array.isArray(data.collection_images) &&
  data.collection_images.length > 0 &&
  data.collection_images[0].image?.file;
  return (
    <View style={[styles.card, { width, height }]}>
      <Image
        source={{ uri:  thumbnail }}
        style={[styles.image, { height: imageHeight }]}
        resizeMode="cover"
      />

      <View style={[styles.contentContainer, { height: contentHeight, padding: 16 * scale }]}>
        <View style={[styles.titleRow, { marginBottom: 6 * scale }]}>
          <Text style={[styles.title, { fontSize: 20 * scale, flex: 1 }]}>
            {data.name}
          </Text>
          <View style={[styles.cardTypeLabel, {
            paddingHorizontal: 12 * scale,
            paddingVertical: 4 * scale,
          }]}>
            <Text style={[styles.cardTypeText, { fontSize: 12 * scale }]}>
              {cardType}
            </Text>
          </View>
        </View>

        <Text style={[styles.description, {
          fontSize: 14 * scale,
          lineHeight: 18 * scale,
          marginBottom: 12 * scale,
          flexShrink: 1
        }]}>
          {data.description || 'A beautiful collection of handpicked artworks.'}
        </Text>

        {/* Tags if any */}
        {Array.isArray(data.tags) && data.tags.length > 0 && (
          <View style={styles.tagsRow}>
            <View style={[styles.tagsContainer, { gap: 8 * scale }]}>
              {JSON.parse(data.tags).slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tagPill, {
                  paddingHorizontal: 12 * scale,
                  paddingVertical: 6 * scale,
                  borderRadius: 10 * scale,
                }]}>
                  <Text style={[styles.tagText, { fontSize: 12 * scale }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Creator or Art Count */}
        <View style={[styles.metaInfo, { marginTop: 8 * scale }]}>
          <Icon
            name="folder"
            size={14 * scale}
            color="#CCCCCC"
            style={{ marginRight: 8 * scale }}
          />
          <Text style={[styles.metaText, {
            fontSize: 12 * scale,
            flex: 1,
            flexWrap: 'wrap'
          }]}>
            {data.creator_name
              ? `Curated by ${data.creator_name}`
              : `${data.collection_images.length || 0} artworks`}
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
  },
  contentContainer: {
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  cardTypeLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardTypeText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  description: {
    color: '#CCCCCC',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  metaText: {
    color: '#CCCCCC',
    fontStyle: 'italic',
    flexShrink: 1,
  },
});

export default AllCollectionCard;
