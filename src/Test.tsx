import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Video from 'react-native-video';

const MusicPlayerScreen = () => {
  const playerRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const sampleMusicUri = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 TV Music Player</Text>

      <Video
        source={{ uri: sampleMusicUri }}
        ref={playerRef}
        audioOnly
        paused={paused}
        onError={(e) => console.log('Video error:', e)}
        onBuffer={({ isBuffering }) => console.log('Buffering:', isBuffering)}
        style={{ height: 0 }} // Audio-only, no visible video
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => setPaused(prev => !prev)}
        hasTVPreferredFocus={true}
      >
        <Text style={styles.buttonText}>{paused ? '▶️ Play' : '⏸ Pause'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MusicPlayerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#444',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
  },
});
