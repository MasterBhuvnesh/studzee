import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      className="items-center rounded-lg bg-red-500 py-4"
    >
      <Text className="font-product-bold text-base text-white">Sign Out</Text>
    </TouchableOpacity>
  );
};
