import { Text, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PackagesPage() {
  return (
    <LinearGradient
      colors={['#a1a1aa', '#ffffff']} // zinc-900, zinc-400, white (approximating zinc-800, zinc-400, zinc-0)
      className="h-full w-full flex-1 items-center justify-center"
    >
      <Text className="p-2 text-center font-sans text-4xl text-zinc-900">
        Packages
      </Text>
    </LinearGradient>
  );
}
