import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Dimensions, 
  ImageBackground,
  TouchableOpacity,
  Animated
} from 'react-native';
import Sound from 'react-native-sound';
import { useFocusEffect } from '@react-navigation/native';

// Enable audio in silent mode on iOS
Sound.setCategory('Playback');

const DisplayArtwork = ({ route, navigation }) => {
  const { 
    artWork,
    collection_images,
    display_time = 0,
    music
  } = route.params || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const { width, height } = Dimensions.get('window');

  const timerRef = useRef(null);
  const soundRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isCollectionMode = collection_images && collection_images.length > 0;

  const timePerImage = isCollectionMode 
    ? Math.round((display_time * 60) / collection_images.length) 
    : 0;

  const currentArtwork = isCollectionMode 
    ? collection_images[currentIndex]?.image 
    : artWork?.image;

  const loadAndPlayMusic = async () => {
    if (!music) return;

    try {
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.release();
          stopMusic(); 
        soundRef.current = null;
      }

      soundRef.current = new Sound(music, '', (error) => {
        if (error) {
          setError('Failed to load audio');
          return;
        }

        soundRef.current.play((success) => {
          if (success) {
            setIsPlaying(true);
          } else {
            setError('Playback failed');
          }
        });

        soundRef.current.setNumberOfLoops(-1);
      });
    } catch (err) {
      setError('Error playing audio');
    }
  };

const stopMusic = () => {
  const sound = soundRef.current;
  if (sound) {
    sound.stop(() => {
      sound.release();
      soundRef.current = null;
      setIsPlaying(false);
    });
  } else {
    soundRef.current = null; // Just to be sure
  }
};
  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (isCollectionMode) {
      setRemainingTime(timePerImage);
    } else if (display_time > 0) {
      setRemainingTime(display_time * 60);
    }

    if (music) {
      loadAndPlayMusic();
    }

    fadeIn();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopMusic();
    };
  }, [music]);

  useEffect(() => {
    if (!isCollectionMode || collection_images.length <= 1) return;

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          const nextIndex = (currentIndex + 1) % collection_images.length;
          setCurrentIndex(nextIndex);
          fadeIn();
          return timePerImage;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isCollectionMode, collection_images]);

  useEffect(() => {
    if (isCollectionMode || display_time <= 0) return;

    const timer = setTimeout(() => {
      stopMusic();
    }, display_time * 1000);

    return () => clearTimeout(timer);
  }, [display_time, isCollectionMode]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        stopMusic();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [])
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    stopMusic();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {!imageLoaded && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {isCollectionMode ? 'Collection Slideshow' : artWork?.title || 'Artwork'}
          </Text>
        </View>
      )}

      <Animated.View style={[styles.fullScreenImage, { opacity: fadeAnim }]}>
        <ImageBackground
          source={{ uri: currentArtwork?.file || artWork?.uri || artWork?.image?.external_url }}
          style={styles.fullScreenImage}
          resizeMode="contain"
          onLoad={() => {
            setImageLoaded(true);
            fadeIn();
          }}
          onError={() => setImageLoaded(false)}
        >
          {/* Optional: Back button */}
          {/* <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity> */}

          {/* Optional: Collection info */}
          {/* {isCollectionMode && (
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionText}>
                {currentIndex + 1} of {collection_images.length}
              </Text>
            </View>
          )} */}

          {/* Music status
          {music && (
            <View style={styles.musicStatus}>
              <Text style={styles.musicStatusText}>
                {isPlaying ? '🎵 Music Playing' : '🔇 Music Paused'}
              </Text>
            </View>
          )} */}

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Timer (optional) */}
          {/* {(display_time > 0 || isCollectionMode) && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {formatTime(remainingTime)}
              </Text>
            </View>
          )} */}
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  placeholderText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
fullScreenImage: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
  backgroundColor: 'black',
  justifyContent: 'center',
  alignItems: 'center',
},
  backButton: {
    position: 'absolute',
    top: 40,
    left: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  collectionInfo: {
    position: 'absolute',
    top: 40,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  collectionText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerContainer: {
    position: 'absolute',
    top: 40,
    right: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  musicStatus: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  musicStatusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default DisplayArtwork;
