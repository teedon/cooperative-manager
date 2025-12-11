import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../store/slices/authSlice';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { lightTheme } from '../../theme';
import { ThemedInput, Button } from '../../components/common';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<LoginFormData>({
    email: 'john.doe@example.com',
    password: 'password123',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(login(formData)).unwrap();
    } catch {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🤝</Text>
            <Text style={styles.title}>Cooperative Manager</Text>
            <Text style={styles.subtitle}>Manage your community cooperatives</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <ThemedInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                value={formData.email}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <ThemedInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Enter your password"
                secureTextEntry={true}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                value={formData.password}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {error && <Text style={styles.apiError}>{error}</Text>}

            <Button title="Sign In" onPress={handleSubmit} loading={isLoading} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.demoNote}>
              <Text style={styles.demoText}>Demo credentials pre-filled</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background.default,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: lightTheme.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: lightTheme.text.primary,
  },
  form: {
    backgroundColor: lightTheme.background.surface,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: lightTheme.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: lightTheme.neutral[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    backgroundColor: lightTheme.secondary.light,
    color: lightTheme.text.primary,
  },
  inputError: {
    borderColor: lightTheme.error.main,
  },
  errorText: {
    color: lightTheme.error.main,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  apiError: {
    color: lightTheme.error.main,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: lightTheme.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: lightTheme.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
    gap: spacing.xs,
  },
  footerText: {
    color: lightTheme.text.secondary,
    fontSize: 14,
  },
  footerLink: {
    color: lightTheme.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
  demoNote: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  demoText: {
    color: lightTheme.text.disabled,
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default LoginScreen;
