import { Alert, Image, Share, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useModel } from '../../hooks/useModels';
import type { RootScreenProps } from '../../navigation/types';
import { libraryService } from '../../services/api/mediaService';
import { useLibraryStore } from '../../store/libraryStore';
import { colors, radius, spacing, typography } from '../../theme';
import { aspectRatioValue, errorMessage, timeAgo } from '../../utils';
import { notify } from '../../utils/notify';

export function AssetViewerScreen({
  navigation,
  route,
}: RootScreenProps<'AssetViewer'>) {
  const asset = useLibraryStore(s =>
    s.assets.find(a => a.id === route.params.assetId),
  );
  const removeAsset = useLibraryStore(s => s.removeAsset);
  const model = useModel(asset?.modelId);

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
      <View>
        <Image
          source={{ uri: asset.thumbnailUrl ?? asset.url }}
          style={[
            styles.media,
            { aspectRatio: aspectRatioValue(asset.aspectRatio) },
          ]}
        />
        {asset.type === 'video' ? (
          <View style={styles.play}>
            <Icon name="play" size={28} color={colors.white} />
          </View>
        ) : null}
      </View>
      {asset.type === 'video' ? (
        <Text style={typography.caption}>
          In-app playback arrives with react-native-video in Phase 5.
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
        title="Share"
        icon="share-outline"
        variant="secondary"
        onPress={() => Share.share({ message: asset.url, url: asset.url })}
      />
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
  play: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  meta: { gap: spacing.sm },
});
