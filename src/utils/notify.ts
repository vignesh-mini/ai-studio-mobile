import { Alert, Platform, ToastAndroid } from 'react-native';

/** Lightweight confirmation: a toast on Android, an alert elsewhere. */
export function notify(message: string) {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert(message);
}
