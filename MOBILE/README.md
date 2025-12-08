using font : Google Sans Flex
command : npx expo install @expo-google-fonts/google-sans-flex expo-font

using tailwindcss : Nativewind
docs : https://www.nativewind.dev/docs/getting-started/installation

using lucide icons
command : npx expo install lucide-react-native
npx expo install react-native-svg

using clerk for auth
command :
npm install @clerk/clerk-expo
npm install @clerk/types
npm install expo-secure-store
npm install expo-image
npm install expo-image-picker expo-document-picker expo-image-manipulator
npm install expo-auth-session

using skia and reanimated to add as many animation as possible :
npm install @shopify/react-native-skia

Instruction for onboarding images :

1. place your images in assets folder
2. import the images in app/(onboarding)/index.tsx
3. add to the onboardingData array
   how ?
   here :
4. For Remote URL : imageSource: { uri: 'https://example.com/image.gif' }
5. For Local Image : imageSource: require('@/assets/image.gif')
6. direclty :

// 1. Import your image
import WelcomeImage from '@/assets/my-image.png';

// 2. Add to the data
const onboardingData = [
{
id: '1',
title: 'Welcome to Studzee',
// ...
imageSource: WelcomeImage,
},
];

TODO :
Fix the UI for onboarding flow
Implement Zod schema for validation
Implement Zustand for state management
