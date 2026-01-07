import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteAccount } from '../../store/slices/authSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'PrivacySecurity'>;

const PrivacySecurityScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Error', 'Please enter your password to confirm');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'Are you absolutely sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await dispatch(
                deleteAccount({ password: deletePassword, reason: deleteReason })
              ).unwrap();
              // Navigation will happen automatically as the user will be logged out
            } catch (error: any) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to delete account'));
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const securityOptions = [
    {
      icon: 'Fingerprint',
      title: 'Biometric Login',
      description: 'Use fingerprint or Face ID to login',
      toggle: true,
      value: biometricEnabled,
      onToggle: setBiometricEnabled,
    },
    {
      icon: 'Smartphone',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      toggle: true,
      value: twoFactorEnabled,
      onToggle: setTwoFactorEnabled,
      comingSoon: true,
    },
    {
      icon: 'Key',
      title: 'Change Password',
      description: 'Update your account password',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      icon: 'Shield',
      title: 'Active Sessions',
      description: 'Manage devices logged into your account',
      comingSoon: true,
    },
  ];

  const privacyOptions = [
    {
      icon: 'Eye',
      title: 'Profile Visibility',
      description: 'Control who can see your profile',
      comingSoon: true,
    },
    {
      icon: 'Download',
      title: 'Download My Data',
      description: 'Get a copy of all your data',
      comingSoon: true,
    },
    {
      icon: 'FileText',
      title: 'Privacy Policy',
      description: 'Read our privacy policy',
      onPress: () => Alert.alert('Privacy Policy', 'Privacy policy will open in browser'),
    },
    {
      icon: 'FileText',
      title: 'Terms of Service',
      description: 'Read our terms of service',
      onPress: () => Alert.alert('Terms of Service', 'Terms of service will open in browser'),
    },
  ];

  const renderOption = (option: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.optionItem}
      onPress={option.onPress}
      disabled={option.toggle || option.comingSoon}
    >
      <View style={styles.optionLeft}>
        <View style={styles.optionIconContainer}>
          <Icon name={option.icon} size={20} color={colors.primary.main} />
        </View>
        <View style={styles.optionTextContainer}>
          <View style={styles.optionTitleRow}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            {option.comingSoon && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </View>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
      </View>
      {option.toggle && !option.comingSoon && (
        <Switch
          value={option.value}
          onValueChange={option.onToggle}
          trackColor={{ false: colors.secondary.main, true: colors.primary.light }}
          thumbColor={option.value ? colors.primary.main : colors.text.disabled}
        />
      )}
      {!option.toggle && !option.comingSoon && (
        <Icon name="ChevronRight" size={20} color={colors.text.disabled} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.optionsCard}>
            {securityOptions.map((option, index) => renderOption(option, index))}
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.optionsCard}>
            {privacyOptions.map((option, index) => renderOption(option, index))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <View style={styles.dangerContent}>
              <Icon name="AlertTriangle" size={24} color={colors.error.main} />
              <View style={styles.dangerTextContainer}>
                <Text style={styles.dangerTitle2}>Delete Account</Text>
                <Text style={styles.dangerDescription}>
                  Permanently delete your account and all associated data.
                  This action cannot be undone.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteModal(true)}
            >
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="AlertTriangle" size={32} color={colors.error.main} />
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalDescription}>
                This will permanently delete your account, all your cooperatives
                membership, contributions history, and associated data.
              </Text>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Enter your password to confirm"
                  placeholderTextColor={colors.text.disabled}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={deleteReason}
                  onChangeText={setDeleteReason}
                  placeholder="Tell us why you're leaving..."
                  placeholderTextColor={colors.text.disabled}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteButton, isDeleting && styles.buttonDisabled]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: colors.secondary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  dangerTitle: {
    color: colors.error.main,
  },
  dangerCard: {
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  dangerContent: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  dangerTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  dangerTitle2: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error.text,
    marginBottom: spacing.xs,
  },
  dangerDescription: {
    fontSize: 13,
    color: colors.error.text,
    lineHeight: 18,
  },
  deleteButton: {
    backgroundColor: colors.error.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.error.main,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalForm: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.secondary.main,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: colors.error.main,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default PrivacySecurityScreen;
