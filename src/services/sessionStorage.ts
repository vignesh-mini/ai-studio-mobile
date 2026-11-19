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

// The email is kept separately so the login form can be prefilled after sign-out.
const EMAIL_SERVICE = 'ai-studio.email';

export async function saveRememberedEmail(email: string) {
  try {
    await Keychain.setGenericPassword('email', email, {
      service: EMAIL_SERVICE,
    });
  } catch {
    // Not critical: the form just starts empty.
  }
}

export async function loadRememberedEmail(): Promise<string | null> {
  try {
    const stored = await Keychain.getGenericPassword({
      service: EMAIL_SERVICE,
    });
    return stored ? stored.password : null;
  } catch {
    return null;
  }
}

export async function clearRememberedEmail() {
  try {
    await Keychain.resetGenericPassword({ service: EMAIL_SERVICE });
  } catch {
    // Nothing stored.
  }
}
