import * as Keychain from 'react-native-keychain';

// "Remember me" keeps only the refresh token, in the Android Keystore / iOS Keychain.
// The password is never stored. Refresh tokens rotate on every use, so a copied old
// token stops working.
const SERVICE = 'ai-studio.session';

export async function saveRefreshToken(token: string) {
  try {
    await Keychain.setGenericPassword('refresh-token', token, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Secure storage unavailable: the user simply signs in next time.
  }
}

export async function loadRefreshToken(): Promise<string | null> {
  try {
    const stored = await Keychain.getGenericPassword({ service: SERVICE });
    return stored ? stored.password : null;
  } catch {
    return null;
  }
}

export async function clearStoredSession() {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // Nothing stored.
  }
}
