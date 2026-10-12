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
import { ScreenTransition } from '@/shared/motion/ScreenTransition';
import { EventProvider } from '@/shared/events/infrastructure/EventProvider';
import { AgendaProvider } from '@/features/agenda/infrastructure/AgendaProvider';
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
      <EventProvider>
        <AgendaProvider>
          <Stack
            screenOptions={{ headerShown: false, animation: 'none' }}
            screenLayout={({ children, navigation }) => (
              <ScreenTransition navigation={navigation}>{children}</ScreenTransition>
            )}
          />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </AgendaProvider>
      </EventProvider>
    </ThemeProvider>
  );
}
