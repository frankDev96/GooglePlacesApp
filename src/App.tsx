import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

enableScreens(true);
enableFreeze(true);

const App = () => {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                <AppNavigator />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};

export default App;
