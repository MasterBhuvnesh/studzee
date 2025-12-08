import { colors } from '@/constants/colors';
import { useAuth } from '@clerk/clerk-expo';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home, Package, User } from 'lucide-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { isSignedIn } = useAuth();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.zinc[900],
          tabBarInactiveTintColor: colors.zinc[400],
          tabBarStyle: {
            backgroundColor: colors.zinc[50],
            borderTopColor: colors.zinc[200],
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Protected guard={isSignedIn ?? false}>
          <Tabs.Screen
            name="index"
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Home color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <User color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="packages"
            options={{
              tabBarLabel: 'Packages',
              tabBarIcon: ({ color, size }) => (
                <Package color={color} size={size} />
              ),
            }}
          />
        </Tabs.Protected>
      </Tabs>
    </SafeAreaProvider>
  );
}
