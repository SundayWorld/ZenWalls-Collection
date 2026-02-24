// utils/wallpaperEngine.ts
import { NativeModules, Platform } from 'react-native';
import { openAndroidWallpaperPicker } from '@/utils/wallpaperPicker';

type Which = 'home' | 'lock' | 'both';

const { ZenWallpaper } = NativeModules;

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
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

// ✅ Build-safe: no analytics import (prevents "Unable to resolve ./analytics")
async function safeTrack(_event: string, _props: Record<string, any>) {
  // no-op (kept async so existing awaits remain valid)
}

async function tryNative(imageUrl: string, which: Which, base: Record<string, any>, t0: number) {
  if (ZenWallpaper && typeof ZenWallpaper.setWallpaperFromUrl === 'function') {
    try {
      await safeTrack('wallpaper_set_attempt', { ...base, method: 'native' });

      await withTimeout(ZenWallpaper.setWallpaperFromUrl(imageUrl, which), 10000);

      await safeTrack('wallpaper_set_success', {
        ...base,
        method: 'native',
        ms: Date.now() - t0,
      });
      return true;
    } catch (e) {
      await safeTrack('wallpaper_set_fail', {
        ...base,
        method: 'native',
        ms: Date.now() - t0,
        error: String(e),
      });
      return false;
    }
  }

  await safeTrack('wallpaper_set_native_missing', base);
  return false;
}

async function tryIntent(imageUrl: string, base: Record<string, any>, t0: number) {
  try {
    await safeTrack('wallpaper_set_attempt', { ...base, method: 'intent' });

    // Intent method opens system UI on most devices (chooser like Home/Lock/Both)
    await openAndroidWallpaperPicker(imageUrl, String(Date.now()));

    await safeTrack('wallpaper_set_success', {
      ...base,
      method: 'intent',
      ms: Date.now() - t0,
    });
    return true;
  } catch (e) {
    await safeTrack('wallpaper_set_fail', {
      ...base,
      method: 'intent',
      ms: Date.now() - t0,
      error: String(e),
    });
    return false;
  }
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

  // ✅ If user chose "both", prefer Intent FIRST so Android shows chooser UI
  if (which === 'both') {
    const okIntent = await tryIntent(imageUrl, base, t0);
    if (okIntent) return;

    const okNative = await tryNative(imageUrl, which, base, t0);
    if (okNative) return;

    await safeTrack('wallpaper_set_blocked', { ...base, ms: Date.now() - t0 });
    throw new Error('Device blocked both intent and native wallpaper methods');
  }

  // For 'home' or 'lock': native first (best), then intent fallback
  const okNative = await tryNative(imageUrl, which, base, t0);
  if (okNative) return;

  const okIntent = await tryIntent(imageUrl, base, t0);
  if (okIntent) return;

  await safeTrack('wallpaper_set_blocked', { ...base, ms: Date.now() - t0 });
  throw new Error('Device blocked both native and intent wallpaper methods');
}