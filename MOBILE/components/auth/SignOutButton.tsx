import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

import logger from '@/utils/logger';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigate to auth which will start at onboarding
      router.replace('/(auth)/onboarding');
    } catch (err) {
      logger.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      className="items-center rounded-lg bg-red-500 py-4"
    >
      <Text className="font-product text-base text-white">Sign Out</Text>
    </TouchableOpacity>
  );
};
