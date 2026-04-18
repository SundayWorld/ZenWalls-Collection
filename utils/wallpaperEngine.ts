
import { NativeModules, Platform } from 'react-native';

export type WallpaperTarget = 'home' | 'lock' | 'both';

export interface WallpaperResult {
  success: boolean;
  message?: string;
}

const { WallpaperModule } = NativeModules;

export async function setWallpaper(
  imagePath: string,
  which: WallpaperTarget = 'both'
): Promise<WallpaperResult> {
  if (Platform.OS !== 'android') {
    return { success: false, message: 'Android only' };
  }

  if (!WallpaperModule) {
    return { success: false, message: 'WallpaperModule not available' };
  }

  try {
    console.log('SENDING TO NATIVE:', imagePath);

    const result = await WallpaperModule.setWallpaper(imagePath, which);

    return {
      success: result?.success ?? false,
      message: result?.message,
    };
  } catch (error) {
    console.error('Wallpaper Engine Error:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}