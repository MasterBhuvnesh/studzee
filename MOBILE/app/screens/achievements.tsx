import { AppIcon } from '@/components/global/AppIcon';
import CustomBottomSheetModal from '@/components/global/CustomBottomSheetModal';
import { colors } from '@/constants/colors';
import { getMyProgress } from '@/lib/api';
import type { BadgeStatus, MyProgress } from '@/types';
import logger from '@/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Lock } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Mirror of the level catalog in the backend's gamification module. The
 * progress endpoint returns only the current and next level, so the full
 * ladder for the Levels tab lives here. Keep the two lists in sync.
 */
const LEVELS = [
  { key: 'novice', label: 'Novice', minPoints: 0 },
  { key: 'apprentice', label: 'Apprentice', minPoints: 100 },
  { key: 'scholar', label: 'Scholar', minPoints: 250 },
  { key: 'master', label: 'Master', minPoints: 500 },
] as const;

type TabKey = 'badges' | 'levels';

interface SheetTarget {
  key: string;
  label: string;
  description: string;
  /** Points cost for levels, undefined for badges */
  minPoints?: number;
  awarded: boolean;
  awardedAt?: string;
}

/**
 * Badge and level art renders from a URL when the catalog carries one and
 * falls back to the bundled placeholder when it does not or fails to load.
 * Remote first, because art added later cannot ship through EAS Update.
 */
