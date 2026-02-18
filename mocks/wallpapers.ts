// mocks/wallpapers.ts

import { buildWallpaperUrls, buildCoverImages } from "../constants/wallpapers";

export interface Wallpaper {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  collectionId: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  coverImages: string[];
  wallpaperCount: number;
  isTrending?: boolean;
}

/**
 * ✅ Always use ONLY 1 cover image (first wallpaper) to avoid blank cards.
 * This guarantees Trending ALWAYS shows images too.
 */
function buildSafeCoverImages(slug: string): string[] {
  const covers = buildCoverImages(slug, 1);
  return covers.length > 0 ? [covers[0]] : [];
}

export const collections: Collection[] = [
  // Trending (Top row)
  {
    id: "amoled",
    name: "AMOLED",
    slug: "amoled",
    coverImages: buildSafeCoverImages("amoled"),
    wallpaperCount: 31,
    isTrending: true,
  },
  {
    id: "luxury-amoled",
    name: "Luxury AMOLED",
    slug: "luxury-amoled",
    coverImages: buildSafeCoverImages("luxury-amoled"),
    wallpaperCount: 22,
    isTrending: true,
  },
  {
    id: "dark-amoled",
    name: "Dark AMOLED",
    slug: "dark-amoled",
    coverImages: buildSafeCoverImages("dark-amoled"),
    wallpaperCount: 42,
    isTrending: true,
  },
  {
    id: "cars",
    name: "Cars",
    slug: "cars",
    coverImages: buildSafeCoverImages("cars"),
    wallpaperCount: 25,
    isTrending: true,
  },
  {
    id: "space",
    name: "Space",
    slug: "space",
    coverImages: buildSafeCoverImages("space"),
    wallpaperCount: 16,
    isTrending: true,
  },

  // All collections (full list)
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    slug: "cyberpunk",
    coverImages: buildSafeCoverImages("cyberpunk"),
    wallpaperCount: 18,
    isTrending: true,
  },
  {
    id: "city-urban",
    name: "City / Urban",
    slug: "city-urban",
    coverImages: buildSafeCoverImages("city-urban"),
    wallpaperCount: 15,
    isTrending: true,
  },
  {
    id: "ai-art",
    name: "AI Art",
    slug: "ai-art",
    coverImages: buildSafeCoverImages("ai-art"),
    wallpaperCount: 22,
  },
  {
    id: "gaming",
    name: "Gaming",
    slug: "gaming",
    coverImages: buildSafeCoverImages("gaming"),
    wallpaperCount: 16,
  },
  {
    id: "retro-vintage",
    name: "Retro Vintage",
    slug: "retro-vintage",
    coverImages: buildSafeCoverImages("retro-vintage"),
    wallpaperCount: 14,
  },
  {
    id: "minimal",
    name: "Minimal",
    slug: "minimal",
    coverImages: buildSafeCoverImages("minimal"),
    wallpaperCount: 24,
  },
  {
    id: "abstract",
    name: "Abstract",
    slug: "abstract",
    coverImages: buildSafeCoverImages("abstract"),
    wallpaperCount: 9,
  },
  {
    id: "nature",
    name: "Nature",
    slug: "nature",
    coverImages: buildSafeCoverImages("nature"),
    wallpaperCount: 10,
  },
  {
    id: "flowers",
    name: "Flowers",
    slug: "flowers",
    coverImages: buildSafeCoverImages("flowers"),
    wallpaperCount: 15,
  },
  {
    id: "motorbike",
    name: "Motorbike",
    slug: "motorbike",
    coverImages: buildSafeCoverImages("motorbike"),
    wallpaperCount: 47,
  },
  {
    id: "wild-animals",
    name: "Wild Animals",
    slug: "wild-animals",
    coverImages: buildSafeCoverImages("wild-animals"),
    wallpaperCount: 16,
  },
  {
    id: "cats",
    name: "Cats",
    slug: "cats",
    coverImages: buildSafeCoverImages("cats"),
    wallpaperCount: 13,
  },
  {
    id: "birds",
    name: "Birds",
    slug: "birds",
    coverImages: buildSafeCoverImages("birds"),
    wallpaperCount: 16,
  },
  {
    id: "anime",
    name: "Anime",
    slug: "anime",
    coverImages: buildSafeCoverImages("anime"),
    wallpaperCount: 10,
  },
  {
    id: "cartoon",
    name: "Cartoon",
    slug: "cartoon",
    coverImages: buildSafeCoverImages("cartoon"),
    wallpaperCount: 18,
  },
  {
    id: "quiet-icons",
    name: "Quiet Icons",
    slug: "quiet-icons",
    coverImages: buildSafeCoverImages("quiet-icons"),
    wallpaperCount: 24,
  },
  {
    id: "quotes",
    name: "Quotes",
    slug: "quotes",
    coverImages: buildSafeCoverImages("quotes"),
    wallpaperCount: 23,
  },
  {
    id: "sports",
    name: "Sports",
    slug: "sports",
    coverImages: buildSafeCoverImages("sports"),
    wallpaperCount: 12,
  },

  // ✅ Dogs removed (as you requested)
];

export function getWallpapersByCollection(collectionId: string): Wallpaper[] {
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) return [];

  const urls = buildWallpaperUrls(collection.slug, collection.wallpaperCount);
  if (urls.length === 0) return [];

  return urls.map((url, index) => ({
    id: `${collectionId}-${index + 1}`,
    title: `${collection.name} ${index + 1}`,
    imageUrl: url,
    thumbnailUrl: url,
    collectionId,
  }));
}

export function getTrendingCollections(): Collection[] {
  return collections.filter((c) => c.isTrending);
}

export function getNewWallpapers(): Wallpaper[] {
  const allWallpapers: Wallpaper[] = [];

  collections.forEach((collection) => {
    const wallpapers = getWallpapersByCollection(collection.id);
    allWallpapers.push(...wallpapers.slice(0, 2));
  });

  return allWallpapers.slice(0, 10);
}

export function searchWallpapers(query: string): Wallpaper[] {
  const lowerQuery = query.toLowerCase();
  const results: Wallpaper[] = [];

  collections.forEach((collection) => {
    if (collection.name.toLowerCase().includes(lowerQuery)) {
      results.push(...getWallpapersByCollection(collection.id));
    }
  });

  return results.slice(0, 20);
}

export function searchCollections(query: string): Collection[] {
  const lowerQuery = query.toLowerCase();
  return collections.filter((c) => c.name.toLowerCase().includes(lowerQuery));
}













