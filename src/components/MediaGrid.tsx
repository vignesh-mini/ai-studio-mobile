import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { GeneratedAsset } from '../types';
import { aspectRatioValue } from '../utils';
import { Icon } from './Icon';

interface MediaTileProps {
  asset: GeneratedAsset;
  onPress?: () => void;
  selected?: boolean;
  square?: boolean;
}

export function MediaTile({
  asset,
  onPress,
  selected,
  square,
}: MediaTileProps) {
  const shape = {
    aspectRatio: square ? 1 : aspectRatioValue(asset.aspectRatio),
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="imagebutton"
      accessibilityLabel={asset.prompt}
      style={[styles.tile, selected && styles.selected]}
    >
      {asset.type === 'video' && !asset.thumbnailUrl ? (
        // Generated videos have no poster frame, and Image cannot decode an mp4.
        <View style={[styles.image, styles.videoPlaceholder, shape]}>
          <Icon name="film-outline" size={28} color={colors.textMuted} />
        </View>
      ) : (
        <Image
          source={{ uri: asset.thumbnailUrl ?? asset.url }}
          style={[styles.image, shape]}
        />
      )}
      {asset.type === 'video' ? (
        <View style={styles.videoBadge}>
          <Icon name="play" size={12} color={colors.white} />
          <Text style={styles.videoText}>{asset.durationSec}s</Text>
        </View>
      ) : null}
      {selected ? (
        <View style={styles.check}>
          <Icon name="checkmark-circle" size={22} color={colors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}

interface MediaGridProps {
  assets: GeneratedAsset[];
  onPress?: (asset: GeneratedAsset) => void;
  columns?: number;
}

/** Non-virtualized grid for use inside ScrollViews (results of a single generation, etc). */
export function MediaGrid({ assets, onPress, columns = 2 }: MediaGridProps) {
  return (
    <View style={styles.grid}>
      {assets.map(asset => (
        <View key={asset.id} style={{ width: `${100 / columns}%` }}>
          <View style={styles.cell}>
            <MediaTile
              asset={asset}
              square={columns > 1}
              onPress={onPress ? () => onPress(asset) : undefined}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -spacing.xs },
  cell: { padding: spacing.xs },
  tile: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.primary },
  image: { width: '100%' },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  videoBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  videoText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
});
