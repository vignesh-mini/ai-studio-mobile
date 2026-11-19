import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { MediaTile } from '../../components/MediaGrid';
import { OptionGroup, type Option } from '../../components/OptionGroup';
import { Screen } from '../../components/Screen';
import type { TabScreenProps } from '../../navigation/types';
import { useLibrarySync } from '../../hooks/useLibrarySync';
import { useLibraryStore } from '../../store/libraryStore';
import { spacing, typography } from '../../theme';
import type { AssetType } from '../../types';

type Filter = 'all' | AssetType;

const filters: Option<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images', icon: 'image-outline' },
  { value: 'video', label: 'Videos', icon: 'videocam-outline' },
];

export function LibraryScreen({ navigation }: TabScreenProps<'Library'>) {
  const assets = useLibraryStore(s => s.assets);
  const { refetch, isRefetching } = useLibrarySync();
  const [filter, setFilter] = useState<Filter>('all');
  const visible = useMemo(
    () => (filter === 'all' ? assets : assets.filter(a => a.type === filter)),
    [assets, filter],
  );

  return (
    <Screen>
      <FlatList
        data={visible}
        keyExtractor={a => a.id}
        numColumns={2}
        contentContainerStyle={styles.content}
        onRefresh={refetch}
        refreshing={isRefetching}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.h1}>Library</Text>
            <Text style={typography.muted}>
              {assets.length} generations, stored in the cloud.
            </Text>
            <OptionGroup
              label="Filter"
              options={filters}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="Nothing here yet"
            message="Images and videos you generate are saved here."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <MediaTile
              asset={item}
              square
              onPress={() =>
                navigation.navigate('AssetViewer', { assetId: item.id })
              }
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  row: { gap: spacing.sm },
  cell: { flex: 1, maxWidth: '50%' },
});
