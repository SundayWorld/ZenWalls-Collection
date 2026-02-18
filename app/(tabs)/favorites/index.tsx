import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { Heart, Compass } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import WallpaperCard from '@/components/WallpaperCard';
import Toast from '@/components/Toast';
import { useFavorites } from '@/contexts/FavoritesContext';

export default function FavoritesScreen() {
  const { favorites, isLoading, lastAction, clearLastAction } = useFavorites();
  const router = useRouter();

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleExplorePress = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // no-op
    }
    router.push('/(tabs)/(home)');
  }, [router]);

  const handleHideToast = useCallback(() => {
    setShowToast(false);
    clearLastAction();
  }, [clearLastAction]);

  useEffect(() => {
    if (lastAction === 'removed') {
      setToastMessage('Removed from Favorites');
      setShowToast(true);
    }
  }, [lastAction]);

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Heart size={48} color={Colors.textSecondary} />
        </View>

        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptySubtitle}>
          Save wallpapers you love to find them quickly.
        </Text>

        <Pressable
          style={styles.exploreButton}
          onPress={handleExplorePress}
          testID="explore-button"
        >
          <Compass size={18} color={Colors.background} style={styles.exploreIcon} />
          <Text style={styles.exploreButtonText}>Explore Wallpapers</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <WallpaperCard wallpaper={item} />}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />

      <Toast message={toastMessage} visible={showToast} onHide={handleHideToast} />
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
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.text,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
  },
  exploreIcon: {
    marginRight: 8,
  },
  exploreButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});



