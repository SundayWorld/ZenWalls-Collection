// android-native/ZenWallpaperModule.java
package __PACKAGE__;

import android.app.WallpaperManager;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

public class ZenWallpaperModule extends ReactContextBaseJavaModule {

  // Match your JS safety clamps (keeps low-RAM phones stable)
  private static final int MAX_W = 1440;
  private static final int MAX_H = 2560;

  ZenWallpaperModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ZenWallpaper";
  }

  // Used by JS as a fallback when Expo dirs are null
  @ReactMethod
  public void getCacheDir(Promise promise) {
    try {
      File cache = getReactApplicationContext().getCacheDir();
      String path = "file://" + cache.getAbsolutePath() + "/";
      promise.resolve(path);
    } catch (Exception e) {
      promise.reject("CACHE_DIR_ERROR", e.getMessage(), e);
    }
  }

  // ✅ Zedge-grade intent launcher (ClipData + grantUriPermission for OEM wallpaper app)
  // JS should pass content:// uri returned by expo-file-system getContentUriAsync(...)
  @ReactMethod
  public void launchSetWallpaperIntent(String contentUriString, Promise promise) {
    try {
      ReactApplicationContext ctx = getReactApplicationContext();
      Uri uri = Uri.parse(contentUriString);

      Intent intent = new Intent(Intent.ACTION_SET_WALLPAPER);
      intent.setDataAndType(uri, "image/jpeg");
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      intent.putExtra(Intent.EXTRA_STREAM, uri);
      try {
        intent.setClipData(ClipData.newUri(ctx.getContentResolver(), "wallpaper", uri));
      } catch (Exception ignored) {}

      // Grant URI permission to any app that can handle this intent
      try {
        List<ResolveInfo> res = ctx.getPackageManager().queryIntentActivities(intent, 0);
        if (res != null) {
          for (ResolveInfo ri : res) {
            if (ri != null && ri.activityInfo != null && ri.activityInfo.packageName != null) {
              try {
                ctx.grantUriPermission(
                  ri.activityInfo.packageName,
                  uri,
                  Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                );
              } catch (Exception ignored2) {}
            }
          }
        }
      } catch (Exception ignored) {}

      if (intent.resolveActivity(ctx.getPackageManager()) == null) {
        throw new Exception("No activity found to handle SET_WALLPAPER");
      }

      ctx.startActivity(intent);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("INTENT_LAUNCH_ERROR", e.getMessage(), e);
    }
  }

  private File downloadToCache(String imageUrl) throws Exception {
    ReactApplicationContext ctx = getReactApplicationContext();
    File cacheDir = ctx.getCacheDir(); // ALWAYS exists on Android
    File outFile = new File(cacheDir, "zw_wallpaper_" + System.currentTimeMillis() + ".jpg");

    HttpURLConnection connection = null;
    try {
      URL url = new URL(imageUrl);
      connection = (HttpURLConnection) url.openConnection();
      connection.setConnectTimeout(15000);
      connection.setReadTimeout(30000);
      connection.setInstanceFollowRedirects(true);
      connection.connect();

      int code = connection.getResponseCode();
      if (code < 200 || code >= 300) throw new Exception("Download failed HTTP " + code);

      try (InputStream in = connection.getInputStream();
           FileOutputStream out = new FileOutputStream(outFile)) {

        byte[] buffer = new byte[8192];
        int len;
        while ((len = in.read(buffer)) != -1) out.write(buffer, 0, len);
        out.flush();
      }

      return outFile;
    } finally {
      if (connection != null) {
        try { connection.disconnect(); } catch (Exception ignored) {}
      }
    }
  }

  private static int calculateInSampleSize(BitmapFactory.Options options, int reqWidth, int reqHeight) {
    final int height = options.outHeight;
    final int width = options.outWidth;
    int inSampleSize = 1;

    if (height > reqHeight || width > reqWidth) {
      int halfHeight = height / 2;
      int halfWidth = width / 2;

      while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
        inSampleSize *= 2;
      }
    }
    return Math.max(1, inSampleSize);
  }

  // Downscale to a stable size, then re-encode as JPEG (keeps OEM wallpaper pickers happy)
  private File makeScaledJpeg(File input) throws Exception {
    ReactApplicationContext ctx = getReactApplicationContext();
    String path = input.getAbsolutePath();

    BitmapFactory.Options bounds = new BitmapFactory.Options();
    bounds.inJustDecodeBounds = true;
    BitmapFactory.decodeFile(path, bounds);

    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
      // If bounds fail, just use original
      return input;
    }

    BitmapFactory.Options opts = new BitmapFactory.Options();
    opts.inSampleSize = calculateInSampleSize(bounds, MAX_W, MAX_H);
    opts.inPreferredConfig = Bitmap.Config.ARGB_8888;

    Bitmap bmp = null;
    File outFile = null;

    try {
      bmp = BitmapFactory.decodeFile(path, opts);
      if (bmp == null) return input;

      outFile = new File(ctx.getCacheDir(), "zw_scaled_" + System.currentTimeMillis() + ".jpg");
      try (FileOutputStream out = new FileOutputStream(outFile)) {
        // 92% matches your JS
        boolean ok = bmp.compress(Bitmap.CompressFormat.JPEG, 92, out);
        out.flush();
        if (!ok) throw new Exception("JPEG compress failed");
      }

      return outFile;
    } catch (OutOfMemoryError oom) {
      // If we run out of memory while decoding, fall back to original file stream
      return input;
    } finally {
      try {
        if (bmp != null) bmp.recycle();
      } catch (Exception ignored) {}
    }
  }

  // ✅ Most reliable: WallpaperManager.setStream (Infinix/Tecno/Redmi friendly)
  @ReactMethod
  public void setWallpaperFromUrl(String imageUrl, String which, Promise promise) {
    File downloaded = null;
    File scaled = null;

    try {
      ReactApplicationContext ctx = getReactApplicationContext();
      WallpaperManager wm = WallpaperManager.getInstance(ctx);

      downloaded = downloadToCache(imageUrl);

      // Try to create a scaled JPEG first (more stable across devices)
      try {
        scaled = makeScaledJpeg(downloaded);
      } catch (Exception ignored) {
        scaled = downloaded;
      }

      int flags = WallpaperManager.FLAG_SYSTEM;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        if ("lock".equals(which)) flags = WallpaperManager.FLAG_LOCK;
        else if ("both".equals(which)) flags = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
        else flags = WallpaperManager.FLAG_SYSTEM;
      }

      try (InputStream in = new FileInputStream(scaled)) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          wm.setStream(in, null, true, flags);
        } else {
          wm.setStream(in);
        }
      }

      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("WALLPAPER_ERROR", e.getMessage(), e);
    } finally {
      // cleanup (best-effort)
      try {
        if (scaled != null && downloaded != null && !scaled.getAbsolutePath().equals(downloaded.getAbsolutePath())) {
          try { scaled.delete(); } catch (Exception ignored) {}
        }
      } catch (Exception ignored) {}

      try { if (downloaded != null) downloaded.delete(); } catch (Exception ignored) {}
    }
  }
}