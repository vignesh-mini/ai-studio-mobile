import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import type { GenerationJob } from '../types';
import { Card } from './Card';
import { Icon } from './Icon';
import { ProgressBar } from './ProgressBar';

const labels = {
  queued: 'Queued – waiting for a GPU worker',
  processing: 'Generating',
  completed: 'Completed',
  failed: 'Generation failed',
};

export function JobProgress({ job }: { job?: GenerationJob }) {
  const status = job?.status ?? 'queued';
  const failed = status === 'failed';
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Icon
          name={
            failed
              ? 'alert-circle'
              : status === 'completed'
              ? 'checkmark-circle'
              : 'hourglass'
          }
          size={18}
          color={
            failed
              ? colors.danger
              : status === 'completed'
              ? colors.success
              : colors.primary
          }
        />
        <Text style={[typography.body, styles.flex]}>
          {failed ? job?.error ?? labels.failed : labels[status]}
        </Text>
        {status === 'processing' ? (
          <Text style={typography.caption}>
            {Math.round((job?.progress ?? 0) * 100)}%
          </Text>
        ) : null}
      </View>
      {!failed ? (
        <ProgressBar value={status === 'queued' ? 0.05 : job?.progress ?? 0} />
      ) : null}
      <Text style={typography.caption}>
        You can leave this screen – results are saved to your Library.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
