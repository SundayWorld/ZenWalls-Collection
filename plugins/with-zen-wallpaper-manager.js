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

function readFile(p) {
  return fs.readFileSync(p, "utf8");
}

function writeFile(p, c) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, c);
}

function addSetWallpaperPermission(androidManifest) {
  const manifest = androidManifest.manifest;
  AndroidConfig.Permissions.addPermission(
    androidManifest,
    "android.permission.SET_WALLPAPER"
  );
  return androidManifest;
}

function patchMainApplication(contents, packageName) {
  // Add import
  if (!contents.includes("ZenWallpaperPackage")) {
    contents = contents.replace(
      /import\s+java\.util\.List;\s*\n/,
      (m) =>
        m +
        `import ${packageName}.ZenWallpaperPackage;\n`
    );
  }

  // Add package to getPackages()
  // Typical Expo MainApplication has:
  // List<ReactPackage> packages = new PackageList(this).getPackages();
  // return packages;
  const marker = "new PackageList(this).getPackages()";
  if (contents.includes(marker) && !contents.includes("new ZenWallpaperPackage()")) {
    contents = contents.replace(
      /List<ReactPackage>\s+packages\s*=\s*new PackageList\(this\)\.getPackages\(\);\s*\n/,
      (m) => m + "    packages.add(new ZenWallpaperPackage());\n"
    );
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
      const androidDir = path.join(projectRoot, "android");
      const pkg = config.android?.package;
      if (!pkg) {
        throw new Error("expo.android.package is missing in app.json");
      }

      const pkgPath = pkg.replace(/\./g, "/");
      const targetDir = path.join(
        androidDir,
        "app",
        "src",
        "main",
        "java",
        pkgPath
      );

      const srcModule = path.join(projectRoot, "android-native", "ZenWallpaperModule.java");
      const srcPackage = path.join(projectRoot, "android-native", "ZenWallpaperPackage.java");

      const moduleCode = readFile(srcModule).replace(/__PACKAGE__/g, pkg);
      const packageCode = readFile(srcPackage).replace(/__PACKAGE__/g, pkg);

      writeFile(path.join(targetDir, "ZenWallpaperModule.java"), moduleCode);
      writeFile(path.join(targetDir, "ZenWallpaperPackage.java"), packageCode);

      return config;
    },
  ]);

  // 3) Patch MainApplication to register package
  config = withMainApplication(config, (config) => {
    const pkg = config.android?.package;
    if (!pkg) return config;
    config.modResults.contents = patchMainApplication(config.modResults.contents, pkg);
    return config;
  });

  return config;
};