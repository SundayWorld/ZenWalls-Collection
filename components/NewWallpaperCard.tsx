import React, { useCallback } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { Wallpaper } from '@/mocks/wallpapers';

interface NewWallpaperCardProps {
  wallpaper: Wallpaper;
}

export default function NewWallpaperCard({ wallpaper }: NewWallpaperCardProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/preview',
      params: { wallpaper: JSON.stringify(wallpaper) },
    });
  }, [wallpaper, router]);

  return (
    <Pressable 
      style={styles.container} 
      onPress={handlePress}
      testID={`new-wallpaper-${wallpaper.id}`}
    >
      <Image
        source={{ uri: wallpaper.thumbnailUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginRight: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
