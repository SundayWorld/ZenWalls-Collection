/* utils/wallpaperEngine.ts */

import { Platform } from 'react-native';
import { setAndroidWallpaper } from '@/utils/wallpaperPicker';

type Which = 'home' | 'lock' | 'both';

// Build-safe placeholder
async function safeTrack(_event: string, _props: Record<string, any>) {
  // no analytics
}

function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Wallpaper engine timeout')), ms);

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
  which: Which,
  meta?: { wallpaperId?: string; category?: string }
): Promise<void> {

  if (Platform.OS !== 'android') {
    throw new Error('Android only');
  }

  if (!imageUrl) {
    throw new Error('Invalid imageUrl');
  }

  const t0 = Date.now();

  const base = {
    which,
    wallpaperId: meta?.wallpaperId ?? 'unknown',
    category: meta?.category ?? 'unknown',
    androidApi: Platform.Version,
  };

  await safeTrack('wallpaper_set_tap', base);

  try {

    await safeTrack('wallpaper_set_attempt', {
      ...base,
      method: 'native',
    });

    // Direct native engine
    await withTimeout(setAndroidWallpaper(imageUrl, which), 15000);

    await safeTrack('wallpaper_set_success', {
      ...base,
      method: 'native',
      ms: Date.now() - t0,
    });

    return;

  } catch (e) {

    await safeTrack('wallpaper_set_fail', {
      ...base,
      method: 'native',
      ms: Date.now() - t0,
      error: String(e),
    });

    throw new Error(`Wallpaper failed: ${String(e)}`);
  }
}