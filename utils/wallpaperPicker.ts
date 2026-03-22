import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';

export async function openAndroidWallpaperPicker(imageUrl: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('Android only');
  }

  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('Invalid image URL');
  }

  try {
    console.log('[WallpaperPicker] Start');

    // ✅ Step 1: Create unique file path
    const fileName = `wallpaper_${Date.now()}.jpg`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    // ✅ Step 2: Download image
    const download = await FileSystem.downloadAsync(imageUrl, fileUri);

    if (!download?.uri) {
      throw new Error('Download failed');
    }

    console.log('[WallpaperPicker] Downloaded:', download.uri);

    // ✅ Step 3: Open Android wallpaper chooser
    await IntentLauncher.startActivityAsync(
      'android.intent.action.ATTACH_DATA',
      {
        data: download.uri,
        type: 'image/*',
        flags: 1, // read permission
      }
    );

    console.log('[WallpaperPicker] Success');

  } catch (error) {
    console.error('[WallpaperPicker] Error:', error);

    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to open wallpaper picker'
    );
  }
}