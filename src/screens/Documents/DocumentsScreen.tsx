import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import { useMutation } from '@tanstack/react-query';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import type { RootScreenProps } from '../../navigation/types';
import {
  documentService,
  MAX_UPLOAD_BYTES,
  type LocalFile,
} from '../../services/api/documentService';
import { colors, radius, spacing, toolColors, typography } from '../../theme';
import type { DocumentAnalysis } from '../../types';
import { errorMessage } from '../../utils';

/** Opens the system file picker; resolves null if the user backs out. */
async function chooseFile(): Promise<LocalFile | null> {
  try {
    const [file] = await pick({ type: [types.pdf, types.plainText] });
    return {
      uri: file.uri,
      name: file.name ?? 'document.pdf',
      mimeType: file.type ?? 'application/pdf',
      size: file.size ?? 0,
    };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED)
      return null;
    throw error;
  }
}

interface QA {
  question: string;
  answer?: string;
}

export function DocumentsScreen({ navigation }: RootScreenProps<'Documents'>) {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState<QA[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const process = useMutation({
    mutationFn: async (file: LocalFile) =>
      documentService.analyze(await documentService.upload(file)),
    onSuccess: result => {
      setAnalysis(result);
      setThread([]);
    },
    onError: error => setUploadError(errorMessage(error)),
  });

  const upload = async () => {
    setUploadError(null);
    try {
      const file = await chooseFile();
      if (!file) return;
      if (file.size > MAX_UPLOAD_BYTES) {
        setUploadError('Files must be 10 MB or smaller.');
        return;
      }
      process.mutate(file);
    } catch (error) {
      Alert.alert('Could not open the file', errorMessage(error));
    }
  };

  const ask = useMutation({
    mutationFn: (q: string) => documentService.ask(analysis!.fileId, q),
    onMutate: q => setThread(t => [...t, { question: q }]),
    onSuccess: answer =>
      setThread(t =>
        t.map((qa, i) => (i === t.length - 1 ? { ...qa, answer } : qa)),
      ),
    onError: error =>
      setThread(t =>
        t.map((qa, i) =>
          i === t.length - 1 ? { ...qa, answer: errorMessage(error) } : qa,
        ),
      ),
  });

  const submitQuestion = () => {
    const q = question.trim();
    if (!q || ask.isPending) return;
    setQuestion('');
    ask.mutate(q);
  };

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      header={<AppHeader title="Document AI" onBack={navigation.goBack} />}
    >
      <Pressable
        onPress={upload}
        disabled={process.isPending}
        style={styles.drop}
        accessibilityRole="button"
      >
        <View style={styles.dropIcon}>
          <Icon
            name="cloud-upload-outline"
            size={28}
            color={toolColors.document}
          />
        </View>
        <Text style={typography.h3}>
          {process.isPending
            ? 'Uploading and reading…'
            : analysis
            ? 'Upload another file'
            : 'Upload a PDF'}
        </Text>
        <Text style={typography.caption}>
          PDF or text file up to 10 MB · only its text is kept on the server
        </Text>
      </Pressable>
      {uploadError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {uploadError}
        </Text>
      ) : null}

      {analysis ? (
        <>
          <Card style={styles.group}>
            <View style={styles.fileRow}>
              <Icon
                name="document-text"
                size={20}
                color={toolColors.document}
              />
              <Text style={[typography.h3, styles.flex]} numberOfLines={1}>
                {analysis.fileName}
              </Text>
              <Text style={typography.caption}>{analysis.pages} pages</Text>
            </View>
            <Text style={typography.label}>Summary</Text>
            <Text style={typography.body}>{analysis.summary}</Text>
            <Text style={typography.label}>Key points</Text>
            {analysis.keyPoints.map(point => (
              <View key={point} style={styles.point}>
                <Icon
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={[typography.body, styles.flex]}>{point}</Text>
              </View>
            ))}
          </Card>

          <Text style={typography.label}>Ask about this document</Text>
          {thread.map((qa, i) => (
            <View key={i} style={styles.group}>
              <Text style={styles.question}>{qa.question}</Text>
              <Card>
                <Text style={typography.body}>
                  {qa.answer ?? 'Reading the document…'}
                </Text>
              </Card>
            </View>
          ))}
          <View style={styles.askRow}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={submitQuestion}
              placeholder="What does it say about quotas?"
              placeholderTextColor={colors.textFaint}
              style={styles.askInput}
              returnKeyType="send"
            />
            <Button
              title="Ask"
              onPress={submitQuestion}
              loading={ask.isPending}
              disabled={!question.trim()}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: spacing.sm },
  drop: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
  },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  point: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  question: { alignSelf: 'flex-end', color: colors.primary, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14 },
  askRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  askInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
});
