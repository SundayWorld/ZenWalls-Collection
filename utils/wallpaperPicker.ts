// utils/wallpaperPicker.ts

import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

export async function openAndroidWallpaperPicker(imageUrl: string) {
  if (Platform.OS !== 'android') {
    throw new Error('Android only');
  }

  if (!imageUrl) {
    throw new Error('Invalid image URL');
  }

  try {
    console.log('[WallpaperPicker] Opening Android wallpaper picker');

    await IntentLauncher.startActivityAsync(
      'android.intent.action.SET_WALLPAPER',
      {
        data: imageUrl,
        flags: 1,
      }
    );

  } catch (error) {
    console.error('[WallpaperPicker] Failed:', error);
    throw new Error('Failed to open wallpaper picker');
  }
}