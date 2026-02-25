// utils/wallpaperPicker.ts
import { Platform, NativeModules } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

const FLAG_GRANT_READ_URI_PERMISSION = 1;
const FLAG_GRANT_WRITE_URI_PERMISSION = 2;

type Which = 'home' | 'lock' | 'both';

function getZenWallpaperModule() {
  const mod = (NativeModules as any)?.ZenWallpaper;
  if (!mod) throw new Error('ZenWallpaper native module not found (plugin not applied / rebuild needed).');
  return mod;
}

async function start(action: string, opts: Parameters<typeof IntentLauncher.startActivityAsync>[1]) {
  return IntentLauncher.startActivityAsync(action, opts);
}

// Intent fallback (if user wants system picker)
async function launchIntentSetWallpaper(contentUri: string) {
  return start('android.intent.action.SET_WALLPAPER', {
    data: contentUri,
    type: 'image/jpeg',
    flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_GRANT_WRITE_URI_PERMISSION,
    extra: { 'android.intent.extra.STREAM': contentUri },
  });
}

/**
 * ✅ Best reliability:
 * - Native downloads + downsamples + writes to MediaStore -> content://
 * - Then sets wallpaper via WallpaperManager.setStream
 *
 * This avoids OEM blocks seen on XOS/Infinix.
 */
export async function setAndroidWallpaper(
  imageUrl: string,
  which: Which
): Promise<void> {
  if (Platform.OS !== 'android') throw new Error('Wallpaper setting is only supported on Android');

  const mod = getZenWallpaperModule();

  // 1) Make MediaStore content:// uri
  if (!mod.prepareWallpaperContentUri) {
    throw new Error('ZenWallpaper.prepareWallpaperContentUri missing (update native file & rebuild).');
  }

  const contentUri: string = await mod.prepareWallpaperContentUri(imageUrl);
  if (!contentUri) throw new Error('Failed to prepare MediaStore content uri');

  // 2) Set wallpaper directly (no system dialog)
  if (!mod.setWallpaperFromContentUri) {
    throw new Error('ZenWallpaper.setWallpaperFromContentUri missing (update native file & rebuild).');
  }

  try {
    await mod.setWallpaperFromContentUri(contentUri, which);
    return;
  } catch (e) {
    // 3) Fallback: try opening system wallpaper picker
    try {
      await launchIntentSetWallpaper(contentUri);
      return;
    } catch {
      throw e;
    }
  }
}