const AchievementArt = ({
  uri,
  size,
  dimmed,
}: {
  uri?: string;
  size: number;
  dimmed?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  const source =
    uri && !failed
      ? { uri }
      : require('@/assets/images/sample_badge_level.png');

  return (
    <Image
      source={source}
      style={{ width: size, height: size, opacity: dimmed ? 0.45 : 1 }}
      contentFit="contain"
      onError={() => setFailed(true)}
    />
  );
};

const BadgeCard = ({
  badge,
  onPress,
}: {
  badge: BadgeStatus;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="mb-3 flex-row items-center rounded-2xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
    activeOpacity={0.7}
  >
    <AchievementArt size={52} dimmed={!badge.awarded} />
    <View className="ml-4 flex-1">
      <Text
        className={`font-product text-base ${
          badge.awarded ? 'text-zinc-800' : 'text-zinc-500'
        }`}
      >
        {badge.label}
      </Text>
      <Text
        className="mt-0.5 font-sans text-xs text-zinc-400"
        numberOfLines={2}
      >
        {badge.description}
      </Text>
    </View>
    <View
      className={`ml-3 rounded-full p-1.5 ${
        badge.awarded ? 'bg-green-100' : 'bg-zinc-100'
      }`}
    >
      <AppIcon
        Icon={badge.awarded ? Check : Lock}
        size={14}
        strokeWidth={2}
        color={badge.awarded ? colors.green[600] : colors.zinc[400]}
      />
    </View>
  </TouchableOpacity>
);

const LevelCard = ({
  level,
  points,
  onPress,
}: {
  level: { key: string; label: string; minPoints: number };
  points: number;
  onPress: () => void;
}) => {
  const isCurrent =
    points >= level.minPoints &&
    (LEVELS.find(l => l.minPoints > points)?.minPoints ?? Infinity) >
      level.minPoints;
  const reached = points >= level.minPoints;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mb-3 flex-row items-center rounded-2xl border bg-white p-4 active:bg-zinc-50 ${
        isCurrent ? 'border-zinc-900' : 'border-zinc-200'
      }`}
      activeOpacity={0.7}
    >
      <AchievementArt size={52} dimmed={!reached} />
      <View className="ml-4 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-product text-base text-zinc-800">
            {level.label}
          </Text>
          {isCurrent && (
            <View className="rounded-full bg-zinc-900 px-2 py-0.5">
              <Text className="font-sans text-[10px] text-white">Current</Text>
            </View>
          )}
        </View>
        <Text className="mt-0.5 font-sans text-xs text-zinc-400">
          {reached
            ? `Unlocked at ${level.minPoints} gems`
            : `${level.minPoints - points} gems to go`}
        </Text>
      </View>
      <View
        className={`ml-3 rounded-full p-1.5 ${
          reached ? 'bg-green-100' : 'bg-zinc-100'
        }`}
      >
        <AppIcon
          Icon={reached ? Check : Lock}
          size={14}
          strokeWidth={2}
          color={reached ? colors.green[600] : colors.zinc[400]}
        />
      </View>
    </TouchableOpacity>
  );
};

const LoadingState = () => (
  <View className="px-6 pt-2">
    {[1, 2, 3, 4].map(index => (
      <View
        key={index}
        className="mb-3 h-20 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <View className="flex-row items-center">
          <View className="h-12 w-12 rounded-xl bg-zinc-100" />
          <View className="ml-4 flex-1">
            <View className="mb-2 h-4 w-1/2 rounded bg-zinc-100" />
            <View className="h-3 w-3/4 rounded bg-zinc-100" />
          </View>
        </View>
      </View>
    ))}
  </View>
);

export default function AchievementsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const sheetRef = useRef<BottomSheetModal>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('badges');
  const [progress, setProgress] = useState<MyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SheetTarget | null>(null);

  // Clerk's getToken is not referentially stable, so it is read through a
  // ref to keep this callback and the mount effect from rebuilding on every
  // render, which would loop requests into the rate limiter.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const inFlight = useRef(false);

  const fetchProgress = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setLoading(true);
      setError(null);

      const token = await getTokenRef.current();
      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      setProgress(await getMyProgress(token));
      logger.success('Achievements data loaded');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load achievements';
      setError(message);
      logger.error(`Error loading achievements: ${message}`);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  const openDetail = useCallback((target: SheetTarget) => {
    setSelected(target);
    sheetRef.current?.present?.();
  }, []);

  const badges = progress?.allBadges ?? [];
  const points = progress?.points ?? 0;

  return (
    <>
      <LinearGradient
        colors={[colors.zinc[50], colors.zinc[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center gap-3 px-6 pb-4 pt-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="rounded-full p-2 active:bg-zinc-200"
              activeOpacity={0.7}
            >
              <AppIcon
                Icon={ArrowLeft}
                color={colors.zinc[700]}
                size={24}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <Text className="flex-1 font-product text-xl text-zinc-800">
              Achievements
            </Text>
            {!loading && !error && (
              <View className="flex-row items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5">
                <Image
                  source={require('@/assets/images/gem.png')}
                  style={{ width: 16, height: 16 }}
                  contentFit="contain"
                />
                <Text className="font-product text-sm text-zinc-800">
                  {points}
                </Text>
              </View>
            )}
          </View>

          {/* Segmented tabs. Class sets are static per state: toggling
              shadow between renders trips NativeWind's late upgrade path,
              whose warning printer crashes on context getters. */}
          <View className="mx-6 mb-4 flex-row rounded-full bg-zinc-200/70 p-1">
            {(['badges', 'levels'] as TabKey[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 rounded-full py-2 shadow-sm ${
                  activeTab === tab ? 'bg-white' : 'bg-transparent'
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-center font-product text-sm ${
                    activeTab === tab ? 'text-zinc-900' : 'text-zinc-500'
                  }`}
                >
                  {tab === 'badges' ? 'Badges' : 'Levels'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-full rounded-2xl border border-red-200 bg-red-50 p-6">
                <Text className="font-product text-base text-red-800">
                  Error Loading Achievements
                </Text>
                <Text className="mt-2 font-sans text-sm text-red-600">
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={fetchProgress}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2 active:bg-red-700"
                  activeOpacity={0.8}
                >
                  <Text className="text-center font-sans text-sm text-white">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
            >
              {activeTab === 'badges'
                ? badges.map(badge => (
                    <BadgeCard
                      key={badge.key}
                      badge={badge}
                      onPress={() =>
                        openDetail({
                          key: badge.key,
                          label: badge.label,
                          description: badge.description,
                          awarded: badge.awarded,
                          awardedAt: progress?.badges.find(
                            earned => earned.key === badge.key
                          )?.awardedAt,
                        })
                      }
                    />
                  ))
                : LEVELS.map(level => (
                    <LevelCard
                      key={level.key}
                      level={level}
                      points={points}
                      onPress={() =>
                        openDetail({
                          key: level.key,
                          label: level.label,
                          description: `Reach ${level.minPoints} gems to hold the ${level.label} level.`,
                          minPoints: level.minPoints,
                          awarded: points >= level.minPoints,
                        })
                      }
                    />
                  ))}
              <View className="h-8" />
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Detail bottom sheet */}
      <CustomBottomSheetModal ref={sheetRef}>
        {selected && (
          <View className="items-center p-6 pb-10">
            <AchievementArt
              uri={undefined}
              size={128}
              dimmed={!selected.awarded}
            />
            <Text className="mt-4 font-product text-xl text-zinc-900">
              {selected.label}
            </Text>
            <Text className="mt-2 text-center font-sans text-sm leading-5 text-zinc-500">
              {selected.description}
            </Text>
            <View
              className={`mt-4 flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                selected.awarded ? 'bg-green-100' : 'bg-zinc-100'
              }`}
            >
              <AppIcon
                Icon={selected.awarded ? Check : Lock}
                size={14}
                strokeWidth={2}
                color={selected.awarded ? colors.green[600] : colors.zinc[500]}
              />
              <Text
                className={`font-sans text-xs font-medium ${
                  selected.awarded ? 'text-green-700' : 'text-zinc-500'
                }`}
              >
                {selected.awarded
                  ? selected.awardedAt
                    ? `Unlocked ${new Date(selected.awardedAt).toLocaleDateString()}`
                    : 'Unlocked'
                  : selected.minPoints !== undefined
                    ? `${selected.minPoints - points} gems to go`
                    : 'Locked'}
              </Text>
            </View>
          </View>
        )}
      </CustomBottomSheetModal>
    </>
  );
}
