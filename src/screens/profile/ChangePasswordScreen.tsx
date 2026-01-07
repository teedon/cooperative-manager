import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { changePassword } from '../../store/slices/authSlice';
import { colors, spacing, borderRadius } from '../../theme';
import Icon from '../../components/common/Icon';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'ChangePassword'>;

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }
    return errors;
  };

  const passwordErrors = validatePassword(newPassword);
  const isPasswordValid = passwordErrors.length === 0;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    isPasswordValid &&
    passwordsMatch &&
    newPassword.length > 0;

  const handleChangePassword = async () => {
    if (!canSubmit) return;

    try {
      await dispatch(
        changePassword({
          currentPassword,
          newPassword,
        })
      ).unwrap();

      Alert.alert('Success', 'Your password has been changed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to change password'));
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void,
    placeholder: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={colors.text.disabled}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Icon
            name={showPassword ? 'EyeOff' : 'Eye'}
            size={20}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Security Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <Icon name="Shield" size={48} color={colors.primary.main} />
            </View>
            <Text style={styles.description}>
              Create a strong password to protect your account. Your password
              should be at least 8 characters and include uppercase, lowercase,
              and numbers.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {renderPasswordInput(
              'Current Password',
              currentPassword,
              setCurrentPassword,
              showCurrentPassword,
              setShowCurrentPassword,
              'Enter your current password'
            )}

            {renderPasswordInput(
              'New Password',
              newPassword,
              setNewPassword,
              showNewPassword,
              setShowNewPassword,
              'Enter your new password'
            )}

            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Password requirements:</Text>
                {[
                  { label: 'At least 8 characters', valid: newPassword.length >= 8 },
                  { label: 'One uppercase letter', valid: /[A-Z]/.test(newPassword) },
                  { label: 'One lowercase letter', valid: /[a-z]/.test(newPassword) },
                  { label: 'One number', valid: /[0-9]/.test(newPassword) },
                ].map((req, index) => (
                  <View key={index} style={styles.requirementRow}>
                    <Icon
                      name={req.valid ? 'CheckCircle' : 'Circle'}
                      size={16}
                      color={req.valid ? colors.success.main : colors.text.disabled}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        req.valid && styles.requirementTextValid,
                      ]}
                    >
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {renderPasswordInput(
              'Confirm New Password',
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              setShowConfirmPassword,
              'Confirm your new password'
            )}

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                <Icon
                  name={passwordsMatch ? 'CheckCircle' : 'XCircle'}
                  size={16}
                  color={passwordsMatch ? colors.success.main : colors.error.main}
                />
                <Text
                  style={[
                    styles.matchText,
                    passwordsMatch ? styles.matchTextValid : styles.matchTextInvalid,
                  ]}
                >
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!canSubmit || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleChangePassword}
            disabled={!canSubmit || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary.contrast} />
            ) : (
              <Text style={styles.submitButtonText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  iconSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  eyeButton: {
    padding: spacing.md,
  },
  requirementsContainer: {
    backgroundColor: colors.secondary.main,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirementText: {
    fontSize: 13,
    color: colors.text.disabled,
    marginLeft: spacing.xs,
  },
  requirementTextValid: {
    color: colors.success.main,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  matchText: {
    fontSize: 13,
    marginLeft: spacing.xs,
  },
  matchTextValid: {
    color: colors.success.main,
  },
  matchTextInvalid: {
    color: colors.error.main,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default ChangePasswordScreen;
