import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  findNodeHandle,
  useTVEventHandler,
} from 'react-native';

const FancyCard = ({ imageUrl, title, description = "No description available", onPress }) => {
  const cardRef = useRef(null);
  const buttonRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useTVEventHandler((evt) => {
    if (isFocused && evt.eventType === 'down') {
      const node = findNodeHandle(buttonRef.current);
      if (node) {
        buttonRef.current.setNativeProps({ hasTVPreferredFocus: true });
      }
    }
  });

  return (
    <View
      style={styles.container}
      ref={cardRef}
      focusable={true}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        {/* Text Info */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Untitled Artwork'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {description}
          </Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          ref={buttonRef}
          style={styles.button}
          onPress={onPress}
          focusable={true}
        >
          <Text style={styles.buttonText}>Open in Full Screen</Text>
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};
export default FancyCard;

const styles = StyleSheet.create({
  container: {
    height: 420,
    width: 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  imageStyle: {
    borderRadius: 20,
  },
  textContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  button: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 14,
  },
});
