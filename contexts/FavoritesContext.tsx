import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import type { Wallpaper } from '@/mocks/wallpapers';

const FAVORITES_KEY = 'zenwalls_favorites';

type FavoriteAction = 'added' | 'removed' | null;

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const [favorites, setFavorites] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAction, setLastAction] = useState<FavoriteAction>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      console.log('[Favorites] Loading favorites from storage');
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(parsed);
        console.log('[Favorites] Loaded', parsed.length, 'favorites');
      }
    } catch (error) {
      console.error('[Favorites] Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: Wallpaper[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      console.log('[Favorites] Saved', newFavorites.length, 'favorites');
    } catch (error) {
      console.error('[Favorites] Error saving favorites:', error);
    }
  };

  const addFavorite = useCallback((wallpaper: Wallpaper) => {
    setFavorites(prev => {
      const exists = prev.some(w => w.id === wallpaper.id);
      if (exists) return prev;
      const updated = [wallpaper, ...prev];
      saveFavorites(updated);
      setLastAction('added');
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((wallpaperId: string) => {
    setFavorites(prev => {
      const updated = prev.filter(w => w.id !== wallpaperId);
      saveFavorites(updated);
      setLastAction('removed');
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((wallpaper: Wallpaper): FavoriteAction => {
    const isFav = favorites.some(w => w.id === wallpaper.id);
    if (isFav) {
      removeFavorite(wallpaper.id);
      return 'removed';
    } else {
      addFavorite(wallpaper);
      return 'added';
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((wallpaperId: string) => {
    return favorites.some(w => w.id === wallpaperId);
  }, [favorites]);

  const clearLastAction = useCallback(() => {
    setLastAction(null);
  }, []);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    lastAction,
    clearLastAction,
  };
});
