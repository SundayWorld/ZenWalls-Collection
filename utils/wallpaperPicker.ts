// utils/wallpaperPicker.ts
import { Platform, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as IntentLauncher from 'expo-intent-launcher';

const FLAG_GRANT_READ_URI_PERMISSION = 1;
const FLAG_GRANT_WRITE_URI_PERMISSION = 2;

const MAX_W = 1440;
const MAX_H = 2560;

const EXTRA_STREAM = 'android.intent.extra.STREAM';

function clampSize(w: number, h: number) {
  const scale = Math.min(MAX_W / w, MAX_H / h, 1);
  return {
    width: Math.max(1, Math.floor(w * scale)),
    height: Math.max(1, Math.floor(h * scale)),
  };
}

function ensureTrailingSlash(dir: string) {
  return dir.endsWith('/') ? dir : dir + '/';
}

function pickWritableDir(): string | null {
  const dir =
    FileSystem.cacheDirectory ??
    FileSystem.documentDirectory ??
    // @ts-ignore (some Expo versions)
    (FileSystem as any).temporaryDirectory ??
    null;

  return dir ? ensureTrailingSlash(dir) : null;
}

async function safeDelete(uri?: string) {
  if (!uri) return;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

async function ensureExists(uri: string, label: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error(`${label} not found: ${uri}`);
}

async function start(action: string, opts: Parameters<typeof IntentLauncher.startActivityAsync>[1]) {
  return IntentLauncher.startActivityAsync(action, opts);
}

async function launch(action: string, contentUri: string, extra?: Record<string, any>) {
  return start(action, {
    data: contentUri,
    type: 'image/jpeg',
    flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_GRANT_WRITE_URI_PERMISSION,
    extra: extra ?? {},
  });
}

async function openWallpaperSettingsFallback() {
  return start('android.settings.WALLPAPER_SETTINGS', {});
}

export async function openAndroidWallpaperPicker(imageUrl: string, id: string): Promise<void> {
  if (Platform.OS !== 'android') throw new Error('Wallpaper setting is only supported on Android');

  let downloadedUri: string | undefined;
  let manipulatedUri: string | undefined;
  let finalJpegUri: string | undefined;

  try {
    console.log('[WallpaperPicker] Start', { imageUrl, id });

    // 0) Writable dir (fixes Infinix cacheDirectory null)
    const baseDir = pickWritableDir();
    if (!baseDir) throw new Error('No writable directory available (cache/document missing)');
    console.log('[WallpaperPicker] writableDir:', baseDir);

    // 1) Target size (screen) then clamp
    const { width, height } = Dimensions.get('screen');
    const target = clampSize(Math.floor(width), Math.floor(height));
    console.log('[WallpaperPicker] screen:', width, 'x', height, 'target:', target);

    // 2) Download with .jpg extension (OEM-friendly)
    const downloadPath = `${baseDir}zw_${id}_${Date.now()}_dl.jpg`;
    console.log('[WallpaperPicker] downloading ->', downloadPath);

    const downloadRes = await FileSystem.downloadAsync(imageUrl, downloadPath);
    downloadedUri = downloadRes.uri;
    await ensureExists(downloadedUri, 'Downloaded file');

    // 3) Manipulate (resize + jpeg)
    console.log('[WallpaperPicker] manipulating -> jpeg');
    const manipulated = await ImageManipulator.manipulateAsync(
      downloadedUri,
      [{ resize: { width: target.width, height: target.height } }],
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
    );
    manipulatedUri = manipulated.uri;
    await ensureExists(manipulatedUri, 'Manipulated JPEG');

    // 4) Copy to stable path (some OEMs prefer stable file)
    const finalPath = `${baseDir}zw_${id}_${Date.now()}_final.jpg`;
    await FileSystem.copyAsync({ from: manipulatedUri, to: finalPath });
    finalJpegUri = finalPath;
    await ensureExists(finalJpegUri, 'Final JPEG');

    // 5) content://
    const contentUri = await FileSystem.getContentUriAsync(finalJpegUri);
    console.log('[WallpaperPicker] contentUri:', contentUri);

    // ========= FALLBACK CHAIN (PRO) =========

    // A) SET_WALLPAPER (data)
    try {
      console.log('[WallpaperPicker] A: SET_WALLPAPER');
      await launch('android.intent.action.SET_WALLPAPER', contentUri);
      console.log('[WallpaperPicker] A OK');
      return;
    } catch (e) {
      console.log('[WallpaperPicker] A failed:', String(e));
    }

    // B) SET_WALLPAPER + EXTRA_STREAM
    try {
      console.log('[WallpaperPicker] B: SET_WALLPAPER + EXTRA_STREAM');
      await launch('android.intent.action.SET_WALLPAPER', contentUri, {
        [EXTRA_STREAM]: contentUri,
      });
      console.log('[WallpaperPicker] B OK');
      return;
    } catch (e) {
      console.log('[WallpaperPicker] B failed:', String(e));
    }

    // C) CROP_AND_SET_WALLPAPER (AOSP / some OEMs)
    try {
      console.log('[WallpaperPicker] C: CROP_AND_SET_WALLPAPER');
      await launch('com.android.wallpaper.CROP_AND_SET_WALLPAPER', contentUri);
      console.log('[WallpaperPicker] C OK');
      return;
    } catch (e) {
      console.log('[WallpaperPicker] C failed:', String(e));
    }

    // D) ATTACH_DATA (OEM fallback)
    try {
      console.log('[WallpaperPicker] D: ATTACH_DATA');
      await launch('android.intent.action.ATTACH_DATA', contentUri, {
        mimeType: 'image/jpeg',
      });
      console.log('[WallpaperPicker] D OK');
      return;
    } catch (e) {
      console.log('[WallpaperPicker] D failed:', String(e));
    }

    // E) VIEW (opens Gallery/Photos viewer → user selects Set as wallpaper)
    try {
      console.log('[WallpaperPicker] E: VIEW');
      await start('android.intent.action.VIEW', {
        data: contentUri,
        type: 'image/jpeg',
        flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_GRANT_WRITE_URI_PERMISSION,
      });
      console.log('[WallpaperPicker] E OK (viewer opened)');
      return;
    } catch (e) {
      console.log('[WallpaperPicker] E failed:', String(e));
    }

    // F) SEND (share chooser → Gallery/Wallpaper apps can set wallpaper)
    try {
      console.log('[WallpaperPicker] F: SEND (share chooser)');
      await start('android.intent.action.SEND', {
        type: 'image/jpeg',
        flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_GRANT_WRITE_URI_PERMISSION,
        extra: { [EXTRA_STREAM]: contentUri },
      });
      console.log('[WallpaperPicker] F OK (share opened)');
      return;
    } catch (e) {
      console.log('[WallpaperPicker] F failed:', String(e));
    }

    // G) System wallpaper settings (manual)
    try {
      console.log('[WallpaperPicker] G: WALLPAPER_SETTINGS');
      await openWallpaperSettingsFallback();
      console.log('[WallpaperPicker] G OK (settings opened)');
      return;
    } catch (e) {
      console.log('[WallpaperPicker] G failed:', String(e));
    }

    throw new Error('This device blocked all wallpaper methods.');
  } finally {
    setTimeout(() => {
      safeDelete(downloadedUri);
      safeDelete(manipulatedUri);
      safeDelete(finalJpegUri);
    }, 30000);
  }
}