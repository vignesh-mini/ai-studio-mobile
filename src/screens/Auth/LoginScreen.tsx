import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import {
  authService,
  type SocialProvider,
} from '../../services/api/authService';
import {
  clearRememberedEmail,
  loadRememberedEmail,
  saveRememberedEmail,
} from '../../services/sessionStorage';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { AuthSession } from '../../types';
import { errorMessage } from '../../utils';
import { Logo } from '../Splash/SplashScreen';

type Pending = 'email' | SocialProvider | null;

export function LoginScreen() {
  const setSession = useAuthStore(s => s.setSession);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Prefill the last email used with "Remember me" (e.g. after signing out).
  useEffect(() => {
    loadRememberedEmail().then(saved => {
      if (saved) setEmail(current => current || saved);
    });
  }, []);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const remembered = useAuthStore(s => s.remember);
  const [remember, setRemember] = useState(remembered);
  const [pending, setPending] = useState<Pending>(null);
  // Shown inline: Android can drop Alert dialogs (e.g. while DevTools has focus),
  // which made failed sign-ins look like nothing happened.
  const [error, setError] = useState<string | null>(null);

  const run = async (
    kind: Exclude<Pending, null>,
    action: () => Promise<AuthSession>,
  ) => {
    setPending(kind);
    setError(null);
    try {
      setSession(await action(), remember);
      if (kind === 'email') {
        if (remember) saveRememberedEmail(email.trim().toLowerCase());
        else clearRememberedEmail();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(null);
    }
  };

  const submitEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      setError('Enter a valid email and a password of 6+ characters.');
      return;
    }
    run('email', () =>
      mode === 'login'
        ? authService.login(email, password)
        : authService.register(
            name.trim() || email.split('@')[0],
            email,
            password,
          ),
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Logo />
            <Text style={typography.h1}>AI Studio</Text>
            <Text style={[typography.muted, styles.center]}>
              One app for chat, images, video, documents and voice – powered by
              multiple AI models.
            </Text>
          </View>

          <Button
            title="Continue with Google"
            icon="logo-google"
            variant="secondary"
            loading={pending === 'google'}
            disabled={!!pending}
            onPress={() =>
              run('google', () => authService.loginWithProvider('google'))
            }
          />
          {Platform.OS === 'ios' ? (
            <Button
              title="Continue with Apple"
              icon="logo-apple"
              variant="secondary"
              loading={pending === 'apple'}
              disabled={!!pending}
              onPress={() =>
                run('apple', () => authService.loginWithProvider('apple'))
              }
            />
          ) : null}

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={typography.caption}>or use email</Text>
            <View style={styles.line} />
          </View>

          {mode === 'register' ? (
            <TextInput
              value={name}
              onChangeText={v => {
                setName(v);
                setError(null);
              }}
              placeholder="Name"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              autoComplete="name"
            />
          ) : null}
          <TextInput
            value={email}
            onChangeText={v => {
              setEmail(v);
              setError(null);
            }}
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={v => {
                setPassword(v);
                setError(null);
              }}
              placeholder="Password"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              // Lets Google Password Manager / iCloud Keychain save and fill it.
              importantForAutofill="yes"
            />
            <View style={styles.eye}>
              <IconButton
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                label={showPassword ? 'Hide password' : 'Show password'}
                color={colors.textMuted}
                size={20}
                onPress={() => setShowPassword(v => !v)}
              />
            </View>
          </View>
          <Pressable
            onPress={() => setRemember(v => !v)}
            style={styles.remember}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: remember }}
            hitSlop={8}
          >
            <Icon
              name={remember ? 'checkbox' : 'square-outline'}
              size={20}
              color={remember ? colors.primary : colors.textMuted}
            />
            <Text style={typography.muted}>Remember me</Text>
          </Pressable>
          {error ? (
            <View style={styles.error} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
              {mode === 'login' ? (
                <Text style={styles.errorHint}>
                  First time here? Tap{' '}
                  <Text
                    style={styles.link}
                    onPress={() => {
                      setError(null);
                      setMode('register');
                    }}
                  >
                    Create an account
                  </Text>{' '}
                  to register.
                </Text>
              ) : null}
            </View>
          ) : null}
          <Button
            title={mode === 'login' ? 'Sign in' : 'Create account'}
            loading={pending === 'email'}
            disabled={!!pending}
            onPress={submitEmail}
          />

          <Pressable
            onPress={() => {
              setError(null);
              setMode(m => (m === 'login' ? 'register' : 'login'));
            }}
            style={styles.switch}
          >
            <Text style={typography.muted}>
              {mode === 'login' ? 'New here? ' : 'Already have an account? '}
              <Text style={styles.link}>
                {mode === 'login' ? 'Create an account' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  center: { textAlign: 'center' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  input: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 15,
  },
  switch: { alignItems: 'center', marginTop: spacing.sm },
  error: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  errorText: { color: colors.danger, fontSize: 14 },
  errorHint: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  passwordRow: { justifyContent: 'center' },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  passwordInput: { paddingRight: 52 },
  eye: { position: 'absolute', right: spacing.xs },
  link: { color: colors.primary, fontWeight: '600' },
});
