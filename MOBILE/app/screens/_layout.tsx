import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function ScreensLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="pdfs" />
        <Stack.Screen name="content" />
        <Stack.Screen name="[id]" />
      </Stack>
    </>
  );
}
