// app/(tabs)/(home)/index.tsx

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, Pressable, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '../../../constants/colors';
import WelcomeBanner from '../../../components/WelcomeBanner';
import TrendingCard from '../../../components/TrendingCard';
import CollectionCard from '../../../components/CollectionCard';
import NewWallpaperCard from '../../../components/NewWallpaperCard';
import AdBanner from '../../../components/AdBanner';

import {
  collections,
  getTrendingCollections,
  getNewWallpapers,
  getWallpapersByCollection,
} from '../../../mocks/wallpapers';

import { getRotatedCoverIndex } from '../../../utils/coverRotation';

interface RotatedCollection {
  id: string;
  name: string;
  coverUrl: string;
  wallpaperCount: number;
  isTrending?: boolean;
  rotatedCoverUrl?: string;
}

// Fix lucide-react-native typing issues in some setups
const SearchIcon = Search as unknown as React.ComponentType<any>;

function toRotatedCollection(c: any): RotatedCollection {
  return {
    id: String(c.id),
    name: String(c.name ?? 'Collection'),
    coverUrl: String(c.coverUrl ?? c.coverImageUrl ?? c.coverImages?.[0] ?? ''),
    wallpaperCount: Number(c.wallpaperCount ?? 0),
    isTrending: Boolean(c.isTrending),
    rotatedCoverUrl: String(c.rotatedCoverUrl ?? ''),
  };
}

function pickBestCoverUrl(item: any): string {
  return String(
    item?.rotatedCoverUrl ??
      item?.coverUrl ??
      item?.coverImageUrl ??
      item?.coverImages?.[0] ??
      ''
  );
}

function isLuxuryAmoled(item: any): boolean {
  const slug = String(item?.slug ?? '').toLowerCase();
  const name = String(item?.name ?? '').toLowerCase();

  // supports either slug or name matching
  return slug === 'luxury-amoled' || name.includes('luxury amoled');
}

export default function HomeScreen() {
  const router = useRouter();

  // Always store as RotatedCollection[]
  const [rotatedCollections, setRotatedCollections] = useState<RotatedCollection[]>(
    (collections as any[]).map(toRotatedCollection)
  );

  // Trending/New from mocks
  const rawTrending = useMemo(() => getTrendingCollections(), []);
  const rawNewWallpapers = useMemo(() => getNewWallpapers(), []);

  // ✅ Trending: force Luxury AMOLED to first position
  const trendingCollections = useMemo(() => {
    const map = new Map(rotatedCollections.map((c) => [String(c.id), c]));

    const luxury = (rawTrending as any[]).find(isLuxuryAmoled);
    const rest = (rawTrending as any[]).filter((t) => !isLuxuryAmoled(t));

    const withCover = (t: any) => {
      const id = String(t?.id);
      const match = map.get(id);
      const coverUrl = pickBestCoverUrl(match ?? t);
      return { ...t, coverUrl, rotatedCoverUrl: coverUrl };
    };

    const restWithCover = rest.map(withCover);

    if (!luxury) return restWithCover;

    return [withCover(luxury), ...restWithCover];
  }, [rawTrending, rotatedCollections]);

  const newWallpapers = useMemo(() => rawNewWallpapers as any[], [rawNewWallpapers]);

  const loadRotatedCovers = useCallback(async () => {
    try {
      const rotated: RotatedCollection[] = await Promise.all(
        (collections as any[]).map(async (raw) => {
          const collection = toRotatedCollection(raw);
          const wallpapers = getWallpapersByCollection(collection.id);

          if (wallpapers.length > 1) {
            const rotationIndex = await getRotatedCoverIndex(collection.id, wallpapers.length);

            return {
              ...collection,
              rotatedCoverUrl: String(
                wallpapers[rotationIndex]?.thumbnailUrl ??
                  wallpapers[rotationIndex]?.imageUrl ??
                  collection.coverUrl
              ),
            };
          }

          return { ...collection, rotatedCoverUrl: collection.coverUrl };
        })
      );

      setRotatedCollections(rotated);
      console.log('[Home] Loaded rotated covers for', rotated.length, 'collections');
    } catch (error) {
      console.error('[Home] Error loading rotated covers:', error);
    }
  }, []);

  useEffect(() => {
    loadRotatedCovers();
  }, [loadRotatedCovers]);

  // 🚀 PRELOADING BOOST
  useEffect(() => {
    const urls: string[] = [];

    // Trending covers first
    for (const t of trendingCollections.slice(0, 6)) {
      const u = pickBestCoverUrl(t);
      if (u) urls.push(u);
    }

    // Collections covers next
    for (const c of rotatedCollections.slice(0, 10)) {
      const u = pickBestCoverUrl(c);
      if (u) urls.push(u);
    }

    // New wallpapers thumbnails
    for (const w of newWallpapers.slice(0, 6)) {
      const u = String(w?.thumbnailUrl ?? w?.imageUrl ?? '');
      if (u) urls.push(u);
    }

    const unique = Array.from(new Set(urls)).slice(0, 18);

    unique.forEach((u) => {
      Image.prefetch(u).catch(() => {});
    });
  }, [trendingCollections, rotatedCollections, newWallpapers]);

  const handleSearchPress = useCallback(() => {
    router.push('/search');
  }, [router]);

  const renderTrendingItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <TrendingCard collection={item} isFirst={index === 0} />
    ),
    []
  );

  const renderNewWallpaperItem = useCallback(
    ({ item }: { item: any }) => <NewWallpaperCard wallpaper={item} />,
    []
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={handleSearchPress}
              hitSlop={8}
              style={styles.searchButton}
              testID="search-button"
            >
              <SearchIcon size={22} color={Colors.text} />
            </Pressable>
          ),
        }}
      />

      <LinearGradient colors={[Colors.gradientEnd, 'transparent']} style={styles.backgroundGradient} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSubtitle}>
          <Text style={styles.subtitleText}>New wallpapers every 12 hours</Text>
        </View>

        <WelcomeBanner />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleInline}>Trending Now</Text>
            <View style={styles.updatedBadge}>
              <Text style={styles.updatedText}>Updated Today</Text>
            </View>
          </View>

          <FlatList
            horizontal
            data={trendingCollections}
            keyExtractor={(item: any) => String(item.id)}
            renderItem={renderTrendingItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingList}
            snapToInterval={162}
            decelerationRate="fast"
            snapToAlignment="start"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collections</Text>

          <View style={styles.collectionsGrid}>
            {rotatedCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection as any}
                coverUrl={collection.rotatedCoverUrl || collection.coverUrl}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Wallpapers</Text>

          <FlatList
            horizontal
            data={newWallpapers}
            keyExtractor={(item: any) => String(item.id)}
            renderItem={renderNewWallpaperItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newWallpapersList}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backgroundGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  headerSubtitle: { paddingHorizontal: 16, marginBottom: 12 },
  subtitleText: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' as const },
  searchButton: { padding: 4 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' as const, paddingHorizontal: 16, marginBottom: 14 },
  sectionTitleInline: { color: Colors.text, fontSize: 18, fontWeight: '700' as const },
  updatedBadge: {
    marginLeft: 10,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  updatedText: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' as const },
  trendingList: { paddingHorizontal: 16 },
  collectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
  newWallpapersList: { paddingHorizontal: 16 },
  bottomSpacer: { height: 20 },
});













