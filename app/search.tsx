import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, Pressable, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, X, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import WallpaperCard from '@/components/WallpaperCard';
import { searchWallpapers, searchCollections, collections, Collection } from '@/mocks/wallpapers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim()) return { wallpapers: [], collections: [] };
    return {
      wallpapers: searchWallpapers(query),
      collections: searchCollections(query),
    };
  }, [query]);

  const suggestedCollections = useMemo(() => {
    if (query.trim()) return [];
    return collections.slice(0, 6);
  }, [query]);

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const handleCollectionPress = useCallback((collection: Collection) => {
    router.push({
      pathname: '/collection',
      params: { collectionId: collection.id, collectionName: collection.name },
    });
  }, [router]);

  const hasResults = searchResults.wallpapers.length > 0 || searchResults.collections.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search wallpapers..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8}>
              <X size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {!query.trim() && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Popular Categories</Text>
          <View style={styles.suggestionsGrid}>
            {suggestedCollections.map((collection) => (
              <Pressable
                key={collection.id}
                style={styles.suggestionChip}
                onPress={() => handleCollectionPress(collection)}
              >
                <Text style={styles.suggestionText}>{collection.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {query.trim() && !hasResults && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found for "{query}"</Text>
          <Text style={styles.noResultsHint}>Try searching for something else</Text>
        </View>
      )}

      {hasResults && (
        <FlatList
          data={searchResults.wallpapers}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => <WallpaperCard wallpaper={item} />}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            searchResults.collections.length > 0 ? (
              <View style={styles.collectionsHeader}>
                <Text style={styles.resultsTitle}>Collections</Text>
                <View style={styles.collectionChips}>
                  {searchResults.collections.map((collection) => (
                    <Pressable
                      key={collection.id}
                      style={styles.collectionChip}
                      onPress={() => handleCollectionPress(collection)}
                    >
                      <Text style={styles.collectionChipText}>{collection.name}</Text>
                      <Text style={styles.collectionChipCount}>{collection.wallpaperCount}+</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.resultsTitle, { marginTop: 20 }]}>Wallpapers</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarFocused: {
    borderColor: Colors.textMuted,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    marginLeft: 10,
    marginRight: 8,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  suggestionsTitle: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    color: Colors.text,
    fontSize: 14,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsHint: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
  collectionsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  collectionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  collectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  collectionChipText: {
    color: Colors.text,
    fontSize: 14,
  },
  collectionChipCount: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
