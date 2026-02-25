// app/preview.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import Toast from '@/components/Toast';
import { useFavorites } from '@/contexts/FavoritesContext';

// ✅ NEW: use the MediaStore + setStream path
import { setAndroidWallpaper } from '@/utils/wallpaperPicker';

import type { Wallpaper } from '@/mocks/wallpapers';

type Which = 'home' | 'lock' | 'both';

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
    } catch (error) {
      console.error('[Preview] Error parsing wallpaper:', error);
      return null;
    }
  }, [wallpaperParam]);

  const isFav = wallpaper ? isFavorite(wallpaper.id) : false;

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
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

  // Safety: if user leaves screen while spinner is active, reset it.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsSettingWallpaper(false);
      };
    }, [])
  );

  const applyWallpaper = useCallback(
    async (which: Which) => {
      if (!wallpaper) return;

      // Block spam taps
      if (isSettingWallpaper) return;

      if (Platform.OS !== 'android') {
        Alert.alert('Android Only', 'Setting wallpaper is only supported on Android devices.', [{ text: 'OK' }]);
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSettingWallpaper(true);

      showToastMessage('Applying wallpaper…');

      try {
        console.log('[Preview] Applying wallpaper:', { id: wallpaper.id, which });

        // ✅ Most reliable path (MediaStore content:// -> WallpaperManager.setStream)
        await setAndroidWallpaper(wallpaper.imageUrl, which);

        showToastMessage('Wallpaper applied');
      } catch (error) {
        const msg = getErrorMessage(error);
        console.error('[Preview] Error setting wallpaper:', msg);

        Alert.alert("Couldn't set wallpaper", `Device error: ${msg}\n\nTry another wallpaper or try again.`, [
          { text: 'OK' },
        ]);
      } finally {
        setIsSettingWallpaper(false);
      }
    },
    [wallpaper, isSettingWallpaper, showToastMessage]
  );

  const handleSetWallpaperPress = useCallback(() => {
    if (!wallpaper) return;

    if (Platform.OS !== 'android') {
      Alert.alert('Android Only', 'Setting wallpaper is only supported on Android devices.', [{ text: 'OK' }]);
      return;
    }

    // Don’t open the chooser if already busy
    if (isSettingWallpaper) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Set Wallpaper',
      'Choose where to apply this wallpaper:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Home screen', onPress: () => applyWallpaper('home') },
        { text: 'Lock screen', onPress: () => applyWallpaper('lock') },
        { text: 'Both (recommended)', onPress: () => applyWallpaper('both') },
      ],
      { cancelable: true }
    );
  }, [wallpaper, isSettingWallpaper, applyWallpaper]);

  if (!wallpaper) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Wallpaper not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: Colors.text,
          headerStyle: { backgroundColor: 'transparent' },
        }}
      />

      <Image source={{ uri: wallpaper.imageUrl }} style={styles.image} contentFit="cover" transition={300} />

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.favoriteButton} onPress={handleFavoritePress} testID="preview-favorite-button">
          <Heart size={24} color={isFav ? Colors.favorite : Colors.text} fill={isFav ? Colors.favorite : 'transparent'} />
        </Pressable>

        <Pressable
          style={[styles.setWallpaperButton, isSettingWallpaper && styles.buttonDisabled]}
          onPress={handleSetWallpaperPress}
          disabled={isSettingWallpaper}
          testID="set-wallpaper-button"
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
  image: { flex: 1, width: '100%' },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  errorContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.textMuted, fontSize: 16 },
});
