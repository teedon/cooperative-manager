import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../store/slices/notificationSlice';
import { NotificationPreferences } from '../../models';
import notificationService from '../../services/notificationService';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { HomeStackParamList } from '../../navigation/MainNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'NotificationSettings'>;

interface PreferenceSetting {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: string;
}

const preferenceSettings: PreferenceSetting[] = [
  {
    key: 'pushEnabled',
    title: 'Push Notifications',
    description: 'Receive push notifications on your device',
    icon: 'Bell',
  },
  {
    key: 'contributionReminders',
    title: 'Contribution Reminders',
    description: 'Reminders for upcoming and due contributions',
    icon: 'DollarSign',
  },
  {
    key: 'loanUpdates',
    title: 'Loan Updates',
    description: 'Updates on loan requests, approvals, and repayments',
    icon: 'CreditCard',
  },
  {
    key: 'groupBuyUpdates',
    title: 'Group Buy Updates',
    description: 'Notifications for group buy activities',
    icon: 'ShoppingCart',
  },
  {
    key: 'memberUpdates',
    title: 'Member Updates',
    description: 'When members join, leave, or change roles',
    icon: 'Users',
  },
  {
    key: 'announcements',
    title: 'Announcements',
    description: 'Important announcements from cooperatives',
    icon: 'Megaphone',
  },
  {
    key: 'mentions',
    title: 'Mentions',
    description: 'When someone mentions you in a message',
    icon: 'AtSign',
  },
];

const NotificationSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { permissionStatus } = useAppSelector((state) => state.notification);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: true,
    contributionReminders: true,
    loanUpdates: true,
    groupBuyUpdates: true,
    memberUpdates: true,
    announcements: true,
    mentions: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPermissionStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      const result = await dispatch(fetchNotificationPreferences()).unwrap();
      setPreferences(result);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermissionStatus = async () => {
    await notificationService.checkPermissionStatus();
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    // Handle push enabled toggle specially
    if (key === 'pushEnabled' && value && permissionStatus !== 'granted') {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive push notifications.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }
    }

    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    setIsSaving(true);
    try {
      await dispatch(updateNotificationPreferences({ [key]: value })).unwrap();
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPermissionBanner = () => {
    if (permissionStatus === 'granted') return null;

    return (
      <TouchableOpacity
        style={styles.permissionBanner}
        onPress={async () => {
          const granted = await notificationService.requestPermission();
          if (!granted) {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        }}
      >
        <Icon name="AlertTriangle" size={20} color={colors.warning.dark} />
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Notifications Disabled</Text>
          <Text style={styles.permissionText}>
            Tap here to enable notifications in your device settings
          </Text>
        </View>
        <Icon name="ChevronRight" size={20} color={colors.warning.dark} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {renderPermissionBanner()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <Text style={styles.sectionDescription}>
            Choose which notifications you want to receive
          </Text>
        </View>

        <View style={styles.settingsCard}>
          {preferenceSettings.map((setting, index) => (
            <View key={setting.key}>
              <View style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Icon name={setting.icon} size={20} color={colors.primary.main} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                <Switch
                  value={preferences[setting.key]}
                  onValueChange={(value) => handleToggle(setting.key, value)}
                  trackColor={{ false: colors.border.light, true: colors.primary.light }}
                  thumbColor={preferences[setting.key] ? colors.primary.main : colors.text.disabled}
                  disabled={setting.key !== 'pushEnabled' && !preferences.pushEnabled}
                />
              </View>
              {index < preferenceSettings.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Icon name="Info" size={16} color={colors.text.secondary} />
          <Text style={styles.infoText}>
            Push notifications require system permission. Individual notification types will only
            work when push notifications are enabled.
          </Text>
        </View>

        {isSaving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.light + '30',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  permissionContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning.dark,
  },
  permissionText: {
    fontSize: 12,
    color: colors.warning.dark,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  settingsCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.md + 40 + spacing.md,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  savingText: {
    fontSize: 14,
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
});

export default NotificationSettingsScreen;
