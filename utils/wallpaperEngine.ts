/* utils/wallpaperEngine.ts */
import { Platform } from 'react-native';
import { setAndroidWallpaper, openAndroidWallpaperPicker } from '@/utils/wallpaperPicker';

type Which = 'home' | 'lock' | 'both';

// ✅ Build-safe: no analytics import
async function safeTrack(_event: string, _props: Record<string, any>) {
  // no-op
}

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
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
  if (Platform.OS !== 'android') throw new Error('Android only');
  if (!imageUrl) throw new Error('Invalid imageUrl');

  const t0 = Date.now();
  const base = {
    which,
    wallpaperId: meta?.wallpaperId ?? 'unknown',
    category: meta?.category ?? 'unknown',
    androidApi: Platform.Version,
  };

  await safeTrack('wallpaper_set_tap', base);

  // ✅ PRIMARY (Most reliable): MediaStore content:// + WallpaperManager.setStream (inside setAndroidWallpaper)
  try {
    await safeTrack('wallpaper_set_attempt', { ...base, method: 'stream' });

    await withTimeout(setAndroidWallpaper(imageUrl, which), 15000);

    await safeTrack('wallpaper_set_success', {
      ...base,
      method: 'stream',
      ms: Date.now() - t0,
    });
    return;
  } catch (e) {
    await safeTrack('wallpaper_set_fail', {
      ...base,
      method: 'stream',
      ms: Date.now() - t0,
      error: String(e),
    });
    // fallback below
  }

  // ✅ FINAL FALLBACK: intent chain (chooser / OEM dependent)
  try {
    await safeTrack('wallpaper_set_attempt', { ...base, method: 'intent' });

    await withTimeout(openAndroidWallpaperPicker(imageUrl, String(Date.now())), 15000);

    await safeTrack('wallpaper_set_success', {
      ...base,
      method: 'intent',
      ms: Date.now() - t0,
    });
    return;
  } catch (e) {
    await safeTrack('wallpaper_set_fail', {
      ...base,
      method: 'intent',
      ms: Date.now() - t0,
      error: String(e),
    });
  }

  await safeTrack('wallpaper_set_blocked', { ...base, ms: Date.now() - t0 });
  throw new Error('Device blocked all wallpaper methods');
}