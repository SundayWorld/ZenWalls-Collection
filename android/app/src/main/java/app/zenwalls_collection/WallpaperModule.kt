
package app.zenwalls_collection

import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*

import java.io.File

class WallpaperModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WallpaperModule"

    @ReactMethod
    fun setWallpaper(path: String, type: String, promise: Promise) {
        try {
            Log.d("WallpaperModule", "RAW PATH: $path")

            // ✅ FIX: normalize file path safely
            val cleanPath = if (path.startsWith("file://")) {
                path.replace("file://", "")
            } else {
                path
            }

            Log.d("WallpaperModule", "CLEAN PATH: $cleanPath")

            val file = File(cleanPath)

            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "Wallpaper file not found")
                return
            }

            val options = BitmapFactory.Options().apply {
                inPreferredConfig = Bitmap.Config.ARGB_8888
            }

            val bitmap = BitmapFactory.decodeFile(file.absolutePath, options)

            if (bitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image")
                return
            }

            val wallpaperManager =
                WallpaperManager.getInstance(reactApplicationContext)

            when (type.uppercase()) {
                "HOME" -> {
                    wallpaperManager.setBitmap(
                        bitmap,
                        null,
                        true,
                        WallpaperManager.FLAG_SYSTEM
                    )
                }

                "LOCK" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        wallpaperManager.setBitmap(
                            bitmap,
                            null,
                            true,
                            WallpaperManager.FLAG_LOCK
                        )
                    } else {
                        promise.reject("UNSUPPORTED", "Lock screen not supported")
                        return
                    }
                }

                "BOTH" -> {
                    wallpaperManager.setBitmap(
                        bitmap,
                        null,
                        true,
                        WallpaperManager.FLAG_SYSTEM
                    )

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        wallpaperManager.setBitmap(
                            bitmap,
                            null,
                            true,
                            WallpaperManager.FLAG_LOCK
                        )
                    }
                }

                else -> {
                    promise.reject("INVALID_TYPE", "Invalid wallpaper type")
                    return
                }
            }

            bitmap.recycle()

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
            }

            promise.resolve(result)

        } catch (e: Exception) {
            Log.e("WallpaperModule", "ERROR", e)
            promise.reject("ERROR", e.message ?: "Unknown error")
        }
    }
}