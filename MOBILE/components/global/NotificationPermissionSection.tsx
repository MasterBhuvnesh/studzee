import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { useNotification } from '@/contexts/NotificationContext';
import { Bell, BellOff, RefreshCw } from 'lucide-react-native';

export const NotificationPermissionSection: React.FC = () => {
  const {
    permissionGranted,
    permissionLoading,
    requestPermission,
    checkPermissionStatus,
  } = useNotification();

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const getStatusMessage = () => {
    if (permissionLoading) return 'Checking permission status...';
    if (permissionGranted) return 'Notifications are enabled';
    return 'Notifications are disabled';
  };

  const getStatusColor = () => {
    if (permissionLoading) return colors.zinc[400];
    if (permissionGranted) return colors.blue[600];
    return colors.red[600];
  };

  const handleToggleChange = async (value: boolean) => {
    if (value) {
      // User wants to enable notifications
      const granted = await requestPermission();

      // If permission wasn't granted (denied status), show settings dialog
      if (!granted) {
        setShowSettingsDialog(true);
      }
    } else {
      // User wants to disable notifications - show settings dialog
      setShowSettingsDialog(true);
    }
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(false);
    setTimeout(() => {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    }, 300);
  };

  return (
    <View className="p-4">
      {/* Header */}
      <View className="mb-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className="items-center justify-center rounded-full p-3"
            style={{
              backgroundColor: permissionGranted
                ? colors.blue[100]
                : colors.zinc[100],
            }}
          >
            <AppIcon
              Icon={permissionGranted ? Bell : BellOff}
              size={20}
              strokeWidth={1.5}
              color={permissionGranted ? colors.blue[500] : colors.zinc[500]}
            />
          </View>
          <View>
            <Text className="font-product text-lg text-zinc-800">
              App Notifications
            </Text>
            <Text
              className="font-sans text-sm"
              style={{ color: getStatusColor() }}
            >
              {getStatusMessage()}
            </Text>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={checkPermissionStatus}
          disabled={permissionLoading}
          className="rounded-lg p-2 active:bg-zinc-100"
          activeOpacity={0.7}
        >
          <AppIcon
            Icon={RefreshCw}
            size={20}
            strokeWidth={1.5}
            color={colors.zinc[500]}
          />
        </TouchableOpacity>
      </View>

      {/* Toggle Control */}
      <View className="flex-row items-center justify-between rounded-xl border border-zinc-200 bg-white p-4">
        <View className="flex-1">
          <Text className="font-product text-base text-zinc-800">
            Push Notifications
          </Text>
          <Text className="font-sans text-sm text-zinc-500">
            {permissionGranted ? 'Enabled' : 'Disabled'}
          </Text>
        </View>

        {permissionLoading ? (
          <ActivityIndicator color={colors.blue[600]} size="small" />
        ) : (
          <Switch
            value={permissionGranted}
            onValueChange={handleToggleChange}
            trackColor={{ false: colors.zinc[300], true: colors.blue[400] }}
            thumbColor={permissionGranted ? colors.blue[600] : colors.zinc[50]}
            ios_backgroundColor={colors.zinc[300]}
          />
        )}
      </View>

      {/* Custom Settings Dialog */}
      <Modal
        visible={showSettingsDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsDialog(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setShowSettingsDialog(false)}
        >
          <Pressable
            className="mx-6 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onPress={e => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <View className="items-center border-b border-zinc-200 bg-zinc-50 px-6 py-6">
              <View className="mb-3 rounded-full bg-red-100 p-4">
                <AppIcon
                  Icon={BellOff}
                  size={32}
                  strokeWidth={1.5}
                  color={colors.red[500]}
                />
              </View>
              <Text className="font-product text-xl text-zinc-800">
                {permissionGranted
                  ? 'Disable Notifications'
                  : 'Enable Notifications'}
              </Text>
            </View>

            {/* Dialog Content */}
            <View className="px-6 py-6">
              <Text className="text-center font-sans text-base leading-6 text-zinc-500">
                {permissionGranted
                  ? 'To disable notifications, you need to change the permission in your device settings.'
                  : 'To enable notifications, you need to allow permissions in your device settings.'}
              </Text>
            </View>

            {/* Dialog Actions */}
            <View className="flex-row gap-3 p-4">
              <TouchableOpacity
                onPress={() => setShowSettingsDialog(false)}
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-3"
                activeOpacity={0.7}
              >
                <Text className="text-center font-product text-base text-zinc-700">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenSettings}
                className="flex-1 rounded-xl py-3"
                style={{ backgroundColor: colors.blue[500] }}
                activeOpacity={0.8}
              >
                <Text className="text-center font-product text-base text-white">
                  Open Settings
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
