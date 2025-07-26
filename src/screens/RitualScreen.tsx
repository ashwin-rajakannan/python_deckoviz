import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Dimensions, 
  ImageBackground,
  TouchableOpacity,
  Animated,
  BackHandler
} from 'react-native';
import Sound from 'react-native-sound';
import { useFocusEffect } from '@react-navigation/native';
import { useWebSocket } from '../components/context/Websocket';
import { CommonActions } from '@react-navigation/native'; // already imported
Sound.setCategory('Playback');

const DisplayRitualScreen = ({ route, navigation }) => {
  const { 
    artWork,
    collection_images,
    display_time = 0,
    music,
    ritualName = '',
    triggerTime = null
  } = route.params || {};

  const { completeRitual, isRitualPlaying } = useWebSocket();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const { width, height } = Dimensions.get('window');

  const timerRef = useRef(null);
  const soundRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const displayTimerRef = useRef(null);

  const isCollectionMode = collection_images && collection_images.length > 0;
  const timePerImage = isCollectionMode 
    ? Math.round(display_time / collection_images.length) 
    : 0;
  const currentArtwork = isCollectionMode 
    ? collection_images[currentIndex]?.image 
    : artWork?.image;

  useEffect(() => {
    console.log('🧙‍♂️ DisplayRitualScreen Mounted', { ritualName, triggerTime });
    return () => console.log('🧙‍♂️ DisplayRitualScreen Unmounted');
  }, []);

  const loadAndPlayMusic = async () => {
    if (!music) return;

    try {
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.release();
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

const handleRitualComplete = () => {
  stopMusic();
  completeRitual();

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'CurrentCollection' }],
    })
  );
};

const handleBack = () => {
  stopMusic();
  completeRitual();

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'CurrentCollection' }],
    })
  );
};

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (isCollectionMode) {
      setRemainingTime(timePerImage);
    } else {
      setRemainingTime(display_time);
    }

    if (music) {
      loadAndPlayMusic();
    }

    fadeIn();

    if (display_time > 0) {
      displayTimerRef.current = setTimeout(() => {
        console.log('🎆 Ritual display time completed');
        handleRitualComplete();
      }, display_time * 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
      stopMusic();
    };
  }, [music, display_time]);

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
  }, [currentIndex, isCollectionMode, collection_images, timePerImage]);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`✨ DisplayRitualScreen focused - ${ritualName}`);
      return () => {
        console.log(`✨ DisplayRitualScreen unfocused`);
        stopMusic();
        if (timerRef.current) clearInterval(timerRef.current);
        if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
      };
    }, [ritualName])
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {!imageLoaded && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Ritual: {ritualName}
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
        {/**  <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity> */}

          <View style={styles.ritualIndicator}>
            <Text style={styles.ritualText}>
              ✨ {ritualName}
            </Text>
          </View>

        {/**  {isCollectionMode && (
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionText}>
                {currentIndex + 1} of {collection_images.length}
              </Text>
            </View>
          )}*/} 

       {/*    {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}*/} 

      {/*     <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {formatTime(remainingTime)}
            </Text>
          </View>*/} 
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
  ritualIndicator: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ritualText: {
    color: 'white',
    fontSize: 18,
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

export default DisplayRitualScreen;