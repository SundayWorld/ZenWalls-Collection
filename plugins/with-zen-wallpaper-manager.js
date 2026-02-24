// plugins/with-zen-wallpaper-manager.js
const fs = require("fs");
const path = require("path");
const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  AndroidConfig,
} = require("@expo/config-plugins");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readFileStrict(p, label) {
  if (!fs.existsSync(p)) {
    throw new Error(
      `[with-zen-wallpaper-manager] Missing ${label} at:\n${p}\n\n` +
        `✅ Fix:\n` +
        `1) Ensure folder "android-native" exists in project root\n` +
        `2) Ensure these files exist:\n` +
        `   - android-native/ZenWallpaperModule.java\n` +
        `   - android-native/ZenWallpaperPackage.java\n` +
        `3) Commit & push before EAS build\n`
    );
  }
  return fs.readFileSync(p, "utf8");
}

function writeFile(p, c) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, c);
}

function addSetWallpaperPermission(androidManifest) {
  AndroidConfig.Permissions.addPermission(
    androidManifest,
    "android.permission.SET_WALLPAPER"
  );
  return androidManifest;
}

function isKotlinFile(contents) {
  // Kotlin MainApplication usually contains: "class MainApplication : Application(), ReactApplication"
  // Java contains: "public class MainApplication extends Application implements ReactApplication"
  return (
    contents.includes("class MainApplication") ||
    contents.includes("override fun") ||
    contents.includes(": Application")
  );
}

function patchMainApplicationKotlin(contents, packageName) {
  const importLine = `import ${packageName}.ZenWallpaperPackage`;

  // 1) Ensure import exists (Kotlin imports must be at top)
  if (!contents.includes(importLine)) {
    // insert after the last existing import
    if (contents.match(/^import\s.+$/m)) {
      contents = contents.replace(
        /(^import\s.+$\n)(?![\s\S]*^import\s.+$\n)/m,
        (m) => m + importLine + "\n"
      );
    } else {
      // fallback: insert after package line
      contents = contents.replace(
        /^(package\s+[^\n]+\n)/,
        `$1\n${importLine}\n`
      );
    }
  }

  // 2) Add packages.add(ZenWallpaperPackage())
  // Look for: val packages = PackageList(this).packages
  if (!contents.includes("packages.add(ZenWallpaperPackage())")) {
    const re = /val\s+packages\s*=\s*PackageList\s*\(\s*this\s*\)\s*\.packages/;
    if (re.test(contents)) {
      contents = contents.replace(re, (m) => {
        return (
          m +
          "\n    // ZenWallpaper native module\n" +
          "    packages.add(ZenWallpaperPackage())"
        );
      });
    }
  }

  return contents;
}

function patchMainApplicationJava(contents, packageName) {
  // Java fallback (in case a project generates MainApplication.java)
  const importLine = `import ${packageName}.ZenWallpaperPackage;\n`;

  if (!contents.includes("ZenWallpaperPackage")) {
    if (contents.match(/^import .*;\s*$/m)) {
      contents = contents.replace(
        /(^import .*;\s*$)(?![\s\S]*^import .*;\s*$)/m,
        (m) => m + "\n" + importLine
      );
    } else {
      contents = importLine + contents;
    }
  }

  if (!contents.includes("packages.add(new ZenWallpaperPackage())")) {
    const re =
      /new\s+PackageList\s*\(\s*this\s*\)\s*\.getPackages\s*\(\s*\)\s*;/;
    if (re.test(contents)) {
      contents = contents.replace(re, (m) => {
        return (
          m +
          "\n    // ZenWallpaper native module\n" +
          "    packages.add(new ZenWallpaperPackage());"
        );
      });
    }
  }

  return contents;
}

module.exports = function withZenWallpaperManager(config) {
  // 1) AndroidManifest permission
  config = withAndroidManifest(config, (config) => {
    config.modResults = addSetWallpaperPermission(config.modResults);
    return config;
  });

  // 2) Copy native files into android/app/src/main/java/<packagePath>/
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;

      const pkg = config.android?.package;
      if (!pkg) {
        throw new Error(
          `[with-zen-wallpaper-manager] expo.android.package is missing in app.json`
        );
      }

      const androidDir = path.join(projectRoot, "android");
      const pkgPath = pkg.replace(/\./g, "/");
      const targetDir = path.join(
        androidDir,
        "app",
        "src",
        "main",
        "java",
        pkgPath
      );

      const srcModule = path.join(
        projectRoot,
        "android-native",
        "ZenWallpaperModule.java"
      );
      const srcPackage = path.join(
        projectRoot,
        "android-native",
        "ZenWallpaperPackage.java"
      );

      const moduleCode = readFileStrict(srcModule, "ZenWallpaperModule.java").replace(
        /__PACKAGE__/g,
        pkg
      );
      const packageCode = readFileStrict(srcPackage, "ZenWallpaperPackage.java").replace(
        /__PACKAGE__/g,
        pkg
      );

      writeFile(path.join(targetDir, "ZenWallpaperModule.java"), moduleCode);
      writeFile(path.join(targetDir, "ZenWallpaperPackage.java"), packageCode);

      return config;
    },
  ]);

  // 3) Patch MainApplication (Kotlin-first, Java fallback)
  config = withMainApplication(config, (config) => {
    const pkg = config.android?.package;
    if (!pkg) return config;

    const contents = config.modResults.contents;

    if (isKotlinFile(contents)) {
      config.modResults.contents = patchMainApplicationKotlin(contents, pkg);
    } else {
      config.modResults.contents = patchMainApplicationJava(contents, pkg);
    }

    return config;
  });

  return config;
};