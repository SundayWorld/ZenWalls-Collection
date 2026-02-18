import { Platform, Dimensions } from 'react-native';
import { File, Paths, getContentUriAsync } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as IntentLauncher from 'expo-intent-launcher';

export async function openAndroidWallpaperPicker(imageUrl: string, id: string): Promise<void> {
  if (Platform.OS !== 'android') {
    console.log('[WallpaperPicker] Not Android, skipping');
    throw new Error('Wallpaper setting is only supported on Android');
  }

  try {
    console.log('[WallpaperPicker] Starting wallpaper picker flow');
    console.log('[WallpaperPicker] Image URL:', imageUrl);
    console.log('[WallpaperPicker] Wallpaper ID:', id);

    const { width, height } = Dimensions.get('window');
    const targetWidth = Math.floor(width);
    const targetHeight = Math.floor(height);

    console.log('[WallpaperPicker] Target dimensions:', targetWidth, 'x', targetHeight);

    const cacheFileName = `wallpaper_${id}.jpg`;
    const cacheFile = new File(Paths.cache, cacheFileName);

    console.log('[WallpaperPicker] Downloading image...');
    const downloadedFile = await File.downloadFileAsync(imageUrl, cacheFile, { idempotent: true });
    console.log('[WallpaperPicker] Downloaded to:', downloadedFile.uri);

    console.log('[WallpaperPicker] Resizing and converting to JPEG...');
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      downloadedFile.uri,
      [{ resize: { width: targetWidth, height: targetHeight } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    console.log('[WallpaperPicker] Manipulated image URI:', manipulatedImage.uri);

    console.log('[WallpaperPicker] Getting content URI...');
    const contentUri = await getContentUriAsync(manipulatedImage.uri);
    console.log('[WallpaperPicker] Content URI:', contentUri);

    console.log('[WallpaperPicker] Launching wallpaper picker intent...');
    await IntentLauncher.startActivityAsync('android.intent.action.SET_WALLPAPER', {
      data: contentUri,
      type: 'image/jpeg',
      flags: 1,
    });

    console.log('[WallpaperPicker] Intent launched successfully');

    setTimeout(() => {
      try {
        const tempFile = new File(manipulatedImage.uri);
        if (tempFile.exists) {
          tempFile.delete();
          console.log('[WallpaperPicker] Cleaned up temp file');
        }
      } catch (cleanupError) {
        console.log('[WallpaperPicker] Cleanup error (non-critical):', cleanupError);
      }
    }, 60000);

  } catch (error) {
    console.error('[WallpaperPicker] Error:', error);
    console.error('[WallpaperPicker] Failed image URL:', imageUrl);
    console.error('[WallpaperPicker] Cache directory:', Paths.cache);
    throw error;
  }
}
