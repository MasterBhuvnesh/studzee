import { AppIcon } from '@/components/global/AppIcon';
import { CustomAlert } from '@/components/global/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { colors } from '@/constants/colors';
import { completeQuest, getQuests } from '@/lib/api';
import type { QuestSummary } from '@/types';
import logger from '@/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ListChecks,
  PenLine,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GEM = require('@/assets/images/gem.png');

const typeIcon = (type: string) =>
  type === 'read_blog'
    ? BookOpen
    : type === 'fill_blank'
      ? PenLine
      : ListChecks;

const GemsPill = ({ gems }: { gems: number }) => (
  <View className="flex-row items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
    <Image
      source={GEM}
      style={{ width: 14, height: 14 }}
      contentFit="contain"
    />
    <Text className="font-product text-xs text-amber-700">+{gems}</Text>
  </View>
);

/**
 * Summary card at the top of the quests screen: gems earned in this window,
 * how much of the window is done, and what is still on the table. Same white
 * bordered surface as every other card on the screen.
 */
const GemsSummaryCard = ({
  earned,
  done,
  total,
  remaining,
}: {
  earned: number;
  done: number;
  total: number;
  remaining: number;
}) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <View className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="rounded-2xl bg-zinc-100 p-2.5">
            <Image
              source={GEM}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
            />
          </View>
          <View>
            <Text className="font-sans text-xs text-zinc-400">Your Gems</Text>
            <Text className="font-product text-3xl text-zinc-900">
              {earned}
            </Text>
          </View>
        </View>

        <View className="items-end gap-1.5">
          <View className="flex-row items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
            <Check size={12} color={colors.green[500]} strokeWidth={2.5} />
            <Text className="font-sans text-[11px] text-zinc-600">
              {done} of {total}
            </Text>
          </View>
          {remaining > 0 && (
            <View className="flex-row items-center gap-1">
              <Image
                source={GEM}
                style={{ width: 12, height: 12 }}
                contentFit="contain"
              />
              <Text className="font-product text-[11px] text-amber-700">
                +{remaining} up for grabs
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="mt-4 h-1.5 rounded-full bg-zinc-100">
        <View
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
};

/**
 * One row in a quest section: icon tile, title, description and either the
 * gem reward (available) or a completion check (done).
 */
const QuestRow = ({
  quest,
  onPress,
}: {
  quest: QuestSummary;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="mb-2.5 flex-row items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 active:bg-zinc-100"
    activeOpacity={0.7}
  >
    <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200/70">
      <AppIcon
        Icon={typeIcon(quest.type)}
        color={colors.zinc[600]}
        size={18}
        strokeWidth={1.5}
      />
    </View>
    <View className="flex-1 pr-2">
      <Text className="font-product text-sm text-zinc-800" numberOfLines={1}>
        {quest.title}
      </Text>
      <Text
        className="mt-0.5 font-sans text-xs text-zinc-400"
        numberOfLines={1}
      >
        {quest.type === 'read_blog'
          ? 'Read the document to complete'
          : `${quest.questions.length} questions`}
      </Text>
    </View>
    {quest.completed ? (
      <View className="rounded-full bg-green-100 p-1">
        <AppIcon
          Icon={Check}
          size={13}
          strokeWidth={2.5}
          color={colors.green[600]}
        />
      </View>
    ) : (
      <GemsPill gems={quest.gems} />
    )}
  </TouchableOpacity>
);

/**
 * Inline answer form for mcq, scq and fill_blank quests. Options render as
 * selectable rows, fill blanks as text inputs; submission is graded server
 * side, so the form never sees the answers.
 */
const QuestRunner = ({
  quest,
  onDone,
  onBack,
}: {
  quest: QuestSummary;
  onDone: (passed: boolean, gemsAwarded: number) => void;
  onBack: () => void;
}) => {
  const { getToken } = useAuth();
  const [responses, setResponses] = useState<Record<string, string | number>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<{
    passed: boolean;
    gemsAwarded: number;
  } | null>(null);

  const submit = async () => {
    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) throw new Error('Authentication required. Please sign in.');

      const result = await completeQuest(token, quest.id, { responses });
      if (result.alreadyCompleted) {
        onDone(true, 0);
        return;
      }
      setOutcome({
        passed: result.passed ?? false,
        gemsAwarded: result.gemsAwarded ?? 0,
      });
      if (result.passed) onDone(true, result.gemsAwarded ?? 0);
    } catch (err) {
      logger.error(`Quest submission failed: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (outcome) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-product text-2xl text-zinc-900">
          {outcome.passed ? 'Quest Complete' : 'Not Quite'}
        </Text>
        <Text className="mt-2 text-center font-sans text-sm text-zinc-500">
          {outcome.passed
            ? `You earned ${outcome.gemsAwarded} gems.`
            : 'Your score was below the pass mark. Try again later.'}
        </Text>
        <TouchableOpacity
          onPress={onBack}
          className="mt-6 rounded-xl bg-zinc-900 px-6 py-3 active:bg-zinc-700"
          activeOpacity={0.8}
        >
          <Text className="font-product text-sm text-white">
            Back to Quests
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
      <View className="mb-4 flex-row items-center gap-2">
        <GemsPill gems={quest.gems} />
        <Text className="font-sans text-xs text-zinc-400">
          Pass mark: {quest.passScore}/{quest.questions.length}
        </Text>
      </View>

      {quest.questions.map((question, index) => (
        <View
          key={question.key}
          className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4"
        >
          <Text className="mb-1 font-sans text-xs uppercase tracking-wide text-zinc-400">
            Question {String(index + 1).padStart(2, '0')}
          </Text>
          <Text className="font-sans text-base text-zinc-800">
            {question.que}
          </Text>

          {question.options ? (
            <View className="mt-3">
              {question.options.map((option, optionIndex) => {
                const selected = responses[question.key] === optionIndex;
                return (
                  <TouchableOpacity
                    key={optionIndex}
                    onPress={() =>
                      setResponses(prev => ({
                        ...prev,
                        [question.key]: optionIndex,
                      }))
                    }
                    className={`mb-2 flex-row items-center rounded-xl border p-3 ${
                      selected
                        ? 'border-zinc-700 bg-zinc-50'
                        : 'border-zinc-200 bg-white'
                    }`}
                    activeOpacity={0.7}
                  >
                    <View
                      className={`mr-3 h-4 w-4 items-center justify-center rounded-full border-2 ${
                        selected ? 'border-zinc-700' : 'border-zinc-300'
                      }`}
                    >
                      {selected && (
                        <View className="h-2 w-2 rounded-full bg-zinc-700" />
                      )}
                    </View>
                    <Text className="flex-1 font-sans text-sm text-zinc-800">
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TextInput
              value={(responses[question.key] as string) ?? ''}
              onChangeText={text =>
                setResponses(prev => ({ ...prev, [question.key]: text }))
              }
              placeholder="Type your answer"
              placeholderTextColor={colors.zinc[400]}
              className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-sans text-sm text-zinc-800"
            />
          )}
        </View>
      ))}

      <View className="mb-10 flex-row gap-3">
        <TouchableOpacity
          onPress={onBack}
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-6 py-3 active:bg-zinc-50"
          activeOpacity={0.7}
        >
          <Text className="text-center font-product text-sm text-zinc-600">
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => void submit()}
          disabled={submitting}
          className="flex-1 rounded-xl bg-blue-500 px-6 py-3 active:bg-blue-600"
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-center font-product text-sm text-white">
              Submit
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default function QuestsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const getTokenRef = useRef(getToken);

  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQuest, setActiveQuest] = useState<QuestSummary | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const inFlight = useRef(false);

  const fetchQuests = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setError(null);

      const token = await getTokenRef.current();
      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      setQuests(await getQuests(token));
      logger.success('Quests loaded');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load quests';
      setError(message);
      logger.error(`Error loading quests: ${message}`);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  // Refetch on every focus: returning from a read_blog document means the
  // quest may have been completed while the user was reading.
  useFocusEffect(
    useCallback(() => {
      void fetchQuests();
      return undefined;
    }, [fetchQuests])
  );

  const available = quests.filter(quest => !quest.completed);
  const completed = quests.filter(quest => quest.completed);
  const earnedGems = completed.reduce((total, quest) => total + quest.gems, 0);
  const remainingGems = available.reduce(
    (total, quest) => total + quest.gems,
    0
  );

  const openQuest = (quest: QuestSummary) => {
    if (quest.completed) {
      showAlert('Already Completed', 'You have finished this quest.', [
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }
    if (quest.type === 'read_blog' && quest.contentId) {
      // Reading the linked document IS the quest: the detail screen claims
      // it once the reader reaches the end, via the questId param.
      router.push({
        pathname: '/screens/[id]',
        params: { id: quest.contentId, questId: quest.id },
      });
      return;
    }
    setActiveQuest(quest);
  };

  const headerRight = (
    <TouchableOpacity
      onPress={() => router.push('/screens/achievements')}
      className="flex-row items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 active:bg-zinc-200"
      activeOpacity={0.7}
    >
      <Text className="font-product text-xs text-zinc-700">Achievements</Text>
      <ArrowUpRight size={13} color={colors.zinc[600]} />
    </TouchableOpacity>
  );

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
              Quests
            </Text>
            {headerRight}
          </View>

          {activeQuest ? (
            <QuestRunner
              quest={activeQuest}
              onDone={() => {
                setActiveQuest(null);
                void fetchQuests();
              }}
              onBack={() => setActiveQuest(null)}
            />
          ) : (
            <ScrollView
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <>
                  {/* Gems summary skeleton */}
                  <View className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="h-11 w-11 rounded-2xl bg-zinc-100" />
                        <View>
                          <View className="mb-1.5 h-3 w-16 rounded bg-zinc-100" />
                          <View className="h-7 w-12 rounded bg-zinc-200" />
                        </View>
                      </View>
                      <View className="items-end gap-2">
                        <View className="h-5 w-16 rounded-full bg-zinc-100" />
                        <View className="h-3 w-24 rounded bg-zinc-100" />
                      </View>
                    </View>
                    <View className="mt-4 h-1.5 w-full rounded-full bg-zinc-100" />
                  </View>

                  {/* Quest row skeletons */}
                  {[1, 2, 3].map(index => (
                    <View
                      key={index}
                      className="mb-2.5 flex-row items-center rounded-xl border border-zinc-200 bg-white px-4 py-3.5"
                    >
                      <View className="mr-3 h-10 w-10 rounded-xl bg-zinc-100" />
                      <View className="flex-1">
                        <View className="mb-2 h-4 w-2/3 rounded bg-zinc-100" />
                        <View className="h-3 w-1/2 rounded bg-zinc-100" />
                      </View>
                      <View className="h-6 w-14 rounded-full bg-zinc-100" />
                    </View>
                  ))}
                </>
              ) : error ? (
                <View className="rounded-2xl border border-red-200 bg-red-50 p-6">
                  <Text className="font-product text-base text-red-800">
                    Error Loading Quests
                  </Text>
                  <Text className="mt-2 font-sans text-sm text-red-600">
                    {error}
                  </Text>
                  <TouchableOpacity
                    onPress={fetchQuests}
                    className="mt-4 self-start rounded-xl bg-red-600 px-4 py-2 active:bg-red-700"
                    activeOpacity={0.8}
                  >
                    <Text className="font-sans text-sm text-white">
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <GemsSummaryCard
                    earned={earnedGems}
                    done={completed.length}
                    total={quests.length}
                    remaining={remainingGems}
                  />

                  {/* Available quests */}
                  <Text className="mb-2 font-sans text-xs uppercase tracking-widest text-zinc-400">
                    Available
                  </Text>
                  {available.length > 0 ? (
                    available.map(quest => (
                      <QuestRow
                        key={quest.id}
                        quest={quest}
                        onPress={() => openQuest(quest)}
                      />
                    ))
                  ) : (
                    <Text className="mb-4 font-sans text-sm text-zinc-400">
                      Nothing available right now. Check back soon.
                    </Text>
                  )}

                  {/* Completed quests */}
                  {completed.length > 0 && (
                    <>
                      <Text className="mb-2 mt-4 font-sans text-xs uppercase tracking-widest text-zinc-400">
                        Completed
                      </Text>
                      {completed.map(quest => (
                        <QuestRow
                          key={quest.id}
                          quest={quest}
                          onPress={() => openQuest(quest)}
                        />
                      ))}
                    </>
                  )}
                  <View className="h-8" />
                </>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </>
  );
}
