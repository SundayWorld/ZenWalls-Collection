// utils/wallpaperPicker.ts

import { Platform, NativeModules } from 'react-native';

type Which = 'home' | 'lock' | 'both';

function getZenWallpaperModule() {
  const mod = (NativeModules as any)?.ZenWallpaper;

  if (!mod) {
    throw new Error(
      'ZenWallpaper native module not found. Make sure the app was rebuilt.'
    );
  }

  return mod;
}

/**
 * Apply wallpaper using the native ZenWallpaper module.
 * Native side downloads the image and applies it using WallpaperManager.
 */

export async function setAndroidWallpaper(
  imageUrl: string,
  which: Which
): Promise<void> {

  if (Platform.OS !== 'android') {
    throw new Error('Wallpaper setting is only supported on Android.');
  }

  const mod = getZenWallpaperModule();

  if (!mod.setWallpaperFromUrl) {
    throw new Error(
      'ZenWallpaper.setWallpaperFromUrl missing. Native module needs rebuild.'
    );
  }

  try {

    console.log('[WallpaperPicker] Setting wallpaper:', {
      url: imageUrl,
      target: which,
    });

    await mod.setWallpaperFromUrl(imageUrl, which);

    console.log('[WallpaperPicker] Wallpaper applied successfully');

  } catch (error) {

    console.error('[WallpaperPicker] Failed to apply wallpaper:', error);

    throw error;
  }
}