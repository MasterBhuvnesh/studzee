import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';

export const useCustomFonts = () => {
  const [fontsLoaded, fontError] = useFonts({
    GoogleSans: require('../assets/fonts/GoogleSansFlex.ttf'),
    ProductSans: require('../assets/fonts/ProductSansRegular.ttf'),
    'ProductSans-Bold': require('../assets/fonts/ProductSansBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen once the fonts have loaded (or an error was returned)
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return { fontsLoaded, fontError };
};
