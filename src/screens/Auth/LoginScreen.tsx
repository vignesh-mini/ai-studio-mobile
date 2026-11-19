import { useState } from 'react';
import {
  Alert,
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
import {
  authService,
  type SocialProvider,
} from '../../services/api/authService';
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
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<Pending>(null);

  const run = async (
    kind: Exclude<Pending, null>,
    action: () => Promise<AuthSession>,
  ) => {
    setPending(kind);
    try {
      setSession(await action());
    } catch (error) {
      Alert.alert('Sign in failed', errorMessage(error));
    } finally {
      setPending(null);
    }
  };

  const submitEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      Alert.alert(
        'Check your details',
        'Enter a valid email and a password of 6+ characters.',
      );
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
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              autoComplete="name"
            />
          ) : null}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            secureTextEntry
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
          />
          <Button
            title={mode === 'login' ? 'Sign in' : 'Create account'}
            loading={pending === 'email'}
            disabled={!!pending}
            onPress={submitEmail}
          />

          <Pressable
            onPress={() => setMode(m => (m === 'login' ? 'register' : 'login'))}
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
  link: { color: colors.primary, fontWeight: '600' },
});
