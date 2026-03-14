package app.zenwalls_collection;

import android.app.WallpaperManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

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

    @ReactMethod
    public void setWallpaperFromUrl(String imageUrl, String which, Promise promise) {

        new Thread(() -> {

            try {

                ReactApplicationContext ctx = getReactApplicationContext();
                WallpaperManager wm = WallpaperManager.getInstance(ctx);

                URL url = new URL(imageUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.connect();

                InputStream input = connection.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(input);

                if (bitmap == null) {
                    promise.reject("ERROR", "Bitmap decode failed");
                    return;
                }

                int flag = WallpaperManager.FLAG_SYSTEM;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {

                    if ("lock".equals(which)) {
                        flag = WallpaperManager.FLAG_LOCK;
                    }

                    if ("both".equals(which)) {
                        flag = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
                    }

                    wm.setBitmap(bitmap, null, true, flag);

                } else {

                    wm.setBitmap(bitmap);

                }

                promise.resolve(true);

            } catch (Exception e) {

                promise.reject("ERROR", e.getMessage());

            }

        }).start();

    }

    // REQUIRED by your JS code
    @ReactMethod
    public void setWallpaperFromContentUri(String uriString, String which, Promise promise) {

        new Thread(() -> {

            try {

                ReactApplicationContext ctx = getReactApplicationContext();
                WallpaperManager wm = WallpaperManager.getInstance(ctx);

                Uri uri = Uri.parse(uriString);
                InputStream input = ctx.getContentResolver().openInputStream(uri);

                Bitmap bitmap = BitmapFactory.decodeStream(input);

                if (bitmap == null) {
                    promise.reject("ERROR", "Bitmap decode failed");
                    return;
                }

                int flag = WallpaperManager.FLAG_SYSTEM;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {

                    if ("lock".equals(which)) {
                        flag = WallpaperManager.FLAG_LOCK;
                    }

                    if ("both".equals(which)) {
                        flag = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
                    }

                    wm.setBitmap(bitmap, null, true, flag);

                } else {

                    wm.setBitmap(bitmap);

                }

                promise.resolve(true);

            } catch (Exception e) {

                promise.reject("ERROR", e.getMessage());

            }

        }).start();

    }

}