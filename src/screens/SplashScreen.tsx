import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, Image } from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect, Path, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const App = ({ navigation }) => {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const tvScale = useRef(new Animated.Value(0.8)).current;
  const tvPosition = useRef(new Animated.Value(-50)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const sliderOpacity = useRef(new Animated.Value(0)).current;
  const sliderPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(tvScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(tvPosition, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
      Animated.timing(sliderOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sliderPosition, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sliderPosition, {
          toValue: 2,
          duration: 1000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sliderPosition, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
       navigation.replace('Home');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const gradientX = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const gradientY = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const image1Opacity = sliderPosition.interpolate({
    inputRange: [0, 0.5, 2],
    outputRange: [1, 0, 0],
  });

  const image2Opacity = sliderPosition.interpolate({
    inputRange: [0, 0.5, 1, 1.5, 2],
    outputRange: [0, 1, 1, 0, 0],
  });

  const image3Opacity = sliderPosition.interpolate({
    inputRange: [0, 1, 1.5, 2],
    outputRange: [0, 0, 1, 1],
  });

  const renderBackground = () => (
    <Svg height={height} width={width} style={styles.backgroundSvg}>
      <Defs>
      <LinearGradient
        id="backgroundGradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
          <Stop offset="0%" stopColor="#6a11cb" />
          <Stop offset="25%" stopColor="#2575fc" />
          <Stop offset="50%" stopColor="#ff00cc" />
          <Stop offset="75%" stopColor="#ff8177" />
          <Stop offset="100%" stopColor="#ff0844" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#backgroundGradient)" />
      <G opacity="0.2">
        <Path
          d={`M0,${height * 0.6} C${width * 0.3},${height * 0.7} ${width * 0.6},${height * 0.5} ${width},${height * 0.8}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="8"
        />
        <Path
          d={`M0,${height * 0.2} C${width * 0.4},${height * 0.3} ${width * 0.7},${height * 0.1} ${width},${height * 0.4}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="5"
        />
        <Path
          d={`M${width * 0.1},${height} C${width * 0.3},${height * 0.8} ${width * 0.8},${height * 0.9} ${width * 0.9},${height * 0.7}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
        />
      </G>
    </Svg>
  );

  const renderTV = () => (
    <Animated.View
      style={[
        styles.tvContainer,
        {
          opacity: fadeIn,
          transform: [{ translateY: tvPosition }, { scale: tvScale }],
        },
      ]}
    >
      {/* Logo above TV */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }],
            marginBottom: 20,
          },
        ]}
      >
        <View style={styles.appIcon}>
          <Image source={require('../assets/logo.png')} style={{ width: 40, height: 40 }} />
        </View>
        <Text style={styles.appName}>Deckoviz</Text>
      </Animated.View>

      {/* TV and stand */}
      <View style={styles.tvStand} />
      <View style={styles.tvFrame}>
        <View style={styles.tvScreen}>
          <Animated.View style={[styles.sliderContainer, { opacity: sliderOpacity }]}>
            <Animated.View style={[styles.sliderImage, { opacity: image1Opacity }]}>
              <View style={[styles.demoImage, { backgroundColor: '#5E35B1' }]}>
                <Text style={styles.demoText}>Design</Text>
              </View>
            </Animated.View>
            <Animated.View style={[styles.sliderImage, { opacity: image2Opacity }]}>
              <View style={[styles.demoImage, { backgroundColor: '#00897B' }]}>
                <Text style={styles.demoText}>Create</Text>
              </View>
            </Animated.View>
            <Animated.View style={[styles.sliderImage, { opacity: image3Opacity }]}>
              <View style={[styles.demoImage, { backgroundColor: '#D81B60' }]}>
                <Text style={styles.demoText}>Share</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {renderBackground()}
      {renderTV()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tvContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40, // Added padding to provide more space at the top
  },
  tvFrame: {
    width: width * 0.7,
    height: width * 0.48,
    borderRadius: 10,
    backgroundColor: '#000',
    borderWidth: 15,
    borderColor: '#333',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  tvScreen: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  tvStand: {
    width: width * 0.3,
    height: 30,
    backgroundColor: '#444',
    borderRadius: 5,
    marginTop: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    marginRight: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  sliderContainer: {
    width: '80%',
    height: 120,
    position: 'relative',
  },
  sliderImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default App;