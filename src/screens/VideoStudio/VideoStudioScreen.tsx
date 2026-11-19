import { useEffect, useState, useMemo } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { JobProgress } from '../../components/JobProgress';
import { MediaTile } from '../../components/MediaGrid';
import { ModelPicker } from '../../components/ModelPicker';
import { OptionGroup, type Option } from '../../components/OptionGroup';
import { PromptInput } from '../../components/PromptInput';
import { Screen } from '../../components/Screen';
import { useJob } from '../../hooks/useJob';
import { useModel } from '../../hooks/useModels';
import type { TabScreenProps } from '../../navigation/types';
import { imageService, videoService } from '../../services/api/mediaService';
import { useLibraryStore } from '../../store/libraryStore';
import { useSettingsStore } from '../../store/settingsStore';
import { spacing, typography } from '../../theme';
import type { AspectRatio, VideoMode } from '../../types';
import { errorMessage } from '../../utils';

const modes: Option<VideoMode>[] = [
  { value: 'text-to-video', label: 'Text to video', icon: 'text' },
  { value: 'image-to-video', label: 'Image to video', icon: 'image' },
];
const durations: Option<number>[] = [
  { value: 4, label: '4s' },
  { value: 6, label: '6s' },
  { value: 8, label: '8s' },
];
const ratios: Option<AspectRatio>[] = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
];

export function VideoStudioScreen({
  navigation,
  route,
}: TabScreenProps<'Videos'>) {
  const modelId = useSettingsStore(s => s.videoModel);
  const setModel = useSettingsStore(s => s.setVideoModel);
  const model = useModel(modelId);
  const assets = useLibraryStore(s => s.assets);
  const sources = useMemo(
    () => assets.filter(a => a.type === 'image'),
    [assets],
  );

  const [mode, setMode] = useState<VideoMode>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(6);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // "Animate" from the asset viewer arrives with a source image preselected.
  const sourceAssetId = route.params?.sourceAssetId;
  useEffect(() => {
    if (!sourceAssetId) return;
    setMode('image-to-video');
    setSourceId(sourceAssetId);
    navigation.setParams({ sourceAssetId: undefined });
  }, [sourceAssetId, navigation]);

  const job = useJob(jobId);
  const status = job.data?.status;
  const running = !!jobId && status !== 'completed' && status !== 'failed';
  const video = job.data?.assets?.[0];
  const supportsMode = !model || model.capabilities.includes(mode);

  const enhance = useMutation({
    mutationFn: imageService.enhancePrompt,
    onSuccess: setPrompt,
  });
  const generate = useMutation({
    mutationFn: () =>
      videoService.generate({
        model: modelId,
        prompt: prompt.trim(),
        mode,
        durationSec: duration,
        aspectRatio,
        sourceAssetId:
          mode === 'image-to-video' ? sourceId ?? undefined : undefined,
      }),
    onSuccess: response => setJobId(response.jobId),
    onError: error => Alert.alert('Could not start video', errorMessage(error)),
  });

  const canGenerate =
    supportsMode &&
    !running &&
    prompt.trim().length > 2 &&
    (mode === 'text-to-video' || !!sourceId);

  return (
    <Screen scroll>
      <View>
        <Text style={typography.h1}>Video Studio</Text>
        <Text style={typography.muted}>
          Text-to-video and image-to-video with Wan 2.2 and more.
        </Text>
      </View>

      <OptionGroup
        label="Mode"
        options={modes}
        value={mode}
        onChange={setMode}
      />
      <ModelPicker
        task="video"
        label="Model"
        value={modelId}
        onChange={m => setModel(m.id)}
      />
      {!supportsMode ? (
        <Text style={typography.caption}>
          {model?.name} does not support {mode}. Pick another model.
        </Text>
      ) : null}

      {mode === 'image-to-video' ? (
        <View style={styles.group}>
          <Text style={typography.label}>Start frame</Text>
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
        </View>
      ) : null}

      <PromptInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="An 8-second cinematic shot of waves glowing blue under the moon…"
        onEnhance={() => enhance.mutate(prompt)}
        enhancing={enhance.isPending}
      />
      <OptionGroup
        label="Duration"
        options={durations}
        value={duration}
        onChange={setDuration}
      />
      <OptionGroup
        label="Aspect ratio"
        options={ratios}
        value={aspectRatio}
        onChange={setAspectRatio}
      />

      <Button
        title={running ? 'Generating…' : 'Generate video'}
        icon="videocam"
        loading={generate.isPending}
        disabled={!canGenerate}
        onPress={() => generate.mutate()}
      />
      <Text style={typography.caption}>
        Video runs as a background job and usually takes a few minutes on real
        GPUs.
      </Text>

      {jobId ? <JobProgress job={job.data} /> : null}

      {video ? (
        <Card style={styles.group}>
          <MediaTile
            asset={video}
            onPress={() =>
              navigation.navigate('AssetViewer', { assetId: video.id })
            }
          />
          <Text style={typography.body} numberOfLines={2}>
            {video.prompt}
          </Text>
          <Button
            title="Share"
            icon="share-outline"
            variant="secondary"
            onPress={() => Share.share({ message: video.url, url: video.url })}
          />
        </Card>
      ) : !jobId ? (
        <EmptyState
          icon="film-outline"
          title="No video yet"
          message="Describe a scene and pick a duration to start."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  sources: { gap: spacing.sm },
  source: { width: 96 },
});
