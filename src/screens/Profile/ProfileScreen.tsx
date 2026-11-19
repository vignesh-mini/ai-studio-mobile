import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon, type IconName } from '../../components/Icon';
import { ModelSheet } from '../../components/ModelPicker';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { useModel } from '../../hooks/useModels';
import type { RootScreenProps } from '../../navigation/types';
import { accountService } from '../../services/api/accountService';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, radius, spacing, toolColors, typography } from '../../theme';
import type { UsageMeter } from '../../types';

export function ProfileScreen({ navigation }: RootScreenProps<'Profile'>) {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const defaultModel = useSettingsStore(s => s.defaultChatModel);
  const setDefaultModel = useSettingsStore(s => s.setDefaultChatModel);
  const model = useModel(defaultModel);
  const [pickerOpen, setPickerOpen] = useState(false);
  const usage = useQuery({
    queryKey: ['usage'],
    queryFn: accountService.usage,
  });

  const confirmDeleteData = () =>
    Alert.alert(
      'Delete my data?',
      'Removes your conversations, uploads and generated media. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await accountService.deleteAccountData();
            logout();
          },
        },
      ],
    );

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      header={<AppHeader title="Profile" onBack={navigation.goBack} />}
    >
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={typography.h2}>{user?.name}</Text>
          <Text style={typography.muted}>{user?.email}</Text>
        </View>
        <Text
          style={[
            styles.plan,
            (user?.role === 'owner' || user?.plan === 'premium') &&
              styles.planPremium,
          ]}
        >
          {user?.role === 'owner'
            ? 'OWNER'
            : user?.plan === 'premium'
            ? 'PREMIUM'
            : 'FREE'}
        </Text>
      </View>

      <Card style={styles.group}>
        <Text style={typography.label}>Today's usage</Text>
        {usage.isLoading || !usage.data ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Meter
              label="Chat messages"
              meter={usage.data.chat}
              color={toolColors.chat}
            />
            <Meter
              label="Images"
              meter={usage.data.images}
              color={toolColors.image}
            />
            <Meter
              label="Videos"
              meter={usage.data.videos}
              color={toolColors.video}
            />
            <Meter
              label="Documents"
              meter={usage.data.documents}
              color={toolColors.document}
            />
            <Text style={typography.caption}>
              Resets at{' '}
              {new Date(usage.data.resetsAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </>
        )}
      </Card>

      <Card style={styles.rows}>
        <Row
          icon="sparkles-outline"
          title="Default chat model"
          value={model?.name ?? defaultModel}
          onPress={() => setPickerOpen(true)}
        />
        <Row
          icon="diamond-outline"
          title="Subscription"
          value={user?.plan === 'premium' ? 'Premium' : 'Free'}
          onPress={() => navigation.navigate('Subscription')}
        />
        <Row
          icon="time-outline"
          title="Chat history"
          onPress={() => navigation.navigate('History')}
        />
        <Row
          icon="shield-checkmark-outline"
          title="Delete my data"
          onPress={confirmDeleteData}
        />
      </Card>

      <Button
        title="Sign out"
        icon="log-out-outline"
        variant="danger"
        onPress={logout}
      />

      <ModelSheet
        visible={pickerOpen}
        task="chat"
        selectedId={defaultModel}
        onClose={() => setPickerOpen(false)}
        onSelect={m => {
          setDefaultModel(m.id);
          setPickerOpen(false);
        }}
      />
    </Screen>
  );
}

function Meter({
  label,
  meter,
  color,
}: {
  label: string;
  meter: UsageMeter;
  color: string;
}) {
  return (
    <View style={styles.meter}>
      <View style={styles.meterRow}>
        <Text style={typography.body}>{label}</Text>
        <Text style={typography.caption}>
          {meter.limit === null
            ? `${meter.used} · Unlimited`
            : `${meter.used} / ${meter.limit}`}
        </Text>
      </View>
      {meter.limit === null ? null : (
        <ProgressBar value={meter.used / meter.limit} color={color} />
      )}
    </View>
  );
}

function Row({
  icon,
  title,
  value,
  onPress,
}: {
  icon: IconName;
  title: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <Icon name={icon} size={20} color={colors.textMuted} />
      <Text style={[typography.body, styles.flex]}>{title}</Text>
      {value ? <Text style={typography.caption}>{value}</Text> : null}
      <Icon name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: '700' },
  plan: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  planPremium: {
    color: colors.warning,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
  },
  meter: { gap: spacing.xs },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rows: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  rowPressed: { backgroundColor: colors.surfaceAlt },
});
