// android-native/ZenWallpaperModule.java
package __PACKAGE__;

import android.app.WallpaperManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class ZenWallpaperModule extends ReactContextBaseJavaModule {
  ZenWallpaperModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ZenWallpaper";
  }

  private File downloadToCache(String imageUrl) throws Exception {
    ReactApplicationContext ctx = getReactApplicationContext();
    File cacheDir = ctx.getCacheDir(); // ALWAYS exists on Android
    File outFile = new File(cacheDir, "zw_wallpaper_" + System.currentTimeMillis() + ".jpg");

    URL url = new URL(imageUrl);
    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
    connection.setConnectTimeout(15000);
    connection.setReadTimeout(20000);
    connection.setInstanceFollowRedirects(true);
    connection.connect();

    int code = connection.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Exception("Download failed HTTP " + code);
    }

    InputStream in = connection.getInputStream();
    FileOutputStream out = new FileOutputStream(outFile);

    byte[] buffer = new byte[8192];
    int len;
    while ((len = in.read(buffer)) != -1) {
      out.write(buffer, 0, len);
    }

    out.flush();
    out.close();
    in.close();
    connection.disconnect();

    return outFile;
  }

  private Bitmap decodeBitmap(File file) throws Exception {
    Bitmap bmp = BitmapFactory.decodeFile(file.getAbsolutePath());
    if (bmp == null) throw new Exception("Bitmap decode failed");
    return bmp;
  }

  @ReactMethod
  public void setWallpaperFromUrl(String imageUrl, String which, Promise promise) {
    try {
      ReactApplicationContext ctx = getReactApplicationContext();
      WallpaperManager wm = WallpaperManager.getInstance(ctx);

      File f = downloadToCache(imageUrl);
      Bitmap bmp = decodeBitmap(f);

      // which: "home" | "lock" | "both"
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        int flags;
        if ("lock".equals(which)) flags = WallpaperManager.FLAG_LOCK;
        else if ("both".equals(which)) flags = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
        else flags = WallpaperManager.FLAG_SYSTEM;

        wm.setBitmap(bmp, null, true, flags);
      } else {
        // pre-Android 7: only home screen
        wm.setBitmap(bmp);
      }

      // best-effort cleanup
      try { f.delete(); } catch (Exception ignored) {}

      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("WALLPAPER_ERROR", e.getMessage(), e);
    }
  }
}