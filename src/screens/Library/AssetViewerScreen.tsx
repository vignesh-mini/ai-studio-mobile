import { useState } from 'react';
import { Alert, Image, Share, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import Video from 'react-native-video';
import { Screen } from '../../components/Screen';
import { useModel } from '../../hooks/useModels';
import type { RootScreenProps } from '../../navigation/types';
import { libraryService } from '../../services/api/mediaService';
import { useLibraryStore } from '../../store/libraryStore';
import { colors, radius, spacing, typography } from '../../theme';
import { aspectRatioValue, errorMessage, timeAgo } from '../../utils';
import { notify } from '../../utils/notify';
import { saveToDevice } from '../../utils/saveToDevice';

export function AssetViewerScreen({
  navigation,
  route,
}: RootScreenProps<'AssetViewer'>) {
  const asset = useLibraryStore(s =>
    s.assets.find(a => a.id === route.params.assetId),
  );
  const removeAsset = useLibraryStore(s => s.removeAsset);
  const model = useModel(asset?.modelId);
  const [saving, setSaving] = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!asset) {
    return (
      <Screen
        edges={['top', 'bottom']}
        header={<AppHeader onBack={navigation.goBack} />}
      >
        <EmptyState icon="trash-outline" title="This item was deleted" />
      </Screen>
    );
  }

  const confirmDelete = () =>
    Alert.alert(
      'Delete from library?',
      'This removes the file from cloud storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await libraryService.remove(asset);
              navigation.goBack();
              removeAsset(asset.id);
            } catch (error) {
              notify(`Could not delete: ${errorMessage(error)}`);
            }
          },
        },
      ],
    );

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      header={
        <AppHeader
          title={asset.type === 'video' ? 'Video' : 'Image'}
          onBack={navigation.goBack}
        />
      }
    >
      {asset.type === 'video' ? (
        <View>
          <Video
            source={{ uri: asset.url }}
            style={[
              styles.media,
              { aspectRatio: aspectRatioValue(asset.aspectRatio) },
            ]}
            controls
            paused
            resizeMode="contain"
            poster={
              asset.thumbnailUrl
                ? { source: { uri: asset.thumbnailUrl }, resizeMode: 'cover' }
                : undefined
            }
            onError={() => setVideoError(true)}
          />
          {videoError ? (
            <View style={styles.videoError}>
              <Icon name="alert-circle" size={24} color={colors.danger} />
              <Text style={typography.caption}>
                This video could not be played.
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Image
          source={{ uri: asset.url }}
          style={[
            styles.media,
            { aspectRatio: aspectRatioValue(asset.aspectRatio) },
          ]}
        />
      )}
      {asset.local && asset.type === 'video' ? (
        <Text style={typography.caption}>
          Demo: this is a sample clip. Real generated videos play here once a
          video provider is connected.
        </Text>
      ) : null}

      <View style={styles.meta}>
        <Text style={typography.label}>Prompt</Text>
        <Text style={typography.body} selectable>
          {asset.prompt}
        </Text>
        <Text style={typography.caption}>
          {model?.name ?? asset.modelId} · {asset.aspectRatio}
          {asset.durationSec ? ` · ${asset.durationSec}s` : ''} ·{' '}
          {timeAgo(asset.createdAt)}
        </Text>
      </View>

      <Button
        title="Save to device"
        icon="download-outline"
        loading={saving}
        onPress={async () => {
          setSaving(true);
          try {
            await saveToDevice(asset);
            notify('Saved to your gallery (AI Studio album)');
          } catch (error) {
            notify(`Could not save: ${errorMessage(error)}`);
          } finally {
            setSaving(false);
          }
        }}
      />
      <Button
        title="Share"
        icon="share-outline"
        variant="secondary"
        onPress={() => Share.share({ message: asset.url, url: asset.url })}
      />
      {asset.type === 'image' ? (
        <Button
          title="Edit this image"
          icon="brush-outline"
          variant="secondary"
          onPress={() =>
            navigation.navigate('Main', {
              screen: 'Images',
              params: { sourceAssetId: asset.id },
            })
          }
        />
      ) : null}
      {asset.type === 'image' ? (
        <Button
          title="Animate into a video"
          icon="videocam-outline"
          variant="secondary"
          onPress={() =>
            navigation.navigate('Main', {
              screen: 'Videos',
              params: { sourceAssetId: asset.id },
            })
          }
        />
      ) : null}
      <Button
        title="Delete"
        icon="trash-outline"
        variant="danger"
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  media: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  videoError: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.overlay,
  },
  meta: { gap: spacing.sm },
});
