import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="pdfs" />
        <Stack.Screen name="content" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="quests" />
        <Stack.Screen name="recent-quizzes" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="get-support" />
        <Stack.Screen name="send-feedback" />
        <Stack.Screen name="terms-of-use" />
        <Stack.Screen name="privacy-policy" />
      </Stack>
    </>
  );
}
