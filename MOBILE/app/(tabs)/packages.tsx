import { Text, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function PackagesPage() {
  return (
    <LinearGradient
      colors={["#a1a1aa", "#ffffff"]} // zinc-900, zinc-400, white (approximating zinc-800, zinc-400, zinc-0)
      className="flex-1 items-center justify-center h-full w-full"
    >
      <Text className="text-center text-4xl font-sans text-zinc-900 p-2">
        Packages
      </Text>
    </LinearGradient>
  );
}
