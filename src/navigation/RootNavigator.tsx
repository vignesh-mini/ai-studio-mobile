import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { env } from '../config/env';
import { AssetViewerScreen } from '../screens/Library/AssetViewerScreen';
import { CompareScreen } from '../screens/Compare/CompareScreen';
import { DocumentsScreen } from '../screens/Documents/DocumentsScreen';
import { HistoryScreen } from '../screens/History/HistoryScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { SubscriptionScreen } from '../screens/Subscription/SubscriptionScreen';
import { VoiceScreen } from '../screens/Voice/VoiceScreen';
import { authService } from '../services/api/authService';
import {
  clearStoredSession,
  loadRefreshToken,
} from '../services/sessionStorage';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useLibraryStore } from '../store/libraryStore';
import { colors } from '../theme';
import { delay } from '../utils';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** "Remember me": signs back in with the refresh token kept in secure storage. */
async function restoreSession() {
  const minimumSplash = delay(600);
  const token = env.mocks.auth ? null : await loadRefreshToken();
  if (token) {
    try {
      useAuthStore
        .getState()
        .setSession(await authService.restore(token), true);
    } catch (error) {
      // Only a rejected token is discarded; if the server is unreachable, keep it so
      // the next launch can try again.
      if (isAxiosError(error) && error.response?.status === 401) {
        await clearStoredSession();
      }
    }
  }
  await minimumSplash;
}

export function RootNavigator() {
  const isSignedIn = useAuthStore(s => !!s.user);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setBooting(false));
  }, []);

  // Signing out (or an expired session) must not leave the previous user's chats or
  // cached server data behind for the next account.
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isSignedIn) {
      useChatStore.getState().reset();
      useLibraryStore.getState().reset();
      queryClient.clear();
    }
  }, [isSignedIn, queryClient]);

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
