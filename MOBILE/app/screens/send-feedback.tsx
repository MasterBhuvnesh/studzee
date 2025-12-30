import { AppIcon } from '@/components/global/AppIcon';
import { CustomAlert } from '@/components/global/CustomAlert';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MessageCircle, Send, Star } from 'lucide-react-native';
import { useState } from 'react';
import {
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RatingButton = ({
  rating,
  selected,
  onPress,
}: {
  rating: number;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`mx-1 rounded-full p-2 ${selected ? 'bg-yellow-100' : 'bg-zinc-100'}`}
    activeOpacity={0.7}
  >
    <Star
      size={28}
      color={selected ? colors.yellow[500] : colors.zinc[300]}
      fill={selected ? colors.yellow[500] : 'transparent'}
    />
  </TouchableOpacity>
);

export default function SendFeedbackScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<string | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[];
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (
    title: string,
    message: string,
    buttons: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[]
  ) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const hideAlert = () => {
    setAlertConfig({ visible: false, title: '', message: '', buttons: [] });
  };

  const categories = [
    { id: 'bug', label: 'Bug Report' },
    { id: 'feature', label: 'Feature Request' },
    { id: 'content', label: 'Content Issue' },
    { id: 'other', label: 'Other' },
  ];

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      showAlert(
        'Missing Feedback',
        'Please enter your feedback before submitting.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    const subject = `Studzee Feedback${category ? ` - ${category}` : ''}`;
    const body = `Rating: ${rating}/5\nCategory: ${category || 'Not specified'}\n\nFeedback:\n${feedback}\n\n---\nUser: ${user?.emailAddresses[0]?.emailAddress || 'Anonymous'}`;

    Linking.openURL(
      `mailto:feedback@studzee.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );

    showAlert('Thank You!', 'Your feedback helps us improve Studzee.', [
      {
        text: 'Done',
        style: 'default',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <>
      <LinearGradient
        colors={[colors.zinc[50], colors.zinc[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <Header title="Send Feedback" />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              className="flex-1 px-6 pt-6"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Intro */}
              <View className="mb-6 items-center">
                <View className="mb-3 rounded-full bg-blue-100 p-4">
                  <AppIcon
                    Icon={MessageCircle}
                    size={24}
                    color={colors.blue[500]}
                    strokeWidth={1.5}
                  />
                </View>
                <Text className="text-center font-sans text-sm text-zinc-600">
                  We'd love to hear from you! Your feedback helps us make
                  Studzee better for everyone.
                </Text>
              </View>

              {/* Rating */}
              <Text className="mb-3 font-product text-base text-zinc-800">
                How would you rate your experience?
              </Text>
              <View className="mb-6 flex-row justify-center">
                {[1, 2, 3, 4, 5].map(r => (
                  <RatingButton
                    key={r}
                    rating={r}
                    selected={r <= rating}
                    onPress={() => setRating(r)}
                  />
                ))}
              </View>

              {/* Category */}
              <Text className="mb-3 font-product text-base text-zinc-800">
                What's this about?
              </Text>
              <View className="mb-6 flex-row flex-wrap gap-2">
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    className={`rounded-full px-4 py-2 ${
                      category === cat.id
                        ? 'bg-zinc-800'
                        : 'border border-zinc-200 bg-white'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-sans text-sm ${
                        category === cat.id ? 'text-white' : 'text-zinc-700'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback Input */}
              <Text className="mb-3 font-product text-base text-zinc-800">
                Your Feedback
              </Text>
              <TextInput
                className="mb-6 min-h-[150px] rounded-xl border border-zinc-200 bg-white p-4 font-sans text-base text-zinc-800"
                placeholder="Tell us what's on your mind..."
                placeholderTextColor={colors.zinc[400]}
                multiline
                textAlignVertical="top"
                value={feedback}
                onChangeText={setFeedback}
              />

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmitFeedback}
                className="mb-8 flex-row items-center justify-center rounded-xl bg-zinc-800 px-6 py-4 shadow-lg active:bg-zinc-700"
              >
                <Send size={18} color="white" />
                <Text className="ml-2 font-product text-base text-white">
                  Submit Feedback
                </Text>
              </Pressable>
            </ScrollView>
          </TouchableWithoutFeedback>
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
