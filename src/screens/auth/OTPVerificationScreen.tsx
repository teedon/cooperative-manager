import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { authApi } from '../../api';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { getErrorMessage } from '../../utils/errorHandler';

type OTPVerificationScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

interface Props {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, resetToken } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const validateOTP = (): boolean => {
    if (!otp) {
      setOtpError('OTP code is required');
      return false;
    } else if (otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return false;
    } else if (!/^\d+$/.test(otp)) {
      setOtpError('OTP must contain only numbers');
      return false;
    }
    setOtpError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateOTP()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.verifyOTP(email, otp);
      if (response.success) {
        // OTP verified, navigate to reset password screen
        navigation.replace('ResetPassword', { token: resetToken, email });
      } else {
        setError(response.message || 'Invalid OTP code');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to verify OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError(null);
    setOtp('');

    try {
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        setError(null);
        // Show brief success message
        setTimeout(() => {
          inputRef.current?.focus();
        }, 500);
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resend OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="ArrowLeft" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="Lock" size={40} color={colors.primary.main} />
            </View>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {email}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formCard}>
            {/* OTP Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code</Text>
              <View style={[styles.inputWrapper, otpError && styles.inputWrapperError]}>
                <Icon name="Hash" size={20} color={colors.text.secondary} />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={colors.text.disabled}
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={(text) => {
                    setOtp(text);
                    if (otpError) setOtpError(null);
                  }}
                  value={otp}
                  editable={!isLoading}
                />
              </View>
              {otpError && <Text style={styles.errorText}>{otpError}</Text>}
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Check your email and spam folder. The code is valid for 15 minutes.
            </Text>

            {/* API Error */}
            {error && (
              <View style={styles.apiErrorContainer}>
                <Icon name="AlertCircle" size={16} color={colors.error.main} />
                <Text style={styles.apiError}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primary.contrast} />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity 
                onPress={handleResend}
                disabled={isLoading}
              >
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.horizontal,
    paddingVertical: spacing.vertical,
  },
  backButton: {
    paddingVertical: spacing.small,
    marginBottom: spacing.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xlarge,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.medium,
    padding: spacing.large,
    marginBottom: spacing.large,
    ...shadows.card,
  },
  inputGroup: {
    marginBottom: spacing.large,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.medium,
    backgroundColor: colors.background.default,
  },
  inputWrapperError: {
    borderColor: colors.error.main,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.small,
    fontSize: 16,
    color: colors.text.primary,
  },
  errorText: {
    fontSize: 12,
    color: colors.error.main,
    marginTop: spacing.small,
  },
  infoText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.large,
    fontStyle: 'italic',
  },
  apiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.small,
    padding: spacing.medium,
    marginBottom: spacing.large,
  },
  apiError: {
    flex: 1,
    fontSize: 13,
    color: colors.error.main,
    marginLeft: spacing.small,
  },
  button: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.small,
    paddingVertical: spacing.medium,
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
  },
  resendText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  resendLink: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.small,
    paddingTop: spacing.large,
  },
  footerText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  footerLink: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;
