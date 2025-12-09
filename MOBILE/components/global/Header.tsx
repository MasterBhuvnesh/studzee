import { HeaderProps } from '@/types/components';
import { Text, View } from 'react-native';

export const Header = ({ title }: HeaderProps) => {
  return (
    <View className="px-6 pt-6">
      <Text className="py-2 font-product text-4xl text-zinc-900">{title}</Text>
    </View>
  );
};
