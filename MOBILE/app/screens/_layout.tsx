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
        <Stack.Screen name="get-support" />
        <Stack.Screen name="send-feedback" />
        <Stack.Screen name="terms-of-use" />
        <Stack.Screen name="privacy-policy" />
      </Stack>
    </>
  );
}
