// components/TrendingCard.tsx

import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import type { Collection } from '@/mocks/wallpapers';

interface TrendingCardProps {
  collection: Collection;
  isFirst?: boolean;
}

export default function TrendingCard({ collection, isFirst = false }: TrendingCardProps) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const cardWidth = isFirst ? 180 : 150;
  const cardHeight = isFirst ? 220 : 190;

  // ✅ FIX: Your Collection has coverImages: string[]
  // Use the first cover image. Fallback to empty string (Image will just show placeholder bg).
  const coverUri = useMemo(() => {
    const first = collection?.coverImages?.[0];
    return typeof first === 'string' ? first : '';
  }, [collection]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/collection',
      params: { collectionId: collection.id, collectionName: collection.name },
    });
  }, [collection.id, collection.name, router]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { width: cardWidth, height: cardHeight, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        style={styles.container}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`trending-card-${collection.id}`}
      >
        <Image
          source={coverUri ? { uri: coverUri } : undefined}
          style={styles.image}
          contentFit="cover"
          transition={200}
          // Optional: helps avoid “blank” feel while loading
          placeholder={undefined}
        />

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gradient} />

        <View style={styles.content}>
          <Text style={[styles.title, isFirst && styles.titleLarge]} numberOfLines={1}>
            {collection.name}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 12,
  },
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  content: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  titleLarge: {
    fontSize: 17,
  },
});


