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

    // ✅ Step 1: Create file path
    const fileName = `wallpaper_${Date.now()}.jpg`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    // ✅ Step 2: Download image
    const download = await FileSystem.downloadAsync(imageUrl, fileUri);

    if (!download?.uri) {
      throw new Error('Download failed');
    }

    console.log('[WallpaperPicker] Downloaded:', download.uri);

    // ✅ Step 3: Resize + Convert to JPG
    const manipulated = await ImageManipulator.manipulateAsync(
      download.uri,
      [
        {
          resize: {
            width: 1080,
          },
        },
      ],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    if (!manipulated?.uri) {
      throw new Error('Image processing failed');
    }

    console.log('[WallpaperPicker] Processed:', manipulated.uri);

    // ✅ Step 4: FIXED ATTACH_DATA (CRITICAL)
    try {
      await IntentLauncher.startActivityAsync(
        'android.intent.action.ATTACH_DATA',
        {
          data: manipulated.uri,
          type: 'image/jpeg',
          flags: 3,
          extra: {
            mimeType: 'image/jpeg',
            'android.intent.extra.STREAM': manipulated.uri,
          },
        }
      );

      console.log('[WallpaperPicker] ATTACH_DATA success');
      return;
    } catch (err) {
      console.warn('[WallpaperPicker] ATTACH_DATA failed → fallback');
    }

    // ✅ Fallback (still useful)
    try {
      await IntentLauncher.startActivityAsync(
        'android.intent.action.SET_WALLPAPER'
      );

      console.log('[WallpaperPicker] SET_WALLPAPER fallback success');
      return;
    } catch (err) {
      console.warn('[WallpaperPicker] SET_WALLPAPER failed');
    }

    // ❌ Final failure
    throw new Error('No available wallpaper method worked');

  } catch (error) {
    console.error('[WallpaperPicker] Error:', error);

    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to open wallpaper picker'
    );
  }
}