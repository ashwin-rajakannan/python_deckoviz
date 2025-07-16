import { StyleSheet, Text, View } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Homescreen from './src/screens/HomeScreen';
import SplashScreen from './src/screens/SplashScreen';
import QrScreen from './src/screens/QrScreen';
import CurrentCollection from './src/screens/CurrentCollection';
import AllTimeFavourite from './src/screens/AllTimeFavourite';
import SpecificCollection from './src/screens/SpecificCollection';
import DisplayArtwork from './src/screens/DisplayArtwork';
import PermanentCollection from './src/screens/PermanentCollections';
import AllCollectionScreen from './src/screens/AllCollectionInQueue';
import { FavoritesProvider } from './src/components/context/FavouriteCollections';
import { ActiveCategoryProvider } from './src/components/context/ActiveCategory';
import BrowseModeScreen from './src/screens/BrowseMode';
import { WebSocketProvider, useWebSocket } from './src/components/context/Websocket';
import { CollectionQueueProvider } from './src/components/context/CollectionQueue';
import AllQueueCollection from './src/screens/AllQueueCollections';
import QueueArtworkDisplay from './src/screens/QueueArtworkDisplay';
import DisplayRitualScreen from './src/screens/RitualScreen';

const Stack = createNativeStackNavigator();

// Separate component that has access to WebSocket context
const AppNavigator = () => {
  const navigationRef = useRef();
  const { setNavigationRef } = useWebSocket();

  useEffect(() => {
    console.log('🔗 Setting navigation ref in WebSocket context');
    if (navigationRef.current && setNavigationRef) {
      setNavigationRef(navigationRef.current);
      console.log('✅ Navigation ref set successfully');
    }
  }, [setNavigationRef, navigationRef.current]);

  // Additional effect to handle navigation ready state
  useEffect(() => {
    const unsubscribe = navigationRef.current?.addListener('state', () => {
      console.log('📱 Navigation state changed');
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => {
        console.log('🚀 Navigation container is ready');
        // Re-set the ref when navigation is ready
        if (setNavigationRef) {
          setNavigationRef(navigationRef.current);
        }
      }}
    >
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{headerShown:false}}/>
        <Stack.Screen name="Home" component={Homescreen} options={{headerShown:false}}/>
        <Stack.Screen name='CurrentCollection' component={CurrentCollection} options={{headerShown:false}}/>
        <Stack.Screen name='AllTimeFavourite' component={AllTimeFavourite} options={{headerShown:false}}/>
        <Stack.Screen name='SpecificCollection' component={SpecificCollection} options={{headerShown:false}}/>
        <Stack.Screen name='DisplayArtWork' component={DisplayArtwork} options={{headerShown:false}}/>
        <Stack.Screen name='PermanentCollection' component={PermanentCollection} options={{headerShown:false}}/>
        <Stack.Screen name='AllCollectionScreen' component={AllCollectionScreen} options={{headerShown:false}}/>
        <Stack.Screen name='BrowseModeScreen' component={BrowseModeScreen} options={{headerShown:false}}/>
        <Stack.Screen name='AllQueueCollection' component={AllQueueCollection} options={{headerShown:false}}/>
        <Stack.Screen name='QueueArtworkDisplay' component={QueueArtworkDisplay} options={{headerShown:false}}/>
        <Stack.Screen name='DisplayRitualScreen' component={DisplayRitualScreen} options={{headerShown:false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <ActiveCategoryProvider>
      <FavoritesProvider>
        <CollectionQueueProvider>
          <WebSocketProvider>
            {/* AppNavigator is now inside WebSocketProvider, so it has access to the context */}
            <AppNavigator />
          </WebSocketProvider>
        </CollectionQueueProvider>
      </FavoritesProvider>
    </ActiveCategoryProvider>
  );
}

export default App

const styles = StyleSheet.create({})