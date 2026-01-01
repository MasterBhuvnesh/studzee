import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { Brain, Code } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface PlanItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
}

const PLANNING_DATA: PlanItem[] = [
  {
    id: '1',
    title: 'Java Tutorial',
    subtitle: 'Master Java from scratch',
    icon: Code,
  },
  {
    id: '4',
    title: 'Machine Learning',
    subtitle: 'Complete Roadmap',
    icon: Brain,
  },
];

const PlanningListItem = ({ item }: { item: PlanItem }) => (
  <View className="mb-3 flex-row items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
    <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
      <AppIcon
        Icon={item.icon}
        size={20}
        strokeWidth={1.5}
        color={colors.zinc[500]}
      />
    </View>

    <View className="ml-4 flex-1">
      <Text className="font-product text-base text-zinc-900">{item.title}</Text>
      <Text className="font-sans text-sm text-zinc-500">{item.subtitle}</Text>
    </View>

    <View className="rounded-full bg-zinc-100 px-2 py-1">
      <Text className="font-product text-xs text-zinc-400">SOON</Text>
    </View>
  </View>
);

export const PlanningList = () => {
  return (
    <View className="mb-6">
      <Text className="mb-4 font-product text-xl text-zinc-800">
        Upcoming Planning
      </Text>
      <View>
        {PLANNING_DATA.map(item => (
          <PlanningListItem key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
};
