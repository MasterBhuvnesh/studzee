import { CustomAlert } from '@/components/global/CustomAlert';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditBioScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [bioText, setBioText] = useState(
    (user?.unsafeMetadata?.bio as string) || ''
  );
  const [isLoading, setIsLoading] = useState(false);

  // Alert state
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

  const handleSaveBio = async () => {
    if (!user) {
      showAlert('Error', 'User not loaded. Please try again.', [
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }

    setIsLoading(true);

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          bio: bioText.trim(),
        },
      });

      showAlert('Success', 'Bio updated successfully!', [
        {
          text: 'OK',
          style: 'default',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating bio:', error);
      showAlert(
        'Error',
        error.errors?.[0]?.message || 'Failed to update bio. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setIsLoading(false);
    }
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
          <Header title="Edit Bio" />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              className="flex-1 px-6 pt-6"
              keyboardShouldPersistTaps="handled"
            >
              <View className="mb-4">
                <Text className="mb-2 font-product text-sm text-zinc-600">
                  Bio
                </Text>
                <TextInput
                  className="min-h-[150px] rounded-xl border border-zinc-200 bg-white p-4 font-sans text-base text-zinc-800"
                  placeholder="Write something about yourself..."
                  placeholderTextColor={colors.zinc[400]}
                  multiline
                  textAlignVertical="top"
                  value={bioText}
                  onChangeText={setBioText}
                  maxLength={150}
                  editable={!isLoading}
                />
                <Text className="mt-2 text-right font-sans text-sm text-zinc-400">
                  {bioText.length}/150
                </Text>
              </View>

              {/* Save Button */}
              <Pressable
                onPress={handleSaveBio}
                disabled={isLoading}
                className="w-full rounded-xl bg-zinc-800 px-6 py-4 shadow-lg active:bg-zinc-700 disabled:opacity-50"
              >
                <Text className="text-center font-product text-base text-white">
                  {isLoading ? 'Saving...' : 'Save Bio'}
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* Custom Alert */}
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
