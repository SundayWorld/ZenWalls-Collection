// utils/trendingRotation.ts
import { getTrendingCollections, getNewWallpapers } from '../mocks/wallpapers';

export type RotationMeta = {
  // kept only so your app doesn’t break if something expects it
  subtitle?: string;
  badgeTextTrending?: string;
  badgeTextNew?: string;
  badgeTextCollections?: string;
};

export function getRotationMeta(): RotationMeta {
  return {
    subtitle: 'New wallpapers every 12 hours',
    badgeTextTrending: '',
    badgeTextNew: '',
    badgeTextCollections: '',
  };
}

// OLD simple loaders (no time logic)
export async function loadTrendingCollections() {
  return { trending: getTrendingCollections(), meta: getRotationMeta() };
}

export async function loadNewWallpapers() {
  return { wallpapers: getNewWallpapers(), meta: getRotationMeta() };
}

// Compatibility (if any file still calls these)
export function getSlotKey() {
  return 'static';
}

export function shuffleBySlot<T>(arr: T[]) {
  return [...arr];
}

export function pickTrendingCollections<T>(arr: T[], count = 7) {
  return [...arr].slice(0, count);
}







