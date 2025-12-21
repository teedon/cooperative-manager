import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch } from '../../store/hooks';
import { verifyPayment } from '../../store/slices/subscriptionSlice';
import { colors, spacing, borderRadius } from '../../theme';
import Icon from '../../components/common/Icon';
import { HomeStackParamList } from '../../navigation/MainNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'PaymentWebView'>;

export default function PaymentWebViewScreen({ navigation, route }: Props) {
  const { authorizationUrl, reference, cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const webViewRef = useRef<WebView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;

    // Check if the URL indicates payment completion
    // Paystack redirects to callback URL after payment
    if (url.includes('callback') || url.includes('verify') || url.includes('success')) {
      await handlePaymentVerification();
    }

    // Check for payment cancellation
    if (url.includes('cancel') || url.includes('close')) {
      handleCancel();
    }
  };

  const handlePaymentVerification = async () => {
    if (isVerifying) return;

    setIsVerifying(true);
    
    // Add a timeout for the verification
    const timeoutId = setTimeout(() => {
      setIsVerifying(false);
      Alert.alert(
        'Verification Timeout',
        'Payment verification is taking longer than expected. The payment may still be processing. Please try again or check your subscription status later.',
        [
          {
            text: 'Try Again',
            onPress: () => handlePaymentVerification(),
          },
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    }, 30000); // 30 second timeout

    try {
      const result = await dispatch(verifyPayment(reference)).unwrap();
      clearTimeout(timeoutId);

      Alert.alert(
        'Payment Successful',
        'Your subscription has been activated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the cooperative or subscription management
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' as any }],
              });
            },
          },
        ]
      );
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsVerifying(false);
      
      const errorMessage = err?.message || err || 'Failed to verify payment';
      
      // Check if payment is still pending
      if (errorMessage.includes('pending') || errorMessage.includes('not found')) {
        Alert.alert(
          'Payment Pending',
          'Your payment is still being processed. Please wait a moment and try again.',
          [
            {
              text: 'Try Again',
              onPress: () => handlePaymentVerification(),
            },
            {
              text: 'Cancel',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(
          'Verification Failed',
          errorMessage,
          [
            {
              text: 'Try Again',
              onPress: () => handlePaymentVerification(),
            },
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
          ]
        );
      }
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleError = () => {
    Alert.alert(
      'Connection Error',
      'Failed to load payment page. Please check your internet connection and try again.',
      [
        {
          text: 'Retry',
          onPress: () => webViewRef.current?.reload(),
        },
        {
          text: 'Cancel',
          onPress: () => navigation.goBack(),
          style: 'cancel',
        },
      ]
    );
  };

  if (isVerifying) {
    return (
      <SafeAreaView style={styles.verifyingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.verifyingTitle}>Verifying Payment...</Text>
        <Text style={styles.verifyingSubtitle}>
          Please wait while we confirm your payment
        </Text>
        <TouchableOpacity 
          style={styles.cancelVerifyButton}
          onPress={() => {
            setIsVerifying(false);
            Alert.alert(
              'Cancel Verification',
              'Are you sure you want to cancel? Your payment may have already been processed.',
              [
                { text: 'Continue Verifying', style: 'cancel', onPress: () => setIsVerifying(true) },
                { text: 'Go Back', style: 'destructive', onPress: () => navigation.goBack() },
              ]
            );
          }}
        >
          <Text style={styles.cancelVerifyText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Icon name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: authorizationUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={handleError}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
        style={styles.webView}
      />

      {/* Manual Verification Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.verifyButton} onPress={handlePaymentVerification}>
          <Text style={styles.verifyButtonText}>I've Completed Payment</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Click above if you've completed payment but weren't redirected
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  verifyingContainer: {
    flex: 1,
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingTitle: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  verifyingSubtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  cancelVerifyButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  cancelVerifyText: {
    color: colors.text.secondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  webView: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  verifyButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  verifyButtonText: {
    color: colors.primary.contrast,
    textAlign: 'center',
    fontWeight: '600',
  },
  footerNote: {
    color: colors.text.disabled,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
