import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../store/hooks';
import notificationService from '../../services/notificationService';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { HomeStackParamList } from '../../navigation/MainNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'NotificationPermission'>;

const BENEFITS = [
  {
    icon: 'DollarSign',
    title: 'Contribution Reminders',
    description: 'Never miss a due contribution payment',
  },
  {
    icon: 'CreditCard',
    title: 'Loan Updates',
    description: 'Stay informed on loan approvals and repayments',
  },
  {
    icon: 'Users',
    title: 'Member Activity',
    description: 'Know when members join or important changes occur',
  },
  {
    icon: 'Megaphone',
    title: 'Announcements',
    description: 'Be the first to hear important cooperative news',
  },
];

const NotificationPermissionScreen: React.FC<Props> = ({ navigation }) => {
  const { permissionStatus } = useAppSelector((state) => state.notification);
  const [isRequesting, setIsRequesting] = useState(false);

  const isDenied = permissionStatus === 'denied';

  const handleAllow = async () => {
    if (isDenied) {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
      return;
    }

    setIsRequesting(true);
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        navigation.goBack();
      } else {
        // Permission denied after asking — the state is now 'denied'
        // UI will react to permissionStatus change automatically
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Icon name="Bell" size={52} color={colors.primary.main} />
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Stay in the Loop</Text>
        <Text style={styles.subtitle}>
          Enable notifications to get real-time updates about your cooperative activities.
        </Text>

        {/* Benefits list */}
        <View style={styles.benefitsCard}>
          {BENEFITS.map((item, index) => (
            <View key={item.icon}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Icon name={item.icon} size={20} color={colors.primary.main} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{item.title}</Text>
                  <Text style={styles.benefitDescription}>{item.description}</Text>
                </View>
              </View>
              {index < BENEFITS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {isDenied && (
          <View style={styles.deniedBanner}>
            <Icon name="AlertTriangle" size={16} color={colors.warning.dark} />
            <Text style={styles.deniedText}>
              Notifications are currently blocked. Tap below to open device settings and enable
              them.
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, isRequesting && styles.primaryButtonDisabled]}
          onPress={handleAllow}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <ActivityIndicator color={colors.primary.contrast} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isDenied ? 'Open Settings' : 'Allow Notifications'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
          <Text style={styles.secondaryButtonText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primary.light + '25',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary.light,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  benefitDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.md + 40 + spacing.md,
  },
  deniedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning.light + '30',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning.main,
    gap: spacing.sm,
  },
  deniedText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning.dark,
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...shadows.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default NotificationPermissionScreen;
