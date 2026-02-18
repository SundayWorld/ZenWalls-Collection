import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function FavoritesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Favorites',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20,
          },
        }} 
      />
    </Stack>
  );
}
