import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../shared/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Debugging: log types to detect which import is undefined
  try {
    // eslint-disable-next-line no-console
    console.log('DEBUG: Stack type', typeof Stack, Stack);
    // eslint-disable-next-line no-console
    console.log('DEBUG: ThemeProvider type', typeof ThemeProvider, ThemeProvider);
  } catch (e) {
    // ignore
  }

  const StackComponent: any = Stack || (() => null);

  return (
    <ThemeProvider>
      <StackComponent screenOptions={{ headerShown: false }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
