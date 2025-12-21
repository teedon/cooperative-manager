import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'About'>;

const AboutScreen: React.FC<Props> = () => {
  const appVersion = '1.0.0';
  const buildNumber = '100';

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const features = [
    {
      icon: 'Users',
      title: 'Cooperative Management',
      description: 'Create and manage cooperatives with ease',
    },
    {
      icon: 'DollarSign',
      title: 'Contribution Tracking',
      description: 'Track member contributions and payments',
    },
    {
      icon: 'CreditCard',
      title: 'Loan Management',
      description: 'Request and manage loans within cooperatives',
    },
    {
      icon: 'ShoppingBag',
      title: 'Group Buying',
      description: 'Pool resources for bulk purchases',
    },
    {
      icon: 'BookOpen',
      title: 'Financial Ledger',
      description: 'Complete transaction history and records',
    },
    {
      icon: 'Bell',
      title: 'Smart Notifications',
      description: 'Stay updated with important activities',
    },
  ];

  const socialLinks = [
    { icon: 'Twitter', label: 'Twitter', url: 'https://twitter.com/CooperativeApp' },
    { icon: 'Facebook', label: 'Facebook', url: 'https://facebook.com/CooperativeApp' },
    { icon: 'Instagram', label: 'Instagram', url: 'https://instagram.com/CooperativeApp' },
    { icon: 'Linkedin', label: 'LinkedIn', url: 'https://linkedin.com/company/CooperativeApp' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Icon name="Users" size={48} color={colors.primary.main} />
          </View>
          <Text style={styles.appName}>Cooperative Manager</Text>
          <Text style={styles.tagline}>Empowering Communities Through Collaboration</Text>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
            <Text style={styles.buildText}>(Build {buildNumber})</Text>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <View style={styles.missionCard}>
            <Icon name="Target" size={24} color={colors.primary.main} />
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              To provide a simple, secure, and efficient platform for cooperative
              societies to manage their finances, foster collaboration, and achieve
              their collective goals together.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Icon name={feature.icon} size={24} color={colors.primary.main} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.legalCard}>
            <TouchableOpacity
              style={styles.legalItem}
              onPress={() => handleOpenLink('https://cooperativemanager.com/terms')}
            >
              <Icon name="FileText" size={20} color={colors.text.secondary} />
              <Text style={styles.legalText}>Terms of Service</Text>
              <Icon name="ExternalLink" size={16} color={colors.text.disabled} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.legalItem}
              onPress={() => handleOpenLink('https://cooperativemanager.com/privacy')}
            >
              <Icon name="Shield" size={20} color={colors.text.secondary} />
              <Text style={styles.legalText}>Privacy Policy</Text>
              <Icon name="ExternalLink" size={16} color={colors.text.disabled} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.legalItem, styles.noBorder]}
              onPress={() => handleOpenLink('https://cooperativemanager.com/licenses')}
            >
              <Icon name="Award" size={20} color={colors.text.secondary} />
              <Text style={styles.legalText}>Open Source Licenses</Text>
              <Icon name="ExternalLink" size={16} color={colors.text.disabled} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialContainer}>
            {socialLinks.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialButton}
                onPress={() => handleOpenLink(social.url)}
              >
                <Icon name={social.icon} size={24} color={colors.primary.main} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <View style={styles.creditsCard}>
            <Text style={styles.creditsTitle}>Made with ❤️ in Nigeria</Text>
            <Text style={styles.creditsText}>
              © {new Date().getFullYear()} Cooperative Manager. All rights reserved.
            </Text>
          </View>
        </View>

        {/* Rate App */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.rateButton}>
            <Icon name="Star" size={20} color={colors.primary.contrast} />
            <Text style={styles.rateButtonText}>Rate Us on the App Store</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
  buildText: {
    fontSize: 12,
    color: colors.text.disabled,
    marginLeft: spacing.xs,
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
  missionCard: {
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary.main,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  missionText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    width: '47%',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  legalCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  legalText: {
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
    marginLeft: spacing.md,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditsCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  creditsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  creditsText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  rateButton: {
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default AboutScreen;
