import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AssetViewerScreen } from '../screens/Library/AssetViewerScreen';
import { CompareScreen } from '../screens/Compare/CompareScreen';
import { DocumentsScreen } from '../screens/Documents/DocumentsScreen';
import { HistoryScreen } from '../screens/History/HistoryScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { SubscriptionScreen } from '../screens/Subscription/SubscriptionScreen';
import { VoiceScreen } from '../screens/Voice/VoiceScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import { delay } from '../utils';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isSignedIn = useAuthStore(s => !!s.user);
  const [booting, setBooting] = useState(true);

  // Restore the stored session here (keychain + GET /profile) once real auth exists.
  useEffect(() => {
    delay(1200).then(() => setBooting(false));
  }, []);

  if (booting) return <SplashScreen />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {isSignedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Compare" component={CompareScreen} />
          <Stack.Screen name="Documents" component={DocumentsScreen} />
          <Stack.Screen name="Voice" component={VoiceScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen
            name="AssetViewer"
            component={AssetViewerScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
