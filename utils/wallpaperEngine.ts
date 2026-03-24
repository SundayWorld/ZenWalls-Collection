import { Platform } from 'react-native';
import { openAndroidWallpaperPicker } from '@/utils/wallpaperPicker';

type Meta = {
  wallpaperId?: string;
};

// Safe placeholder (no analytics)
async function safeTrack(_event: string, _props: Record<string, any>) {}

export async function setWallpaperPro(
  imageUrl: string,
  meta?: Meta
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('Android only');
  }

  if (!imageUrl) {
    throw new Error('Invalid imageUrl');
  }

  const base = {
    wallpaperId: meta?.wallpaperId ?? 'unknown',
    androidApi: Platform.Version,
  };

  await safeTrack('wallpaper_tap', base);

  try {
    await safeTrack('wallpaper_attempt', base);

    // ✅ FINAL CALL (NO TIMEOUT)
    await openAndroidWallpaperPicker(imageUrl);

    await safeTrack('wallpaper_success', base);

  } catch (error) {
    await safeTrack('wallpaper_fail', {
      ...base,
      error: String(error),
    });

    throw new Error(
      error instanceof Error
        ? error.message
        : 'Could not open wallpaper settings'
    );
  }
}