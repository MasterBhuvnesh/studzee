import { View, ActivityIndicator } from 'react-native';

export const LoadingScreen = () => {
  return (
    <View className="flex-1 items-center justify-center bg-transparent">
      <ActivityIndicator size="large" color="#3f3f46" />
    </View>
  );
};
