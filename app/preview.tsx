import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import Toast from '@/components/Toast';
import { useFavorites } from '@/contexts/FavoritesContext';
import { setWallpaperPro } from '@/utils/wallpaperEngine';

import type { Wallpaper } from '@/mocks/wallpapers';

function getErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export default function PreviewScreen() {
  const { wallpaper: wallpaperParam } = useLocalSearchParams<{ wallpaper: string }>();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [isSettingWallpaper, setIsSettingWallpaper] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const wallpaper: Wallpaper | null = useMemo(() => {
    try {
      if (!wallpaperParam) return null;
      return JSON.parse(wallpaperParam);
    } catch {
      return null;
    }
  }, [wallpaperParam]);

  const isFav = wallpaper ? isFavorite(wallpaper.id) : false;

  const showToastMessage = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  }, []);

  const handleHideToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const handleFavoritePress = useCallback(() => {
    if (!wallpaper) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const action = toggleFavorite(wallpaper);

    if (action === 'added') showToastMessage('Saved to Favorites');
    if (action === 'removed') showToastMessage('Removed from Favorites');
  }, [wallpaper, toggleFavorite, showToastMessage]);

  useFocusEffect(
    useCallback(() => {
      return () => setIsSettingWallpaper(false);
    }, [])
  );

  const applyWallpaper = useCallback(async () => {
    if (!wallpaper) return;
    if (isSettingWallpaper) return;

    if (Platform.OS !== 'android') {
      Alert.alert('Android Only', 'This feature works only on Android.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSettingWallpaper(true);

    showToastMessage('Preparing wallpaper...');

    try {
      await setWallpaperPro(wallpaper.imageUrl, {
        wallpaperId: wallpaper.id,
      });

      showToastMessage('Choose Home / Lock / Both');

    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsSettingWallpaper(false);
    }
  }, [wallpaper, isSettingWallpaper, showToastMessage]);

  if (!wallpaper) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Wallpaper not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Image source={{ uri: wallpaper.imageUrl }} style={styles.image} />

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.favoriteButton} onPress={handleFavoritePress}>
          <Heart
            size={24}
            color={isFav ? Colors.favorite : Colors.text}
            fill={isFav ? Colors.favorite : 'transparent'}
          />
        </Pressable>

        <Pressable
          style={[styles.setWallpaperButton, isSettingWallpaper && styles.buttonDisabled]}
          onPress={applyWallpaper}
          disabled={isSettingWallpaper}
        >
          {isSettingWallpaper ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <Text style={styles.setWallpaperText}>SET WALLPAPER</Text>
          )}
        </Pressable>
      </View>

      <Toast message={toastMessage} visible={showToast} onHide={handleHideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  image: { flex: 1 },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 16,
  },
  favoriteButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setWallpaperButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  setWallpaperText: {
    color: Colors.background,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.textMuted,
  },
});
