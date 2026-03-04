import { Stack } from 'expo-router';
import { ThemeProvider } from '@/hooks/useTheme';
import { Buffer } from 'buffer';

if (!(global as any).Buffer) {
  (global as any).Buffer = Buffer;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}