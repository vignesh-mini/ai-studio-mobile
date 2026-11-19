import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { JobProgress } from '../../components/JobProgress';
import { MediaGrid, MediaTile } from '../../components/MediaGrid';
import { ModelPicker } from '../../components/ModelPicker';
import { OptionGroup, type Option } from '../../components/OptionGroup';
import { PromptInput } from '../../components/PromptInput';
import { env } from '../../config/env';
import { DemoNotice } from '../../components/DemoNotice';
import { Screen } from '../../components/Screen';
import { useJob } from '../../hooks/useJob';
import { useModel } from '../../hooks/useModels';
import type { TabScreenProps } from '../../navigation/types';
import { imageService } from '../../services/api/mediaService';
import { useLibraryStore } from '../../store/libraryStore';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, spacing, typography } from '../../theme';
import type { AspectRatio, ImageGenerateRequest } from '../../types';
import { errorMessage } from '../../utils';

type Mode = 'create' | 'edit';

const modes: Option<Mode>[] = [
  { value: 'create', label: 'Text to image', icon: 'sparkles' },
  { value: 'edit', label: 'Edit image', icon: 'brush' },
];
const counts: Option<ImageGenerateRequest['count']>[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
];
const ratios: Option<AspectRatio>[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];
const qualities: Option<ImageGenerateRequest['quality']>[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'high', label: 'High' },
];

export function ImageStudioScreen({ navigation }: TabScreenProps<'Images'>) {
  const model = useSettingsStore(s => s.imageModel);
  const setModel = useSettingsStore(s => s.setImageModel);
  const assets = useLibraryStore(s => s.assets);
  const sources = useMemo(
    () => assets.filter(a => a.type === 'image'),
    [assets],
  );

  const [mode, setMode] = useState<Mode>('create');
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState<ImageGenerateRequest['count']>(2);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [quality, setQuality] =
    useState<ImageGenerateRequest['quality']>('standard');
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  // Inline, because Android can drop Alert dialogs.
  const [error, setError] = useState<string | null>(null);

  const selectedModel = useModel(model);
  // Editing arrives with a backend editing model; until then only mocks offer it.
  const canEdit = env.mocks.images;
  const supportsRatio =
    env.mocks.images || !!selectedModel?.capabilities.includes('aspect-ratio');
  const effectiveRatio: AspectRatio = supportsRatio ? aspectRatio : '1:1';

  const job = useJob(jobId);
  const status = job.data?.status;
  const running = !!jobId && status !== 'completed' && status !== 'failed';

  const enhance = useMutation({
    mutationFn: imageService.enhancePrompt,
    onMutate: () => setError(null),
    onSuccess: setPrompt,
    onError: e => setError(`Could not enhance the prompt: ${errorMessage(e)}`),
  });
  const generate = useMutation({
    mutationFn: () =>
      mode === 'create'
        ? imageService.generate({
            model,
            prompt: prompt.trim(),
            count,
            aspectRatio: effectiveRatio,
            quality,
          })
        : imageService.edit({
            model,
            prompt: prompt.trim(),
            sourceAssetId: sourceId!,
            aspectRatio,
          }),
    onMutate: () => setError(null),
    onSuccess: response => setJobId(response.jobId),
    onError: e => setError(errorMessage(e)),
  });

  const canGenerate =
    prompt.trim().length > 2 && (mode === 'create' || !!sourceId) && !running;

  return (
    <Screen scroll>
      <View>
        <Text style={typography.h1}>Image Studio</Text>
        <Text style={typography.muted}>
          Turn your ideas into images with FLUX and more.
        </Text>
      </View>
      <DemoNotice visible={env.mocks.images} what="Generated images" />

      {canEdit ? (
        <OptionGroup
          label="Mode"
          options={modes}
          value={mode}
          onChange={setMode}
        />
      ) : null}
      <ModelPicker
        task="image"
        label="Model"
        value={model}
        onChange={m => setModel(m.id)}
      />

      {mode === 'edit' ? (
        <View style={styles.group}>
          <Text style={typography.label}>Source image</Text>
          {sources.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sources}
            >
              {sources.map(asset => (
                <View key={asset.id} style={styles.source}>
                  <MediaTile
                    asset={asset}
                    square
                    selected={asset.id === sourceId}
                    onPress={() => setSourceId(asset.id)}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={typography.muted}>
              Generate an image first – it will appear here.
            </Text>
          )}
        </View>
      ) : null}

      <PromptInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder={
          mode === 'create'
            ? 'A cinematic beach at midnight with a glowing blue ocean…'
            : 'Describe the change: make it sunset, add fireworks…'
        }
        onEnhance={() => enhance.mutate(prompt)}
        enhancing={enhance.isPending}
      />

      {mode === 'create' ? (
        <OptionGroup
          label="Images"
          options={counts}
          value={count}
          onChange={setCount}
        />
      ) : null}
      {supportsRatio ? (
        <OptionGroup
          label="Aspect ratio"
          options={ratios}
          value={aspectRatio}
          onChange={setAspectRatio}
        />
      ) : (
        <Text style={typography.caption}>
          {selectedModel?.name ?? 'This model'} creates square (1:1) images.
          Premium models support other aspect ratios.
        </Text>
      )}
      {mode === 'create' ? (
        <OptionGroup
          label="Quality"
          options={qualities}
          value={quality}
          onChange={setQuality}
        />
      ) : null}

      <Button
        title={
          running
            ? 'Generating…'
            : mode === 'create'
            ? 'Generate'
            : 'Apply edit'
        }
        icon="sparkles"
        loading={generate.isPending}
        disabled={!canGenerate}
        onPress={() => generate.mutate()}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {jobId ? <JobProgress job={job.data} /> : null}

      {job.data?.assets?.length ? (
        <View style={styles.group}>
          <Text style={typography.label}>Results</Text>
          <MediaGrid
            assets={job.data.assets}
            columns={job.data.assets.length > 1 ? 2 : 1}
            onPress={asset =>
              navigation.navigate('AssetViewer', { assetId: asset.id })
            }
          />
        </View>
      ) : !jobId ? (
        <EmptyState
          icon="images-outline"
          title="Your images appear here"
          message="Generate 1, 2 or 4 variations at once."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
  sources: { gap: spacing.sm },
  source: { width: 96 },
});
