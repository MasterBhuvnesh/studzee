import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { useAuth } from '@clerk/clerk-expo';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChartColumnBig, Home, Package, Settings } from 'lucide-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { isSignedIn } = useAuth();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.zinc[700],
          tabBarInactiveTintColor: colors.zinc[300],
          tabBarStyle: {
            backgroundColor: colors.zinc[50],
            borderTopColor: colors.zinc[200],
            borderCurve: 'continuous',
            borderTopWidth: 1,
            height: 60,
            paddingVertical: 10,
            paddingBottom: 5,
            paddingTop: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'ProductSans',
          },
        }}
      >
        <Tabs.Protected guard={isSignedIn ?? false}>
          <Tabs.Screen
            name="index"
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size }) => (
                <AppIcon
                  Icon={Home}
                  color={color}
                  size={size}
                  strokeWidth={1.5}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="progress"
            options={{
              tabBarLabel: 'Progress',
              tabBarIcon: ({ color, size }) => (
                <AppIcon
                  Icon={ChartColumnBig}
                  color={color}
                  size={size}
                  strokeWidth={1.5}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="resources"
            options={{
              tabBarLabel: 'Resources',
              tabBarIcon: ({ color, size }) => (
                <AppIcon
                  Icon={Package}
                  color={color}
                  size={size}
                  strokeWidth={1.5}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              tabBarLabel: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <AppIcon
                  Icon={Settings}
                  color={color}
                  size={size}
                  strokeWidth={1.5}
                />
              ),
            }}
          />
        </Tabs.Protected>
      </Tabs>
    </SafeAreaProvider>
  );
}
