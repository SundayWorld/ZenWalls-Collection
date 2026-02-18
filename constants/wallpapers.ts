// constants/wallpapers.ts

export const WALLPAPER_BASE_URL =
  "https://sundayworld.github.io/wallpapers/wallpapers";

/**
 * IMPORTANT:
 * - "folder" = GitHub folder name (usually kebab-case: dark-amoled, luxury-amoled, ai-art, etc)
 * - "prefix" = file name prefix inside that folder (often snake_case: dark_amoled_1.webp, ai_art_1.webp)
 * - "count" = total images you confirmed exist
 */
export const COLLECTIONS_META: Record<
  string,
  { folder: string; prefix: string; count: number }
> = {
  // Premium AMOLED sets
  "amoled": { folder: "amoled", prefix: "amoled", count: 31 },
  "luxury-amoled": { folder: "luxury-amoled", prefix: "luxury_amoled", count: 22 },
  "dark-amoled": { folder: "dark-amoled", prefix: "dark_amoled", count: 42 },

  // Tech / art
  "ai-art": { folder: "ai-art", prefix: "ai_art", count: 22 },
  "cyberpunk": { folder: "cyberpunk", prefix: "cyberpunk", count: 18 },
  "city-urban": { folder: "city-urban", prefix: "city_urban", count: 15 },
  "gaming": { folder: "gaming", prefix: "gaming", count: 16 },
  "retro-vintage": { folder: "retro-vintage", prefix: "retro", count: 14 },

  // Nature / space
  "space": { folder: "space", prefix: "space", count: 16 },
  "nature": { folder: "nature", prefix: "nature", count: 10 },
  "flowers": { folder: "flowers", prefix: "flowers", count: 15 },

  // Minimal / abstract
  "minimal": { folder: "minimal", prefix: "minimal", count: 24 },
  "abstract": { folder: "abstract", prefix: "abstract", count: 9 },

  // Vehicles
  "cars": { folder: "cars", prefix: "cars", count: 25 },
  "motorbike": { folder: "motorbike", prefix: "motorbike", count: 47 },

  // Animals
  "wild-animals": { folder: "wild-animals", prefix: "wild_animals", count: 16 },
  "cats": { folder: "cats", prefix: "cats", count: 13 },
  "birds": { folder: "birds", prefix: "birds", count: 16 },

  // Fun
  "anime": { folder: "anime", prefix: "anime", count: 10 },
  "cartoon": { folder: "cartoon", prefix: "cartoon", count: 18 },

  // Utility
  "quiet-icons": { folder: "quiet-icons", prefix: "quiet_icons", count: 24 },
  "quotes": { folder: "quotes", prefix: "quotes", count: 23 },

  // Sports
  "sports": { folder: "sports", prefix: "sports", count: 12 },
};

export function buildWallpaperUrls(slug: string, count?: number): string[] {
  const meta = COLLECTIONS_META[slug];
  if (!meta) return [];

  const max = Math.max(1, count ?? meta.count);

  return Array.from({ length: max }, (_, i) => {
    const n = i + 1;
    return `${WALLPAPER_BASE_URL}/${meta.folder}/${meta.prefix}_${n}.webp`;
  });
}

/**
 * Always returns at least 1 cover image if the collection exists.
 * (This ensures cards NEVER appear blank due to coverImages being empty.)
 */
export function buildCoverImages(slug: string, coverCount: number = 1): string[] {
  const meta = COLLECTIONS_META[slug];
  if (!meta) return [];

  const count = Math.max(1, Math.min(coverCount, meta.count));
  return buildWallpaperUrls(slug, count);
}

/**
 * Preloading boost 🚀
 * You can use this to preload the first few images for smooth scrolling.
 */
export function getPreloadUrls(slug: string, howMany: number = 3): string[] {
  return buildCoverImages(slug, howMany);
}











