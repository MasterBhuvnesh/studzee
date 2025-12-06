import "@/styles/global.css";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GoogleSans: require("../assets/fonts/GoogleSansFlex.ttf"),
    ProductSans: require("../assets/fonts/ProductSansRegular.ttf"),
    "ProductSans-Bold": require("../assets/fonts/ProductSansBold.ttf"),
  });

  if (!fontsLoaded) {
    console.log("Fonts not loaded");
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}