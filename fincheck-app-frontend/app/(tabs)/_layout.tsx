import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="upload/index" />
      <Stack.Screen name="results/index" />
      <Stack.Screen name="results/[id]" />
      <Stack.Screen name="compare/[id]" />
      <Stack.Screen name="digit-verify/index" />
      <Stack.Screen name="cheque/index" />
      <Stack.Screen name="banking-demo/index" />
    </Stack>
  );
}