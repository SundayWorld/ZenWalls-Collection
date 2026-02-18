import React, { useCallback } from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { Wallpaper } from '@/mocks/wallpapers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  showFavorite?: boolean;
}

export default function WallpaperCard({ wallpaper, showFavorite = true }: WallpaperCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(wallpaper.id);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/preview',
      params: { wallpaper: JSON.stringify(wallpaper) },
    });
  }, [wallpaper, router]);

  const handleFavoritePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(wallpaper);
  }, [wallpaper, toggleFavorite]);

  return (
    <Pressable 
      style={styles.container} 
      onPress={handlePress}
      testID={`wallpaper-card-${wallpaper.id}`}
    >
      <Image
        source={{ uri: wallpaper.thumbnailUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      {showFavorite && (
        <Pressable 
          style={styles.favoriteButton} 
          onPress={handleFavoritePress}
          hitSlop={8}
          testID={`favorite-button-${wallpaper.id}`}
        >
          <Heart 
            size={18} 
            color={isFav ? Colors.favorite : Colors.text} 
            fill={isFav ? Colors.favorite : 'transparent'}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
