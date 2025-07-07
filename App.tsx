import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
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
import { WebSocketProvider } from './src/components/context/Websocket';
import { CollectionQueueProvider } from './src/components/context/CollectionQueue';
import AllQueueCollection from './src/screens/AllQueueCollections';
import QueueArtworkDisplay from './src/screens/QueueArtworkDisplay';
const Stack = createNativeStackNavigator();

const App = () => {
  return (

    
        <ActiveCategoryProvider>
              <FavoritesProvider>
                        <CollectionQueueProvider>
         <WebSocketProvider>

    <NavigationContainer >
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

      </Stack.Navigator>
    </NavigationContainer>

</WebSocketProvider>
  </CollectionQueueProvider>
    </FavoritesProvider>
    </ActiveCategoryProvider>
  );
}

export default App

const styles = StyleSheet.create({})