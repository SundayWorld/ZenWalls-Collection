// utils/wallpaperEngine.ts

import { Platform } from 'react-native';
import { openAndroidWallpaperPicker } from '@/utils/wallpaperPicker';

async function safeTrack(_event: string, _props: Record<string, any>) {
  // no-op (future analytics)
}

function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);

    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function setWallpaperPro(
  imageUrl: string,
  meta?: { wallpaperId?: string }
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

    await withTimeout(
      openAndroidWallpaperPicker(imageUrl),
      15000
    );

    await safeTrack('wallpaper_success', base);

  } catch (error) {
    await safeTrack('wallpaper_fail', {
      ...base,
      error: String(error),
    });

    throw new Error('Could not open wallpaper settings');
  }
}