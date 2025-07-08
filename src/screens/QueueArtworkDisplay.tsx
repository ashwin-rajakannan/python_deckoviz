import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Dimensions, 
  ImageBackground,
  Animated,
  TouchableOpacity
} from 'react-native';
import Sound from 'react-native-sound';
import { useFocusEffect } from '@react-navigation/native';
import { useCollectionQueue } from '../components/context/CollectionQueue';
import { useWebSocket } from '../components/context/Websocket'; // Import WebSocket context
import Icon from 'react-native-vector-icons/Ionicons';

// Enable audio in silent mode on iOS
Sound.setCategory('Playback');

const QueueArtworkDisplay = ({ navigation }) => {
  const { collectionQueue, removeFromQueue } = useCollectionQueue();
  const { sendMessage } = useWebSocket(); // Get sendMessage from WebSocket context
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  const [currentArtworkIndex, setCurrentArtworkIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const { width, height } = Dimensions.get('window');

  const timerRef = useRef(null);
  const soundRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentCollection = collectionQueue[currentCollectionIndex];
  const currentArtwork = currentCollection?.collection_images?.[currentArtworkIndex]?.image;
  const displayTime = currentCollection?.display_time || 0;
  const music = currentCollection?.music;

  // Calculate time per artwork (in seconds) by evenly splitting the display_time
  const timePerArtwork = currentCollection?.collection_images?.length 
    ? Math.max(1, Math.floor(displayTime / currentCollection.collection_images.length))
    : displayTime;

  // Function to send queue update to mobile app
  const sendQueueUpdate = (updatedQueue) => {
    try {
      const message = {
        type: 'message',
        data: {
          data: {
            type: 'collectionQueue',
            payload: {
              queue: updatedQueue,
              currentCollection: updatedQueue[0] || null, // Send first collection as current
              timestamp: Date.now()
            }
          }
        }
      };
      
      const success = sendMessage(message);
      if (success) {
        console.log('✅ Queue update sent to mobile app:', updatedQueue.length, 'collections');
      } else {
        console.warn('⚠️ Failed to send queue update to mobile app');
      }
    } catch (error) {
      console.error('❌ Error sending queue update:', error);
    }
  };

  // Watch for queue changes and send updates
  useEffect(() => {
    console.log('📱 Collection queue changed, sending update to mobile app');
    sendQueueUpdate(collectionQueue);
  }, [collectionQueue, sendMessage]);

  const loadAndPlayMusic = async () => {
    if (!music) return;

    try {
      // Only initialize new sound if we don't have one or we're starting a new collection
      if (!soundRef.current || currentArtworkIndex === 0) {
        // Clean up any existing sound
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

          soundRef.current.setNumberOfLoops(-1); // Loop indefinitely
        });
      } else if (isPaused) {
        // Resume playback if paused
        soundRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
      }
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

  const pauseMusic = () => {
    if (soundRef.current && isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const resumeMusic = () => {
    if (soundRef.current && isPaused) {
      soundRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const checkQueueLength = () => {
    if (collectionQueue.length < 5) {
      console.log('Queue has less than 5 collections!');
      // future logic like fetchMoreCollections() can go here
    }
  };

  const goToNextArtwork = () => {
    fadeOut();

    setTimeout(() => {
      const nextArtworkIndex = currentArtworkIndex + 1;

      if (nextArtworkIndex < currentCollection.collection_images.length) {
        setCurrentArtworkIndex(nextArtworkIndex);
      } else {
        // Remove collection from queue
        removeFromQueue(currentCollection.id);

        const updatedQueue = collectionQueue.filter(
          (item) => item.id !== currentCollection.id
        );

        checkQueueLength(); // <-- check queue length after removal

        // Send updated queue to mobile app immediately after removal
        console.log('📱 Sending updated queue after collection removal');
        sendQueueUpdate(updatedQueue);

        if (updatedQueue.length > 0) {
          setCurrentCollectionIndex(0);
          setCurrentArtworkIndex(0);
        } else {
          navigation.goBack();
          return;
        }
      }

      setRemainingTime(timePerArtwork);
      fadeIn();

      if (nextArtworkIndex >= currentCollection.collection_images.length) {
        stopMusic();
      }
    }, 1000);
  };

  // Manual advance to next artwork
  const skipToNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    goToNextArtwork();
  };

  useEffect(() => {
    if (!currentCollection) {
      navigation.goBack();
      return;
    }

    setRemainingTime(timePerArtwork);
    loadAndPlayMusic();
    fadeIn();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Don't stop music here as it might be needed for next artwork
    };
  }, [currentCollectionIndex, currentArtworkIndex]);

  useEffect(() => {
    if (!currentCollection?.collection_images) return;

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          goToNextArtwork();
          return timePerArtwork;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentCollectionIndex, currentArtworkIndex, timePerArtwork]);

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

  if (!currentCollection) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading collections...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {!imageLoaded && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {currentCollection.name || 'Artwork Collection'}
          </Text>
        </View>
      )}

      <Animated.View style={[styles.fullScreenImage, { opacity: fadeAnim }]}>
        <ImageBackground
          source={{ uri: currentArtwork?.file || currentArtwork?.external_url }}
          style={styles.fullScreenImage}
          resizeMode="contain"
          onLoad={() => {
            setImageLoaded(true);
            fadeIn();
          }}
          onError={() => setImageLoaded(false)}
        >
          {/* Your UI components here - uncomment as needed */}
       
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          
          <View style={styles.infoContainer}>
            <Text style={styles.collectionName}>{currentCollection.name}</Text>
            <Text style={styles.artworkInfo}>
              {currentArtworkIndex + 1} of {currentCollection.collection_images.length} • {timePerArtwork}s each
            </Text>
            <Text style={styles.artworkTitle}>{currentArtwork?.title}</Text>
            {currentArtwork?.description && (
              <Text style={styles.artworkDescription} numberOfLines={2}>
                {currentArtwork.description}
              </Text>
            )}
          </View>

        
          <View style={styles.controlsContainer}>
            {music && (
              <View style={styles.musicControls}>
                <Text style={styles.musicStatus}>
                  {isPlaying ? 'Now Playing' : isPaused ? 'Paused' : 'Loading...'}
                </Text>
                <View style={styles.controlButtons}>
                  {isPlaying ? (
                    <TouchableOpacity onPress={pauseMusic}>
                      <Icon name="pause" size={32} color="white" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={resumeMusic}>
                      <Icon name="play" size={32} color="white" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={stopMusic}>
                    <Icon name="stop" size={32} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={skipToNext}>
              <Icon name="play-skip-forward" size={32} color="white" />
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>

       
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {formatTime(remainingTime)}
            </Text>
          </View>

       
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
  fullScreenImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 20,
  },
  infoContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
  },
  collectionName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  artworkInfo: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  artworkTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  artworkDescription: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  musicControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  musicStatus: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 30,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 10,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerContainer: {
    position: 'absolute',
    top: 40,
    right: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  }
});

export default QueueArtworkDisplay;