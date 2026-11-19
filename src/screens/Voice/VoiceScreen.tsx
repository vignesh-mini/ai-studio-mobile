import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { MarkdownText } from '../../components/MarkdownText';
import { Screen } from '../../components/Screen';
import type { RootScreenProps } from '../../navigation/types';
import { voiceService } from '../../services/api/voiceService';
import { streamChat } from '../../services/chatStream';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, spacing, toolColors, typography } from '../../theme';
import { errorMessage } from '../../utils';

type Phase = 'idle' | 'listening' | 'transcribing' | 'thinking';

const phaseLabel: Record<Phase, string> = {
  idle: 'Tap to speak',
  listening: 'Listening… tap to stop',
  transcribing: 'Transcribing',
  thinking: 'Thinking',
};

export function VoiceScreen({ navigation }: RootScreenProps<'Voice'>) {
  const modelId = useSettingsStore(s => s.defaultChatModel);
  const autoSpeak = useSettingsStore(s => s.autoSpeakReplies);
  const setAutoSpeak = useSettingsStore(s => s.setAutoSpeakReplies);
  const createConversation = useChatStore(s => s.createConversation);

  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [answeredBy, setAnsweredBy] = useState(modelId);
  const cancelRef = useRef<(() => void) | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'listening') {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [phase, pulse]);

  useEffect(() => () => cancelRef.current?.(), []);

  // Phase 1 simulates recording. Phase 6 records with an audio module, uploads the clip
  // to POST /audio/transcribe (Whisper) and plays POST /audio/speech for replies.
  const toggleMic = async () => {
    if (phase === 'idle') {
      setTranscript('');
      setReply('');
      setPhase('listening');
      return;
    }
    if (phase !== 'listening') return;

    setPhase('transcribing');
    try {
      const text = await voiceService.transcribe('mock://recording.m4a');
      setTranscript(text);
      setPhase('thinking');
      let full = '';
      cancelRef.current = streamChat(
        {
          conversationId: 'voice',
          modelId,
          messages: [{ role: 'user', content: text }],
        },
        {
          onToken: token => {
            full += token;
            setReply(r => r + token);
          },
          onDone: ({ modelId: resolved }) => {
            setAnsweredBy(resolved);
            setPhase('idle');
            cancelRef.current = null;
            if (autoSpeak) voiceService.synthesize(full);
          },
          onError: error => {
            setReply(error.message);
            setPhase('idle');
          },
        },
      );
    } catch (error) {
      setReply(errorMessage(error));
      setPhase('idle');
    }
  };

  const continueInChat = () => {
    const conversationId = createConversation(answeredBy, [
      { role: 'user', content: transcript },
      {
        role: 'assistant',
        content: reply,
        modelId: answeredBy,
        status: 'done',
      },
    ]);
    navigation.navigate('Main', { screen: 'Chat', params: { conversationId } });
  };

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      header={<AppHeader title="Voice AI" onBack={navigation.goBack} />}
    >
      <View style={styles.micArea}>
        <Animated.View
          style={[
            styles.ring,
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />
        <Pressable
          onPress={toggleMic}
          style={[styles.mic, phase === 'listening' && styles.micActive]}
          accessibilityRole="button"
          accessibilityLabel={phaseLabel[phase]}
        >
          <Icon
            name={phase === 'listening' ? 'stop' : 'mic'}
            size={40}
            color={colors.white}
          />
        </Pressable>
        <Text style={typography.h3}>{phaseLabel[phase]}</Text>
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.flex}>
          <Text style={typography.body}>Speak replies aloud</Text>
          <Text style={typography.caption}>
            Uses the backend text-to-speech endpoint
          </Text>
        </View>
        <Switch
          value={autoSpeak}
          onValueChange={setAutoSpeak}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {transcript ? (
        <Card style={styles.group}>
          <Text style={typography.label}>You said</Text>
          <Text style={typography.body}>{transcript}</Text>
        </Card>
      ) : null}
      {reply ? (
        <Card style={styles.group}>
          <Text style={typography.label}>AI response</Text>
          <MarkdownText>{reply}</MarkdownText>
        </Card>
      ) : null}
      {reply && phase === 'idle' ? (
        <Button
          title="Continue in chat"
          icon="chatbubbles-outline"
          variant="secondary"
          onPress={continueInChat}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: spacing.sm },
  micArea: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  ring: {
    position: 'absolute',
    top: spacing.xxl,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: toolColors.voice,
  },
  mic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: toolColors.voice,
  },
  micActive: { backgroundColor: colors.danger },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
