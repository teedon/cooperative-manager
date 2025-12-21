import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'HelpSupport'>;

const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const faqs = [
    {
      question: 'How do I create a new cooperative?',
      answer:
        'To create a new cooperative, go to the Home screen and tap the "Create Cooperative" button. Fill in the required details like name, description, and contribution settings. Once created, you can invite members to join.',
    },
    {
      question: 'How do I join an existing cooperative?',
      answer:
        'You can join a cooperative using an invite code. Go to Home and tap "Join Cooperative". Enter the invite code shared by the cooperative admin. Once approved, you\'ll be able to participate in the cooperative.',
    },
    {
      question: 'How do contributions work?',
      answer:
        'Contributions are regular payments members make to the cooperative. Admins set up contribution plans with amounts and frequencies. Members record their payments which are then verified by admins. Track your contribution history in the cooperative details.',
    },
    {
      question: 'How do I request a loan?',
      answer:
        'Navigate to the cooperative where you want to request a loan, then go to "Loans" section and tap "Request Loan". Select a loan type, enter the amount and purpose. Your request will be reviewed by cooperative admins.',
    },
    {
      question: 'What are Group Buys?',
      answer:
        'Group Buys allow cooperative members to pool resources for bulk purchases. Admins create listings for items, members contribute, and once the target is reached, the purchase is made and items distributed among participants.',
    },
    {
      question: 'How do I become an admin of a cooperative?',
      answer:
        'Cooperative creators are automatically admins. Existing admins can promote members to admin or moderator roles through the Admin Management section in cooperative settings.',
    },
    {
      question: 'Is my financial data secure?',
      answer:
        'Yes! We use industry-standard encryption to protect your data. All transactions are logged and auditable. We never share your personal or financial information with third parties without your consent.',
    },
  ];

  const handleSendMessage = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message');
      return;
    }

    setIsSending(true);
    // Simulate sending message
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSending(false);

    Alert.alert(
      'Message Sent',
      'Thank you for contacting us. We\'ll get back to you within 24-48 hours.',
      [
        {
          text: 'OK',
          onPress: () => {
            setContactSubject('');
            setContactMessage('');
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open link')
    );
  };

  const contactOptions = [
    {
      icon: 'Mail',
      title: 'Email Support',
      subtitle: 'support@cooperativemanager.com',
      onPress: () => handleOpenLink('mailto:support@cooperativemanager.com'),
    },
    {
      icon: 'Phone',
      title: 'Phone Support',
      subtitle: '+234 800 123 4567',
      onPress: () => handleOpenLink('tel:+2348001234567'),
    },
    {
      icon: 'MessageCircle',
      title: 'WhatsApp',
      subtitle: 'Chat with us on WhatsApp',
      onPress: () => handleOpenLink('https://wa.me/2348001234567'),
    },
    {
      icon: 'Twitter',
      title: 'Twitter/X',
      subtitle: '@CooperativeApp',
      onPress: () => handleOpenLink('https://twitter.com/CooperativeApp'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactGrid}>
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.contactCard}
                onPress={option.onPress}
              >
                <View style={styles.contactIconContainer}>
                  <Icon name={option.icon} size={24} color={colors.primary.main} />
                </View>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {faqs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Icon
                    name={expandedFaq === index ? 'ChevronUp' : 'ChevronDown'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </View>
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Us a Message</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={contactSubject}
                onChangeText={setContactSubject}
                placeholder="What's this about?"
                placeholderTextColor={colors.text.disabled}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={contactMessage}
                onChangeText={setContactMessage}
                placeholder="Describe your issue or question..."
                placeholderTextColor={colors.text.disabled}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.primary.contrast} />
              ) : (
                <>
                  <Icon name="Send" size={18} color={colors.primary.contrast} />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.resourcesCard}>
            <TouchableOpacity style={styles.resourceItem}>
              <Icon name="Book" size={20} color={colors.primary.main} />
              <Text style={styles.resourceText}>User Guide</Text>
              <Icon name="ExternalLink" size={16} color={colors.text.disabled} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.resourceItem}>
              <Icon name="Video" size={20} color={colors.primary.main} />
              <Text style={styles.resourceText}>Video Tutorials</Text>
              <Icon name="ExternalLink" size={16} color={colors.text.disabled} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.resourceItem}>
              <Icon name="FileText" size={20} color={colors.primary.main} />
              <Text style={styles.resourceText}>Terms of Service</Text>
              <Icon name="ExternalLink" size={16} color={colors.text.disabled} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resourceItem, styles.noBorder]}>
              <Icon name="Shield" size={20} color={colors.primary.main} />
              <Text style={styles.resourceText}>Privacy Policy</Text>
              <Icon name="ExternalLink" size={16} color={colors.text.disabled} />
            </TouchableOpacity>
          </View>
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
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  contactCard: {
    width: '47%',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  faqContainer: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  faqItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
    paddingRight: spacing.md,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
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
    height: 120,
  },
  sendButton: {
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  resourcesCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  resourceText: {
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
    marginLeft: spacing.md,
  },
});

export default HelpSupportScreen;
