import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet,TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const CollectionCards = ({ 
  width = 400, 
  height = 400,
  cardType = 'Individual Artwork',
  data,
  tags,
  title,
  hasFocus = false,

}) => {
  const imageHeight = height * 0.55; // Reduced from 0.7 to 0.55 (55% of card height)
  const contentHeight = height * 0.45; // Increased from 0.3 to 0.45 (45% of card height)
  const scale = width / 400;
  const [parsedTag,setParsedTag] = useState([])

  useEffect(()=>{
    console.log('thisdatassss',data)
  },[data])
  return (  
    <View style={[styles.card, { width, height }]}>
   <Image
  source={{ uri: data.file || data.external_url }}
  style={[styles.image, { height: imageHeight }]}
    />
      <View style={[styles.contentContainer, { height: contentHeight, padding: 16 * scale }]}>
        <View style={[styles.titleRow, { marginBottom: 6 * scale }]}>
          <Text style={[styles.title, { fontSize: 20 * scale, flex: 1 }]}>
           {data.title}
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
        }]} numberOfLines={2}>
         {data.description}
        </Text>

        <View style={styles.tagsRow}>
          <View style={[styles.tagsContainer, { gap: 8 * scale }]}>
            {['Awesome','Amazing']?.map((tag) => (
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

        {/* Music Info with Icon */}
        <View style={[styles.musicInfo, { marginTop: 8 * scale }]}>
          <Icon 
            name="music" 
            size={14 * scale} 
            color="#CCCCCC" 
            style={{ marginRight: 8 * scale }} 
          />
          <Text style={[styles.creatorText, { 
            fontSize: 12 * scale,
            flex: 1,
            flexWrap: 'wrap'
          }]}>
            {data.musicTitle?data.musicTitle:'Beautiful things By Mc Slang'}
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
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  creatorText: {
    color: '#CCCCCC',
    fontStyle: 'italic',
    flexShrink: 1,
  },
});

export default CollectionCards;