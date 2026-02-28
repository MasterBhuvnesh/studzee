import { UpcomingProfile } from '@/types';
import { CircleChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';


const PLANNING_DATA: UpcomingProfile[] = [
  {
    id: '1',
    title: 'Deep Learning',
    subtitle: 'Complete Roadmap',
    status: 'Not Started',
    icon: CircleChevronRight,
  },
  {
    id: '2',
    title: 'System Design',
    subtitle: 'Complete Roadmap',
    status: 'Ongoing',
    icon: CircleChevronRight,
  },
  {
    id: '3',
    title: 'Machine Learning',
    subtitle: 'Complete Roadmap',
    status: 'In Progress',
    icon: CircleChevronRight,
  },
];

const PlanningListItem = ({ item }: { item: UpcomingProfile }) => (
  <View className="mb-3 flex-row items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
    {/* <View className="items-center justify-center">
      <AppIcon
        Icon={item.icon}
        size={20}
        strokeWidth={1.5}
        color={colors.zinc[500]}
      />
    </View> */}

    <View className="ml-4 flex-1">
      <Text className="font-product text-base text-zinc-900">{item.title}</Text>
      <Text className="font-sans text-sm text-zinc-500">{item.subtitle}</Text>
    </View>

    <View className="rounded-full px-2 py-1">
      {item.status === 'Not Started' && (
        <Text className="font-product text-xs bg-red-300 px-2 py-1 text-white rounded-lg">{item.status}</Text>
      )}
      {item.status === 'In Progress' && (
        <Text className="font-product text-xs bg-green-300 px-2 py-1 text-white rounded-lg">{item.status}</Text>
      )}
      {item.status === 'Ongoing' && (
        <Text className="font-product text-xs bg-blue-300 px-2 py-1 text-white rounded-lg">{item.status}</Text>
      )}
    </View>
  </View>
);

export const PlanningList = () => {
  return (
    <View className="mb-6">
      <Text className="mb-4 font-product text-xl text-zinc-800">
        Upcoming 
      </Text>
      <View>
        {PLANNING_DATA.map(item => (
          <PlanningListItem key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
};
