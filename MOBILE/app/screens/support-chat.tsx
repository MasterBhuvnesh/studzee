import { AppIcon } from '@/components/global/AppIcon';
import { CustomAlert } from '@/components/global/CustomAlert';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { askSupport, ApiError } from '@/lib/api';
import type { SupportSource, SupportTurn } from '@/types/api';
import { useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bot, ChevronRight, Send, Sparkles } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * SUPPORT CHAT
 *
 * The assistant answers from the app's own help material and nothing else. It
 * cannot see the signed in account, which is why nothing here sends progress,
 * email or any other user data: the question and the recent turns are the
 * whole request.
 *
 * The thread lives in screen state only. Leaving the screen ends it, on
 * purpose, because no transcript is stored on the device or the server.
 */

/** One rendered turn. Sources hang off an assistant turn when it cited any. */
interface Message extends SupportTurn {
  id: string;
  sources?: SupportSource[];
}

const OPENERS = [
  'How do I earn gems?',
  'Why did my streak reset?',
  'Can I read PDFs offline?',
];

const GREETING =
  'Ask me about levels, streaks, quests, downloads or anything else in the ' +
  'app. I answer from the Studzee help material, so if I do not have ' +
  'something I will say so rather than guess.';

const Bubble = ({ message }: { message: Message }) => {
  const router = useRouter();
  const mine = message.role === 'user';

  return (
    <View className={`mb-3 w-full ${mine ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          mine ? 'bg-zinc-800' : 'border border-zinc-200 bg-white shadow-sm'
        }`}
      >
        <Text
          className={`font-sans text-sm leading-relaxed ${
            mine ? 'text-zinc-50' : 'text-zinc-700'
          }`}
        >
          {message.content}
        </Text>
      </View>

      {/*
        Only passages that came from study material carry a contentId, so only
        those become tappable. A help text passage has nowhere to go.
      */}
      {message.sources
        ?.filter(source => source.contentId)
        .map(source => (
          <TouchableOpacity
            key={source.contentId}
            onPress={() =>
              router.push({
                pathname: '/screens/[id]',
                params: { id: source.contentId as string },
              })
            }
            className="mt-2 flex-row items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2"
            activeOpacity={0.7}
          >
            <Text className="mr-1 font-sans text-xs text-zinc-500">
              {source.heading}
            </Text>
            <AppIcon
              Icon={ChevronRight}
              size={14}
              color={colors.zinc[400]}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}
    </View>
  );
};

export default function SupportChatScreen() {
  const { getToken } = useAuth();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (question === '' || sending) return;

      // The history sent is the thread as it stood before this question, so
      // the current turn is not duplicated into it.
      const history: SupportTurn[] = messages.map(({ role, content }) => ({
        role,
        content,
      }));

      setMessages(previous => [
        ...previous,
        { id: `u${Date.now()}`, role: 'user', content: question },
      ]);
      setDraft('');
      setSending(true);

      try {
        const token = await getToken();
        if (!token) {
          throw new ApiError('Authentication required. Please sign in.', 401);
        }

        const result = await askSupport(token, question, history);

        setMessages(previous => [
          ...previous,
          {
            id: `a${Date.now()}`,
            role: 'assistant',
            content: result.answer,
            sources: result.sources,
          },
        ]);
      } catch (error) {
        // The backend writes the daily allowance message itself, so it is
        // shown as sent rather than replaced with a generic failure.
        const message =
          error instanceof ApiError
            ? error.message
            : 'Could not reach support right now. Please try again.';
        showAlert('Support unavailable', message);

        // The question is put back in the box so it is not lost to a failure.
        setMessages(previous => previous.slice(0, -1));
        setDraft(question);
      } finally {
        setSending(false);
      }
    },
    [getToken, messages, sending, showAlert]
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
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <Header title="Support" />

            <ScrollView
              ref={scrollRef}
              className="flex-1 px-6"
              contentContainerStyle={{ paddingBottom: 16 }}
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
              keyboardShouldPersistTaps="handled"
            >
              <View className="mb-4 flex-row items-start rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <View className="mr-3 rounded-full bg-zinc-100 p-2">
                  <AppIcon
                    Icon={Bot}
                    size={18}
                    color={colors.zinc[700]}
                    strokeWidth={1.5}
                  />
                </View>
                <Text className="flex-1 font-sans text-sm leading-relaxed text-zinc-500">
                  {GREETING}
                </Text>
              </View>

              {messages.length === 0 && (
                <View className="mb-4">
                  <View className="mb-2 flex-row items-center">
                    <AppIcon
                      Icon={Sparkles}
                      size={14}
                      color={colors.zinc[400]}
                      strokeWidth={1.5}
                    />
                    <Text className="ml-2 font-sans text-xs uppercase text-zinc-400">
                      Try asking
                    </Text>
                  </View>
                  {OPENERS.map(opener => (
                    <TouchableOpacity
                      key={opener}
                      onPress={() => send(opener)}
                      className="mb-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm active:bg-zinc-50"
                      activeOpacity={0.7}
                    >
                      <Text className="font-sans text-sm text-zinc-600">
                        {opener}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {messages.map(message => (
                <Bubble key={message.id} message={message} />
              ))}

              {sending && (
                <View className="mb-3 flex-row items-center self-start rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                  <ActivityIndicator size="small" color={colors.zinc[400]} />
                  <Text className="ml-2 font-sans text-sm text-zinc-400">
                    Thinking
                  </Text>
                </View>
              )}
            </ScrollView>

            <View className="flex-row items-end border-t border-zinc-200 bg-white px-4 py-3">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask a question"
                placeholderTextColor={colors.zinc[400]}
                multiline
                maxLength={1000}
                editable={!sending}
                className="mr-3 max-h-28 flex-1 rounded-xl bg-zinc-100 px-4 py-3 font-sans text-sm text-zinc-800"
                onSubmitEditing={() => send(draft)}
              />
              <Pressable
                onPress={() => send(draft)}
                disabled={sending || draft.trim() === ''}
                className={`rounded-full p-3 ${
                  sending || draft.trim() === ''
                    ? 'bg-zinc-200'
                    : 'bg-zinc-800 active:bg-zinc-700'
                }`}
              >
                <AppIcon
                  Icon={Send}
                  size={18}
                  color={
                    sending || draft.trim() === ''
                      ? colors.zinc[400]
                      : colors.zinc[50]
                  }
                  strokeWidth={1.5}
                />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
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
