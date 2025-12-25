import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { Quiz, QuizQuestion } from '@/types';
import logger from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, X as XIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============ TYPES ============

interface QuizQuestionWithId extends QuizQuestion {
  id: string;
  shuffledOptions: string[];
}

interface UserAnswer {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
}

// ============ HELPER FUNCTIONS ============

/**
 * Fisher-Yates shuffle algorithm for randomizing arrays
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Convert Quiz object to array and randomize questions and options
 */
const prepareQuizQuestions = (quiz: Quiz): QuizQuestionWithId[] => {
  const questions = Object.entries(quiz).map(([id, question]) => ({
    id,
    ...question,
    shuffledOptions: shuffleArray(question.options),
  }));
  return shuffleArray(questions);
};

// ============ COMPONENTS ============

/**
 * Progress bar component showing current question progress
 */
const ProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  return (
    <View className="flex-row gap-1">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`h-1 flex-1 rounded-full ${
            index < current ? 'bg-zinc-700' : 'bg-zinc-200'
          }`}
        />
      ))}
    </View>
  );
};

/**
 * Radio button option component
 */
const RadioOption = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mb-3 flex-row items-center rounded-xl border p-4 ${
        selected
          ? 'border-zinc-700 bg-zinc-50'
          : 'border-zinc-200 bg-white'
      }`}
      activeOpacity={0.7}
    >
      <View
        className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-zinc-700' : 'border-zinc-300'
        }`}
      >
        {selected && <View className="h-2.5 w-2.5 rounded-full bg-zinc-700" />}
      </View>
      <Text className="flex-1 font-sans text-base text-zinc-800">{label}</Text>
    </TouchableOpacity>
  );
};

// ============ MAIN COMPONENT ============

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    quiz: string;
    contentTitle: string;
    contentId: string;
  }>();

  const [questions, setQuestions] = useState<QuizQuestionWithId[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(
    new Map()
  );
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<UserAnswer[]>([]);

  // Initialize quiz questions
  useEffect(() => {
    try {
      const quizData: Quiz = JSON.parse(params.quiz);
      const preparedQuestions = prepareQuizQuestions(quizData);
      setQuestions(preparedQuestions);
      logger.info(`Quiz loaded with ${preparedQuestions.length} questions`);
    } catch (error) {
      logger.error(`Failed to parse quiz data: ${error}`);
      router.back();
    }
  }, [params.quiz]);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = userAnswers.get(currentQuestion?.id);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestion.id, option);
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate results
      const finalResults: UserAnswer[] = questions.map((q) => {
        const selected = userAnswers.get(q.id) || '';
        return {
          questionId: q.id,
          selectedOption: selected,
          isCorrect: selected === q.ans,
        };
      });
      setResults(finalResults);
      setShowResults(true);
      logger.info('Quiz completed');
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (questions.length === 0) {
    return null;
  }

  // ============ RESULTS SCREEN ============
  if (showResults) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = results.length;

    return (
      <LinearGradient
        colors={[colors.zinc[50], colors.zinc[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 mb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
            <Text className="font-product text-xl text-zinc-800">
              Quiz Results
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className="rounded-full p-2 active:bg-zinc-200"
              activeOpacity={0.7}
            >
              <AppIcon
                Icon={XIcon}
                color={colors.zinc[700]}
                size={20}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {/* Score Card */}
            <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <Text className="mb-2 text-center font-product text-2xl text-zinc-800">
                Your Score
              </Text>
              <Text className="text-center font-product text-4xl text-zinc-900">
                {correctCount}/{totalCount}
              </Text>
              <Text className="mt-2 text-center font-sans text-sm text-zinc-500">
                {Math.round((correctCount / totalCount) * 100)}% Correct
              </Text>
            </View>

            {/* Answer Review */}
            <Text className="mb-3 font-product text-lg text-zinc-800">
              Answer Review
            </Text>
            {questions.map((question, index) => {
              const result = results[index];
              const isCorrect = result.isCorrect;

              return (
                <View
                  key={question.id}
                  className="mb-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4"
                >
                  {/* Question Header */}
                  <View className="mb-3 flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="mb-1 font-sans text-xs uppercase tracking-wide text-zinc-400">
                        Question {String(index + 1).padStart(2, '0')}
                      </Text>
                      <Text className="font-sans text-base text-zinc-800">
                        {question.que}
                      </Text>
                    </View>
                    <View
                      className={`ml-2 rounded-full p-1.5 ${
                        isCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {isCorrect ? (
                        <Check size={16} color={colors.green[500]} strokeWidth={2} />
                      ) : (
                        <XIcon size={16} color={colors.red[500]} strokeWidth={2} />
                      )}
                    </View>
                  </View>

                  {/* Answers */}
                  <View className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
  <View>
    <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-zinc-400">
      Your answer
    </Text>
    <Text
      className={`font-sans pb-4 text-base font-semibold ${
        isCorrect ? 'text-green-500' : 'text-red-500'
      }`}
    >
      {result.selectedOption || 'Not answered'}
    </Text>
  </View>
  {!isCorrect && (
    <View className="border-t border-zinc-200 pt-3">
      <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Correct answer
      </Text>
      <Text className="font-sans text-base font-semibold text-green-500">
        {question.ans}
      </Text>
    </View>
  )}
</View>
                </View>
              );
            })}

         
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============ QUIZ SCREEN ============
  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header with Close Button */}
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <View className="flex-1">
            <ProgressBar
              current={currentQuestionIndex + 1}
              total={questions.length}
            />
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="ml-4 rounded-full p-2 active:bg-zinc-200"
            activeOpacity={0.7}
          >
            <AppIcon
              Icon={XIcon}
              color={colors.zinc[700]}
              size={20}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Quiz Card */}
        <View className="flex-1 px-6">
          <View className="flex-1  mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {/* Question Number */}
              <Text className="mb-2 font-sans text-xs font-medium uppercase tracking-wide text-zinc-400">
                Question {String(currentQuestionIndex + 1).padStart(2, '0')}
              </Text>

              {/* Question Text */}
              <Text className="mb-6 font-product text-xl text-zinc-800">
                {currentQuestion.que}
              </Text>

              {/* Options Label */}
              <Text className="mb-3 font-sans text-xs uppercase tracking-wide text-zinc-400">
                Select only one
              </Text>

              {/* Options */}
              {currentQuestion.shuffledOptions.map((option, index) => (
                <RadioOption
                  key={index}
                  label={option}
                  selected={selectedAnswer === option}
                  onPress={() => handleSelectOption(option)}
                />
              ))}
            </ScrollView>

            {/* Navigation Buttons */}
            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={handleBack}
                disabled={currentQuestionIndex === 0}
                className={`flex-1 rounded-xl border px-6 py-3 ${
                  currentQuestionIndex === 0
                    ? 'border-zinc-200 bg-zinc-100'
                    : 'border-zinc-400 bg-white active:bg-zinc-50'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-center font-product text-base ${
                    currentQuestionIndex === 0 ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                className="flex-1 rounded-xl bg-blue-500 px-6 py-3 active:bg-blue-600"
                activeOpacity={0.8}
              >
                <Text className="text-center font-product text-base text-white">
                  {isLastQuestion ? 'Finish' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
