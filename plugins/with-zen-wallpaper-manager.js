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
        `1) Make sure the folder "android-native" exists in your project root\n` +
        `2) Ensure these files exist:\n` +
        `   - android-native/ZenWallpaperModule.java\n` +
        `   - android-native/ZenWallpaperPackage.java\n` +
        `3) Make sure the folder is NOT ignored by git (.gitignore)\n` +
        `4) Commit & push before EAS build\n`
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

function isKotlinMainApplication(contents) {
  return (
    contents.includes("class MainApplication") &&
    (contents.includes("override fun") ||
      contents.includes("PackageList(this).packages") ||
      contents.includes("packages = PackageList(this).packages"))
  );
}

function addImportJava(contents, packageName) {
  const importLine = `import ${packageName}.ZenWallpaperPackage;\n`;
  if (contents.includes(importLine) || contents.includes("ZenWallpaperPackage")) return contents;

  const importRegex = /^import .*;\s*$/gm;
  let lastMatch = null;
  let match;
  while ((match = importRegex.exec(contents)) !== null) lastMatch = match;

  if (lastMatch) {
    const idx = lastMatch.index + lastMatch[0].length;
    return contents.slice(0, idx) + "\n" + importLine + contents.slice(idx);
  }

  return importLine + contents;
}

function addImportKotlin(contents, packageName) {
  const importLine = `import ${packageName}.ZenWallpaperPackage\n`;
  if (contents.includes(importLine) || contents.includes("ZenWallpaperPackage")) return contents;

  return contents.replace(/^(package\s+[^\n]+\n)/m, (m) => m + importLine);
}

function patchJavaMainApplication(contents, packageName) {
  contents = addImportJava(contents, packageName);

  if (!contents.includes("packages.add(new ZenWallpaperPackage())")) {
    const lineRegex =
      /List<ReactPackage>\s+packages\s*=\s*new\s+PackageList\s*\(\s*this\s*\)\s*\.getPackages\s*\(\s*\)\s*;\s*/;

    if (lineRegex.test(contents)) {
      contents = contents.replace(lineRegex, (m) => {
        return (
          m +
          "\n    // ZenWallpaper native module\n" +
          "    packages.add(new ZenWallpaperPackage());\n"
        );
      });
    } else {
      const marker = /new\s+PackageList\s*\(\s*this\s*\)\s*\.getPackages\s*\(\s*\)\s*;/;
      if (marker.test(contents)) {
        contents = contents.replace(marker, (m) => {
          return (
            m +
            "\n    // ZenWallpaper native module\n" +
            "    packages.add(new ZenWallpaperPackage());"
          );
        });
      }
    }
  }

  return contents;
}

function patchKotlinMainApplication(contents, packageName) {
  contents = addImportKotlin(contents, packageName);

  if (!contents.includes("packages.add(ZenWallpaperPackage())")) {
    const lineRegex = /(\s*val\s+packages\s*=\s*PackageList\(this\)\.packages\s*\n)/;

    if (lineRegex.test(contents)) {
      contents = contents.replace(lineRegex, (m) => {
        return (
          m +
          "    // ZenWallpaper native module\n" +
          "    packages.add(ZenWallpaperPackage())\n"
        );
      });
    } else {
      const marker = /PackageList\(this\)\.packages/;
      if (marker.test(contents)) {
        contents = contents.replace(marker, (m) => {
          return (
            m +
            "\n    // ZenWallpaper native module\n" +
            "    packages.add(ZenWallpaperPackage())"
          );
        });
      }
    }
  }

  return contents;
}

function patchMainApplication(contents, packageName) {
  if (isKotlinMainApplication(contents)) return patchKotlinMainApplication(contents, packageName);
  return patchJavaMainApplication(contents, packageName);
}

module.exports = function withZenWallpaperManager(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addSetWallpaperPermission(config.modResults);
    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;

      const pkg = config.android?.package;
      if (!pkg) {
        throw new Error(`[with-zen-wallpaper-manager] expo.android.package is missing in app.json`);
      }

      const androidDir = path.join(projectRoot, "android");
      const pkgPath = pkg.replace(/\./g, "/");
      const targetDir = path.join(androidDir, "app", "src", "main", "java", pkgPath);

      const srcModule = path.join(projectRoot, "android-native", "ZenWallpaperModule.java");
      const srcPackage = path.join(projectRoot, "android-native", "ZenWallpaperPackage.java");

      const moduleCode = readFileStrict(srcModule, "ZenWallpaperModule.java").replace(/__PACKAGE__/g, pkg);
      const packageCode = readFileStrict(srcPackage, "ZenWallpaperPackage.java").replace(/__PACKAGE__/g, pkg);

      writeFile(path.join(targetDir, "ZenWallpaperModule.java"), moduleCode);
      writeFile(path.join(targetDir, "ZenWallpaperPackage.java"), packageCode);

      return config;
    },
  ]);

  config = withMainApplication(config, (config) => {
    const pkg = config.android?.package;
    if (!pkg) return config;

    config.modResults.contents = patchMainApplication(config.modResults.contents, pkg);
    return config;
  });

  return config;
};