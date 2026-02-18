import React, { useMemo } from 'react';
import { StyleSheet, View, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import WallpaperCard from '@/components/WallpaperCard';
import { getWallpapersByCollection } from '@/mocks/wallpapers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CollectionScreen() {
  const { collectionId, collectionName } = useLocalSearchParams<{
    collectionId: string;
    collectionName: string;
  }>();

  const wallpapers = useMemo(() => {
    if (!collectionId) return [];
    return getWallpapersByCollection(collectionId);
  }, [collectionId]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: collectionName || 'Collection',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <FlatList
        data={wallpapers}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <WallpaperCard wallpaper={item} />}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
});
