import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function HomeLayout() {
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
          title: 'ZenWalls Collection', // Title for the screen
          headerTitleStyle: {
            fontWeight: '700', // Make header text bold
            fontSize: 20,      // Font size adjustment
          },
          headerStyle: {
            backgroundColor: Colors.background, // Set the header background color
          },
          headerTintColor: Colors.text, // Set the color for header text
        }} 
      />
    </Stack>
  );
}

