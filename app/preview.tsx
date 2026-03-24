import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export async function openAndroidWallpaperPicker(imageUrl: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('Android only');
  }

  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('Invalid image URL');
  }

  try {
    console.log('[WallpaperPicker] Start');

    // 1. Download image
    const fileUri = FileSystem.cacheDirectory + `wallpaper_${Date.now()}.jpg`;

    const download = await FileSystem.downloadAsync(imageUrl, fileUri);

    if (!download?.uri) {
      throw new Error('Download failed');
    }

    console.log('[WallpaperPicker] Downloaded:', download.uri);

    // 2. Convert to JPG (important for Android compatibility)
    const manipulated = await ImageManipulator.manipulateAsync(
      download.uri,
      [{ resize: { width: 1080 } }],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    if (!manipulated?.uri) {
      throw new Error('Image processing failed');
    }

    console.log('[WallpaperPicker] Processed:', manipulated.uri);

    // 3. Correct Android intent (THIS IS THE KEY FIX)
    await IntentLauncher.startActivityAsync(
      'android.intent.action.ATTACH_DATA',
      {
        type: 'image/jpeg',
        flags: 3,
        extra: {
          'android.intent.extra.STREAM': manipulated.uri,
          mimeType: 'image/jpeg',
        },
      }
    );

    console.log('[WallpaperPicker] Wallpaper chooser opened');

  } catch (error) {
    console.error('[WallpaperPicker] Error:', error);

    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to open wallpaper picker'
    );
  }
}
