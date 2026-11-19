import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { MarkdownText } from '../../components/MarkdownText';
import { ModelPicker } from '../../components/ModelPicker';
import { Screen } from '../../components/Screen';
import { useModel } from '../../hooks/useModels';
import type { RootScreenProps } from '../../navigation/types';
import { streamChat } from '../../services/chatStream';
import { useChatStore } from '../../store/chatStore';
import { colors, radius, spacing, typography } from '../../theme';
import { uid } from '../../utils';

interface Lane {
  modelId: string;
  text: string;
  status: 'idle' | 'streaming' | 'done' | 'error';
}

const initialLanes: Lane[] = [
  { modelId: 'gemini-flash', text: '', status: 'idle' },
  { modelId: 'groq-qwen3-32b', text: '', status: 'idle' },
];

export function CompareScreen({
  navigation,
  route,
}: RootScreenProps<'Compare'>) {
  const [prompt, setPrompt] = useState(route.params?.prompt ?? '');
  const [askedPrompt, setAskedPrompt] = useState('');
  const [lanes, setLanes] = useState<Lane[]>(initialLanes);
  const cancels = useRef<Array<() => void>>([]);
  const createConversation = useChatStore(s => s.createConversation);

  useEffect(() => () => cancels.current.forEach(cancel => cancel()), []);

  const patchLane = (
    index: number,
    patch: Partial<Lane> | ((lane: Lane) => Partial<Lane>),
  ) =>
    setLanes(current =>
      current.map((lane, i) =>
        i === index
          ? { ...lane, ...(typeof patch === 'function' ? patch(lane) : patch) }
          : lane,
      ),
    );

  const busy = lanes.some(l => l.status === 'streaming');

  const compare = () => {
    const text = prompt.trim();
    if (!text || busy) return;
    setAskedPrompt(text);
    cancels.current = lanes.map((lane, index) => {
      patchLane(index, { text: '', status: 'streaming' });
      return streamChat(
        {
          modelId: lane.modelId,
          messages: [{ id: uid('msg'), role: 'user', content: text }],
        },
        {
          onToken: token => patchLane(index, l => ({ text: l.text + token })),
          onDone: () => patchLane(index, { status: 'done' }),
          onError: error =>
            patchLane(index, { status: 'error', text: error.message }),
        },
      );
    });
  };

  // Picking a winner turns the comparison into a normal conversation with that model.
  const continueWith = (lane: Lane) => {
    const conversationId = createConversation(lane.modelId, [
      { role: 'user', content: askedPrompt },
      {
        role: 'assistant',
        content: lane.text,
        modelId: lane.modelId,
        status: 'done',
      },
    ]);
    navigation.navigate('Main', { screen: 'Chat', params: { conversationId } });
  };

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      header={<AppHeader title="Compare models" onBack={navigation.goBack} />}
    >
      <Text style={typography.muted}>
        Ask two models the same question, then continue with the better answer.
      </Text>
      <View style={styles.pickers}>
        {lanes.map((lane, index) => (
          <View key={index} style={styles.flex}>
            <ModelPicker
              task="chat"
              label={`Model ${index === 0 ? 'A' : 'B'}`}
              value={lane.modelId}
              onChange={m =>
                !busy &&
                patchLane(index, { modelId: m.id, text: '', status: 'idle' })
              }
            />
          </View>
        ))}
      </View>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Explain the difference between React and React Native."
        placeholderTextColor={colors.textFaint}
        multiline
        style={styles.input}
      />
      <Button
        title="Compare"
        icon="git-compare"
        disabled={!prompt.trim() || busy}
        onPress={compare}
      />

      {lanes.map((lane, index) =>
        lane.status === 'idle' ? null : (
          <LaneCard
            key={index}
            lane={lane}
            label={index === 0 ? 'A' : 'B'}
            onContinue={() => continueWith(lane)}
          />
        ),
      )}
    </Screen>
  );
}

function LaneCard({
  lane,
  label,
  onContinue,
}: {
  lane: Lane;
  label: string;
  onContinue: () => void;
}) {
  const model = useModel(lane.modelId);
  return (
    <Card style={styles.lane}>
      <View style={styles.laneHeader}>
        <Text style={styles.laneBadge}>{label}</Text>
        <Text style={[typography.h3, styles.flex]}>
          {model?.name ?? lane.modelId}
        </Text>
        {lane.status === 'streaming' ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
      </View>
      {lane.status === 'error' ? (
        <Text style={styles.error}>{lane.text}</Text>
      ) : (
        <MarkdownText>{lane.text || '…'}</MarkdownText>
      )}
      {lane.status === 'done' ? (
        <Button
          title="Continue with this answer"
          icon="chatbubbles-outline"
          variant="secondary"
          onPress={onContinue}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pickers: { flexDirection: 'row', gap: spacing.sm },
  input: {
    minHeight: 90,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  lane: { gap: spacing.md },
  laneHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  laneBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
    color: colors.white,
    fontWeight: '700',
    backgroundColor: colors.primary,
  },
  error: { color: colors.danger },
});
