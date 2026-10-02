import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { ThemeProvider } from '@/shared/theme/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      {/* Pestañas y pantallas principales hacen fundido; los flujos entran de lado
          y los recursos de apoyo suben desde abajo */}
      <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 260 }}>
        <Stack.Screen name="(auth)/register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(auth)/profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(app)/daily-test" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="(app)/wellness/crisis-resources"
          options={{ animation: 'fade_from_bottom' }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
