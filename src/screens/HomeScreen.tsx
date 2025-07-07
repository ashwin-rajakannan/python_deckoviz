import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  findNodeHandle,
  TouchableHighlight,
  StyleSheet
} from 'react-native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import { Shadow } from 'react-native-shadow-2';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTVEventHandler } from 'react-native';

const { width } = Dimensions.get('window');

// HomeScreen with QR functionality
const HomeScreen = ({ navigation,route }) => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [error, setError] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const statusCheckInterval = useRef(null);
  const generateButtonRef = useRef(null);

  let retryCount = 0;
  // TV Event Handler setup using the hook correctly
  useTVEventHandler((event) => {
    if (event && event.eventType === 'select') {
      generateQR();
    }
  });

  // Check if device is already paired on component mount
useEffect(() => {

  const checkExistingDevice = async () => {
    try {
      const savedDeviceId = await AsyncStorage.getItem('deviceId');
      console.log('savedDeviceId', savedDeviceId);

      if (savedDeviceId) {
        setDeviceId(savedDeviceId);

        // Add short delay to avoid race condition
        setTimeout(() => {
          checkDeviceStatus(savedDeviceId);
        }, 1000);
      }
    } catch (err) {
      console.error('Error checking existing device ID:', err);
    }
  };

  checkExistingDevice();

  // Ensure generate button gets focus
  setTimeout(() => {
    if (generateButtonRef.current) {
      generateButtonRef.current.setNativeProps({ hasTVPreferredFocus: true });
    }
  }, 500);

  // Cleanup
  return () => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  };
}, []);


  const generateQR = async () => {
    if (loading) return; // Prevent multiple calls
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('https://api.deckoviz.com/qr/generate-qr', {
        api_base_url: "string",
        instructions: "Scan the above QR to connect your mobile app."
      });
      
      // Extract response data
      const { device_id, qr_code_base64, expiration_time } = response.data;
      
      // Store device ID
      setDeviceId(device_id);
      await AsyncStorage.setItem('deviceId', device_id);
      
      // Set QR code
      setQrCode(qr_code_base64);
      
      console.log('QR Code generated successfully:', { 
        device_id, 
        expiration_time: new Date(expiration_time * 1000).toLocaleString() 
      });

      // Start checking pairing status
      startStatusCheck(device_id);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startStatusCheck = (id) => {
    // Clear any existing interval
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
    }

    // Set interval to check device status every 3 seconds
    statusCheckInterval.current = setInterval(() => {
      checkDeviceStatus(id);
    }, 3000);
  };

const checkDeviceStatus = async (id) => {
  if (!id || checkingStatus) return;

  setCheckingStatus(true);

  try {
    const response = await axios.get(`https://api.deckoviz.com/qr/device/${id}/room`);
    const { paired, room_id, token } = response.data;

    if (paired) {
      await AsyncStorage.setItem('roomId', room_id);
      await AsyncStorage.setItem('userToken', token);

      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;

      navigation.replace('CurrentCollection', { roomId: room_id, deviceId: id, token });
    }
  } catch (err) {
    if (err.response?.status === 404) {
      console.warn('Device ID no longer valid. Clearing AsyncStorage.');
      await AsyncStorage.removeItem('deviceId');
      setDeviceId(null);
      setQrCode(null);
    } else if (err.message === 'Network Error' && retryCount < 3) {
      retryCount++;
      console.warn(`Retrying (${retryCount})...`);
      setTimeout(() => checkDeviceStatus(id), 2000);
    } else {
      console.error('Final Axios error:', err.message);
    }
  } finally {
    setCheckingStatus(false);
  }
};
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>TV Connect</Text>
        <Text style={styles.headerSubtitle}>Link your mobile device</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        {qrCode ? (
          <View style={styles.qrContainer}>
            <Shadow distance={16} startColor="rgba(59, 130, 246, 0.25)" finalColor="rgba(59, 130, 246, 0)" offset={[0, 8]}>
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.qrGradient}
              >
                <Image
                  source={{ uri: `data:image/png;base64,${qrCode}` }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </LinearGradient>
            </Shadow>
            <Text style={styles.scanInstructions}>
              Scan QR code with your mobile device
            </Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.pulsingDot, styles.pulsing]}></View>
              <Text style={styles.statusText}>
                Waiting for connection...
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Shadow distance={15} startColor="rgba(59, 130, 246, 0.2)" finalColor="rgba(59, 130, 246, 0)" offset={[0, 8]}>
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.emptyStateGradient}
              >
                <View style={styles.iconContainer}>
                  <Image
                    source={require('../assets/logo.png')}
                    style={styles.emptyStateIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.emptyStateText}>
                  Ready to Connect
                </Text>
              </LinearGradient>
            </Shadow>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        <Shadow distance={8} startColor="rgba(59, 130, 246, 0.3)" finalColor="rgba(59, 130, 246, 0)" offset={[0, 4]}>
          <TouchableHighlight
            ref={generateButtonRef}
            onPress={generateQR}
            hasTVPreferredFocus={true}
            tvParallaxProperties={{ enabled: true }}
            underlayColor="#1e40af"
            accessible={true}
            accessibilityLabel="Generate QR Code"
            accessibilityHint="Press to generate a QR code for your mobile device"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={loading ? ['#60a5fa', '#93c5fd'] : ['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateButtonGradient}
            >
              <View style={styles.buttonContent}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.generateButtonText}>
                    {qrCode ? 'Generate New Code' : 'Generate QR Code'}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </TouchableHighlight>
        </Shadow>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  qrGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: '#1e293b',
  },
  qrImage: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: 12,
  },
  scanInstructions: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
    color: '#60a5fa',
    textAlign: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 40,
    paddingHorizontal: 20,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginRight: 12,
  },
  pulsing: {
    opacity: 1,
  },
  statusText: {
    fontSize: 18,
    color: '#60a5fa',
    fontWeight: '600',
  },
  deviceIdText: {
    marginTop: 22,
    fontSize: 16,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyStateGradient: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.5,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: '#1e293b', 
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    marginBottom: 0,
  },
  emptyStateText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#60a5fa',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateSubtext: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: width * 0.4,
    lineHeight: 26,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  generateButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    minWidth: 250,
    height: 48, // Fixed height
  },
  buttonContent: {
    minWidth: 200, // Ensures consistent width for both text and loader
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 16,
    width: '50%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  remoteHint: {
    marginTop: 20,
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
  },
  buttonHighlight: {
    color: '#60a5fa',
    fontWeight: '700',
  },
});

export default HomeScreen;