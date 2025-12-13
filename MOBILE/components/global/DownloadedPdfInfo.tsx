import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { DownloadedPdfInfoProps } from '@/types';
import { Image } from 'expo-image';
import { Calendar, Eye, FolderOpen, Share2, Trash2 } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export const DownloadedPdfInfo = ({
  title,
  location,
  size,
  date,
  onRemove,
  onView,
  onShare,
}: DownloadedPdfInfoProps) => {
  return (
    <View className="overflow-hidden">
      <View className="flex-row items-start gap-4">
        <Image
          source={require('@/assets/images/pdf.svg')}
          style={{ width: 48, height: 48 }}
          className="rounded-lg"
        />
        <View className="flex-1">
          <Text
            className="mb-2 font-product text-lg text-zinc-800"
            numberOfLines={2}
          >
            {title}
          </Text>

          {/* META INFO WRAPPER */}
          <View className="gap-2">
            {/* LOCATION */}
            <View className="flex-row items-center gap-2">
              <AppIcon
                Icon={FolderOpen}
                color={colors.zinc[500]}
                size={16}
                strokeWidth={1.5}
              />
              <Text className="font-sans text-sm text-zinc-400">
                {location}
              </Text>
            </View>

            {/* SIZE + DATE (TWO COLUMN) */}
            {/* <View className="flex-row items-center justify-between pr-6"> */}
            {/* <View className="flex-row items-center gap-2">
                <AppIcon
                  Icon={File}
                  color={colors.zinc[500]}
                  size={16}
                  strokeWidth={1.5}
                />
                <Text className="font-sans text-sm text-zinc-400">{size}</Text>
              </View> */}

            <View className="flex-row items-center gap-2">
              <AppIcon
                Icon={Calendar}
                color={colors.zinc[500]}
                size={16}
                strokeWidth={1.5}
              />
              <Text className="font-sans text-sm text-zinc-400">{date}</Text>
            </View>
            {/* </View> */}
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-around bg-zinc-50 p-4">
        <TouchableOpacity
          onPress={onView}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 active:bg-blue-100"
          activeOpacity={0.7}
        >
          <AppIcon
            Icon={Eye}
            color={colors.blue[600]}
            size={18}
            strokeWidth={1.5}
          />
          <Text className="font-sans text-sm font-medium text-blue-500">
            View PDF
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShare}
          className="mx-2 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 active:bg-zinc-100"
          activeOpacity={0.7}
        >
          <AppIcon
            Icon={Share2}
            color={colors.zinc[600]}
            size={18}
            strokeWidth={1.5}
          />
          <Text className="font-sans text-sm font-medium text-zinc-500">
            Share
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRemove}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 active:bg-red-100"
          activeOpacity={0.7}
        >
          <AppIcon
            Icon={Trash2}
            color={colors.red[600]}
            size={18}
            strokeWidth={1.5}
          />
          <Text className="font-sans text-sm font-medium text-red-500">
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
