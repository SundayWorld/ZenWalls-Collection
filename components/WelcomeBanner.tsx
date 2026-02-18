import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';

const WELCOME_KEY = 'zenwalls_has_seen_welcome';

export default function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem(WELCOME_KEY);
      if (!hasSeen) {
        setIsVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          dismissBanner();
        }, 6000);
      }
    } catch (error) {
      console.error('[WelcomeBanner] Error checking welcome status:', error);
    }
  };

  const dismissBanner = async () => {
    try {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
      await AsyncStorage.setItem(WELCOME_KEY, 'true');
    } catch (error) {
      console.error('[WelcomeBanner] Error dismissing banner:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to ZenWalls Collection</Text>
        <Text style={styles.subtitle}>
          Explore thousands of wallpapers and set your favorite instantly.
        </Text>
      </View>
      <Pressable 
        style={styles.closeButton} 
        onPress={dismissBanner}
        hitSlop={12}
        testID="welcome-close-button"
      >
        <X size={16} color={Colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
