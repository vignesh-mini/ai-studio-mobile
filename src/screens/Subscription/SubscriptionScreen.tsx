import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import type { RootScreenProps } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography } from '../../theme';

const plans = [
  {
    id: 'free' as const,
    name: 'Starter',
    price: 'Free',
    features: [
      '50 chat messages per day',
      'Selected free models (Gemini Flash, Groq, OpenRouter)',
      '10 images per day',
      'Short videos when capacity allows',
      'Standard generation priority',
    ],
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: '₹499 / month',
    features: [
      'Higher daily limits',
      'Premium models (Gemini Pro, FLUX dev, LTX, HunyuanVideo)',
      'Priority image and video queue',
      'Larger uploads and longer context',
      'Multi-model comparison without limits',
    ],
  },
];

export function SubscriptionScreen({
  navigation,
}: RootScreenProps<'Subscription'>) {
  const currentPlan = useAuthStore(s => s.user?.plan ?? 'free');

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      header={<AppHeader title="Plans" onBack={navigation.goBack} />}
    >
      <Text style={typography.muted}>
        Usage limits keep AI costs predictable. Upgrade any time for more
        capacity.
      </Text>
      {plans.map(plan => {
        const current = plan.id === currentPlan;
        return (
          <Card
            key={plan.id}
            style={[styles.card, plan.id === 'premium' && styles.premium]}
          >
            <View style={styles.header}>
              <Text style={typography.h2}>{plan.name}</Text>
              <Text style={typography.h3}>{plan.price}</Text>
            </View>
            {plan.features.map(feature => (
              <View key={feature} style={styles.feature}>
                <Icon
                  name="checkmark"
                  size={16}
                  color={
                    plan.id === 'premium' ? colors.warning : colors.success
                  }
                />
                <Text style={[typography.body, styles.flex]}>{feature}</Text>
              </View>
            ))}
            <Button
              title={current ? 'Current plan' : `Choose ${plan.name}`}
              variant={plan.id === 'premium' ? 'primary' : 'secondary'}
              disabled={current}
              onPress={() =>
                Alert.alert(
                  'Coming soon',
                  'Payments and credits are part of Phase 7 (billing module).',
                )
              }
            />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.md },
  premium: { borderColor: colors.warning },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  feature: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
