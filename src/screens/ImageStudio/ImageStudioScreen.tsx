import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
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
import { colors, radius, spacing, typography } from '../../theme';
import type {
  AIModel,
  AspectRatio,
  ImageGenerateRequest,
  PickedPhoto,
} from '../../types';
import { errorMessage } from '../../utils';

type Mode = 'create' | 'edit';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const modes: Option<Mode>[] = [
  { value: 'create', label: 'Text to image', icon: 'sparkles' },
  { value: 'edit', label: 'Edit a photo', icon: 'brush' },
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
const editIdeas = [
  'Make it golden sunset light',
  'Turn it into a watercolor painting',
  'Add falling snow',
  'Make it look like a 90s film photo',
];

const canEdit = (m: AIModel) => m.capabilities.includes('edit');
const canCreate = (m: AIModel) => !canEdit(m);

/** Opens the system photo picker; resolves null if the user backs out. */
async function choosePhoto(): Promise<PickedPhoto | null> {
  try {
    const [file] = await pick({ type: [types.images] });
    return {
      uri: file.uri,
      name: file.name ?? 'photo.jpg',
      mimeType: file.type ?? 'image/jpeg',
      size: file.size ?? 0,
    };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED)
      return null;
    throw error;
  }
}

type Source =
  | { kind: 'photo'; photo: PickedPhoto }
  | { kind: 'library'; id: string };

export function ImageStudioScreen({
  navigation,
  route,
}: TabScreenProps<'Images'>) {
  const createModel = useSettingsStore(s => s.imageModel);
  const setCreateModel = useSettingsStore(s => s.setImageModel);
  const editModel = useSettingsStore(s => s.editModel);
  const setEditModel = useSettingsStore(s => s.setEditModel);
  const assets = useLibraryStore(s => s.assets);
  const libraryImages = useMemo(
    () => assets.filter(a => a.type === 'image'),
    [assets],
  );

  const [mode, setMode] = useState<Mode>('create');
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState<ImageGenerateRequest['count']>(2);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [quality, setQuality] =
    useState<ImageGenerateRequest['quality']>('standard');
  const [source, setSource] = useState<Source | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  // Inline, because Android can drop Alert dialogs.
  const [error, setError] = useState<string | null>(null);

  // "Edit this image" from the asset viewer arrives with the image preselected.
  const sourceAssetId = route.params?.sourceAssetId;
  useEffect(() => {
    if (!sourceAssetId) return;
    setMode('edit');
    setSource({ kind: 'library', id: sourceAssetId });
    setCount(1);
    navigation.setParams({ sourceAssetId: undefined });
  }, [sourceAssetId, navigation]);

  const model = mode === 'create' ? createModel : editModel;
  const selectedModel = useModel(model);
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
            count,
            photo: source?.kind === 'photo' ? source.photo : undefined,
            sourceAssetId: source?.kind === 'library' ? source.id : undefined,
          }),
    onMutate: () => setError(null),
    onSuccess: response => setJobId(response.jobId),
    onError: e => setError(errorMessage(e)),
  });

  const pickPhoto = async () => {
    setError(null);
    try {
      const photo = await choosePhoto();
      if (!photo) return;
      if (photo.size > MAX_PHOTO_BYTES) {
        setError('Photos must be 10 MB or smaller.');
        return;
      }
      setSource({ kind: 'photo', photo });
    } catch (e) {
      setError(`Could not open the photo: ${errorMessage(e)}`);
    }
  };

  const canGenerate =
    prompt.trim().length > 2 && (mode === 'create' || !!source) && !running;

  return (
    <Screen scroll>
      <View>
        <Text style={typography.h1}>Image Studio</Text>
        <Text style={typography.muted}>
          {mode === 'create'
            ? 'Turn your ideas into images with FLUX and more.'
            : 'Upload a photo and describe the change you want.'}
        </Text>
      </View>
      <DemoNotice visible={env.mocks.images} what="Generated images" />

      <OptionGroup
        label="Mode"
        options={modes}
        value={mode}
        onChange={m => {
          setMode(m);
          setError(null);
        }}
      />
      <ModelPicker
        task="image"
        label="Model"
        value={model}
        filter={mode === 'create' ? canCreate : canEdit}
        onChange={m =>
          mode === 'create' ? setCreateModel(m.id) : setEditModel(m.id)
        }
      />

      {mode === 'edit' ? (
        <View style={styles.group}>
          <Text style={typography.label}>Photo</Text>
          <View style={styles.sourceRow}>
            <Pressable
              onPress={pickPhoto}
              style={styles.upload}
              accessibilityRole="button"
              accessibilityLabel="Choose a photo from your device"
            >
              {source?.kind === 'photo' ? (
                <Image
                  source={{ uri: source.photo.uri }}
                  style={styles.uploadPreview}
                />
              ) : (
                <>
                  <Icon name="image-outline" size={24} color={colors.primary} />
                  <Text style={styles.uploadText}>From gallery</Text>
                </>
              )}
            </Pressable>
            {libraryImages.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sources}
              >
                {libraryImages.map(asset => (
                  <View key={asset.id} style={styles.source}>
                    <MediaTile
                      asset={asset}
                      square
                      selected={
                        source?.kind === 'library' && source.id === asset.id
                      }
                      onPress={() =>
                        setSource({ kind: 'library', id: asset.id })
                      }
                    />
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>
          <Text style={typography.caption}>
            {source?.kind === 'photo'
              ? `${source.photo.name} · tap to change`
              : 'Pick a photo from your gallery or an image from your library.'}
          </Text>
        </View>
      ) : null}

      <PromptInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder={
          mode === 'create'
            ? 'A cinematic beach at midnight with a glowing blue ocean…'
            : 'Describe the change: make it sunset, turn it into anime…'
        }
        onEnhance={mode === 'create' ? () => enhance.mutate(prompt) : undefined}
        enhancing={enhance.isPending}
      />
      {mode === 'edit' && !prompt ? (
        <View style={styles.ideas}>
          {editIdeas.map(idea => (
            <Pressable
              key={idea}
              onPress={() => setPrompt(idea)}
              style={styles.idea}
              accessibilityRole="button"
            >
              <Text style={styles.ideaText}>{idea}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <OptionGroup
        label={mode === 'create' ? 'Images' : 'Variations'}
        options={counts}
        value={count}
        onChange={setCount}
      />
      {mode === 'edit' ? (
        <Text style={typography.caption}>
          Results keep your photo's shape. Each variation counts as one image.
        </Text>
      ) : supportsRatio ? (
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
        icon={mode === 'create' ? 'sparkles' : 'brush'}
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
          message={
            mode === 'create'
              ? 'Generate 1, 2 or 4 variations at once.'
              : 'Edited versions of your photo appear here.'
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
  sourceRow: { flexDirection: 'row', gap: spacing.sm },
  sources: { gap: spacing.sm },
  source: { width: 96 },
  upload: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
    backgroundColor: colors.primaryMuted,
  },
  uploadPreview: { width: '100%', height: '100%' },
  uploadText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  idea: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ideaText: { color: colors.textMuted, fontSize: 13 },
});
