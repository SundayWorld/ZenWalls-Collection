
import React, { useState, useCallback, useMemo } from 'react';
import {
StyleSheet,
View,
Text,
Pressable,
Alert,
Platform,
Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import Colors from '@/constants/colors';
import Toast from '@/components/Toast';
import { useFavorites } from '@/contexts/FavoritesContext';
import { setWallpaper } from '@/utils/wallpaperEngine';
import type { Wallpaper } from '@/mocks/wallpapers';

function getErrorMessage(err: unknown): string {
if (!err) return 'Unknown error';
if (typeof err === 'string') return err;
if (err instanceof Error) return err.message || String(err);
try {
return JSON.stringify(err);
} catch {
return String(err);
}
}

export default function PreviewScreen() {
const { wallpaper: wallpaperParam } =
useLocalSearchParams<{ wallpaper: string }>();

const insets = useSafeAreaInsets();
const { isFavorite, toggleFavorite } = useFavorites();

const [isSettingWallpaper, setIsSettingWallpaper] = useState(false);
const [isApplied, setIsApplied] = useState(false);
const [toastMessage, setToastMessage] = useState('');
const [showToast, setShowToast] = useState(false);

const wallpaper: Wallpaper | null = useMemo(() => {
try {
if (!wallpaperParam) return null;
return JSON.parse(wallpaperParam);
} catch {
return null;
}
}, [wallpaperParam]);

const isFav = wallpaper ? isFavorite(wallpaper.id) : false;

const showToastMessage = (msg: string) => {
setToastMessage(msg);
setShowToast(true);
};

useFocusEffect(
useCallback(() => {
setIsApplied(false);
return () => setIsSettingWallpaper(false);
}, [])
);

// 🔥 PERFECT SCREEN FIT
const prepareWallpaper = async (uri: string) => {
const { width, height } = Dimensions.get('screen');

const result = await ImageManipulator.manipulateAsync(  
  uri,  
  [{ resize: { width, height } }],  
  {  
    compress: 0.95,  
    format: ImageManipulator.SaveFormat.JPEG,  
  }  
);  

return result.uri;

};

// 🔥 FINAL APPLY ENGINE (FIXED + SAFE)
const applyWallpaper = useCallback(
async (type: 'home' | 'lock' | 'both' = 'both') => {
if (!wallpaper || isSettingWallpaper) return;

if (Platform.OS !== 'android') {  
    Alert.alert('Android Only');  
    return;  
  }  

  try {  
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  
    setIsSettingWallpaper(true);  
    setIsApplied(false);  

    showToastMessage('Downloading...');  

    const fileUri =  
      FileSystem.cacheDirectory + `wallpaper_${Date.now()}.jpg`;  

    const download = await FileSystem.downloadAsync(  
      wallpaper.imageUrl,  
      fileUri  
    );  

    if (download.status !== 200) {  
      throw new Error('Download failed');  
    }  

    // ✅ VERIFY DOWNLOAD  
    const fileInfo = await FileSystem.getInfoAsync(download.uri);  
    if (!fileInfo.exists) {  
      throw new Error('Downloaded file missing');  
    }  

    console.log('DOWNLOADED:', download.uri);  

    showToastMessage('Optimizing...');  

    const preparedImage = await prepareWallpaper(download.uri);  

    console.log('PREPARED:', preparedImage);  

    // ✅ SAFE CLEAN PATH FIX  
    const cleanPath =  
      preparedImage?.startsWith('file://')  
        ? preparedImage.replace('file://', '')  
        : preparedImage;  

    // ❗ VERIFY PROCESSED FILE  
    const preparedInfo = await FileSystem.getInfoAsync(preparedImage);  
    if (!preparedInfo.exists) {  
      throw new Error('Processed file missing');  
    }  

    showToastMessage('Applying...');  

    const result = await setWallpaper(cleanPath, type);  

    if (result?.success) {  
      setIsApplied(true);  
      showToastMessage('Wallpaper applied ✅');  
    } else {  
      throw new Error(result?.message || 'Apply failed');  
    }  
  } catch (error) {  
    console.error('[Wallpaper Error]', error);  
    Alert.alert('Error', getErrorMessage(error));  
  } finally {  
    setIsSettingWallpaper(false);  
  }  
},  
[wallpaper, isSettingWallpaper]

);

const chooseWallpaperType = () => {
Alert.alert('Set Wallpaper', 'Choose where to apply', [
{ text: 'Home Screen', onPress: () => applyWallpaper('home') },
{ text: 'Lock Screen', onPress: () => applyWallpaper('lock') },
{ text: 'Both', onPress: () => applyWallpaper('both') },
{ text: 'Cancel', style: 'cancel' },
]);
};

if (!wallpaper) {
return (
<View style={styles.center}>
<Text style={{ color: Colors.textMuted }}>
Wallpaper not found
</Text>
</View>
);
}

return (
<View style={styles.container}>
<Stack.Screen options={{ headerShown: false }} />

<Image  
    source={{ uri: wallpaper.imageUrl }}  
    style={styles.image}  
    contentFit="contain"  
  />  

  <View style={[styles.bar, { paddingBottom: insets.bottom + 16 }]}>  
    <Pressable style={styles.fav} onPress={() => toggleFavorite(wallpaper)}>  
      <Heart  
        size={24}  
        color={isFav ? Colors.favorite : Colors.text}  
        fill={isFav ? Colors.favorite : 'transparent'}  
      />  
    </Pressable>  

    <Pressable  
      style={[  
        styles.button,  
        isApplied && styles.applied,  
        isSettingWallpaper && styles.disabled,  
      ]}  
      onPress={chooseWallpaperType}  
      disabled={isSettingWallpaper}  
    >  
      <Text style={styles.buttonText}>  
        {isSettingWallpaper  
          ? 'APPLYING...'  
          : isApplied  
          ? 'APPLIED ✓'  
          : 'SET WALLPAPER'}  
      </Text>  
    </Pressable>  
  </View>  

  <Toast  
    message={toastMessage}  
    visible={showToast}  
    onHide={() => setShowToast(false)}  
  />  
</View>

);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: 'black' },

image: {
flex: 1,
width: '100%',
height: '100%',
},

bar: {
position: 'absolute',
bottom: 0,
left: 0,
right: 0,
flexDirection: 'row',
paddingHorizontal: 20,
paddingTop: 16,
gap: 16,
},

fav: {
width: 52,
height: 52,
borderRadius: 26,
backgroundColor: 'rgba(255,255,255,0.1)',
justifyContent: 'center',
alignItems: 'center',
},

button: {
flex: 1,
height: 52,
borderRadius: 26,
backgroundColor: 'white',
justifyContent: 'center',
alignItems: 'center',
},

applied: { backgroundColor: '#2ecc71' },
disabled: { opacity: 0.7 },

buttonText: {
color: 'black',
fontWeight: '700',
},

center: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
},
});
