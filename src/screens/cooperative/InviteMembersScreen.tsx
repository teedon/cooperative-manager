import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { cooperativeApi } from '../../api/cooperativeApi';
import { getErrorMessage } from '../../utils/errorHandler';

type InviteMembersScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'InviteMembers'>;
type InviteMembersScreenRouteProp = RouteProp<HomeStackParamList, 'InviteMembers'>;

interface Props {
  navigation: InviteMembersScreenNavigationProp;
  route: InviteMembersScreenRouteProp;
}

type InviteMethod = 'email' | 'whatsapp';

interface EmailInput {
  id: string;
  value: string;
}

interface PhoneInput {
  id: string;
  value: string;
}

const InviteMembersScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId, cooperativeName } = route.params;
  
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>('email');
  const [emails, setEmails] = useState<EmailInput[]>([{ id: '1', value: '' }]);
  const [phones, setPhones] = useState<PhoneInput[]>([{ id: '1', value: '' }]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const addEmailField = () => {
    setEmails([...emails, { id: Date.now().toString(), value: '' }]);
  };

  const removeEmailField = (id: string) => {
    if (emails.length > 1) {
      setEmails(emails.filter(e => e.id !== id));
    }
  };

  const updateEmail = (id: string, value: string) => {
    setEmails(emails.map(e => e.id === id ? { ...e, value } : e));
  };

  const addPhoneField = () => {
    setPhones([...phones, { id: Date.now().toString(), value: '' }]);
  };

  const removePhoneField = (id: string) => {
    if (phones.length > 1) {
      setPhones(phones.filter(p => p.id !== id));
    }
  };

  const updatePhone = (id: string, value: string) => {
    setPhones(phones.map(p => p.id === id ? { ...p, value } : p));
  };

  const handleSendEmails = async () => {
    const validEmails = emails.filter(e => e.value.includes('@')).map(e => e.value);
    
    if (validEmails.length === 0) {
      Alert.alert('Error', 'Please enter at least one valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await cooperativeApi.sendEmailInvites(
        cooperativeId,
        validEmails,
        message || undefined
      );

      if (response.success) {
        setResults({
          type: 'email',
          data: response.data,
        });
        Alert.alert(
          'Success',
          `Sent ${response.data.results.filter((r: any) => r.sent).length} of ${validEmails.length} invitations`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWhatsAppLinks = async () => {
    const validPhones = phones.filter(p => p.value.trim().length > 0).map(p => p.value);
    
    if (validPhones.length === 0) {
      Alert.alert('Error', 'Please enter at least one phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await cooperativeApi.sendWhatsAppInvites(
        cooperativeId,
        validPhones,
        message || undefined
      );

      if (response.success) {
        setResults({
          type: 'whatsapp',
          data: response.data,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate WhatsApp links');
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsAppLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open WhatsApp. Please make sure WhatsApp is installed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const renderEmailTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.label}>Email Addresses</Text>
      <Text style={styles.helperText}>Enter email addresses of people you want to invite</Text>
      
      <View style={styles.inputsList}>
        {emails.map((email, index) => (
          <View key={email.id} style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Icon name="Mail" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.input}
                placeholder={`Email ${index + 1}`}
                placeholderTextColor={colors.text.disabled}
                value={email.value}
                onChangeText={(text) => updateEmail(email.id, text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emails.length > 1 && (
              <TouchableOpacity
                onPress={() => removeEmailField(email.id)}
                style={styles.removeButton}
              >
                <Icon name="X" size={20} color={colors.error.main} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={addEmailField} style={styles.addButton}>
        <Icon name="Plus" size={20} color={colors.primary.main} />
        <Text style={styles.addButtonText}>Add Another Email</Text>
      </TouchableOpacity>

      <View style={styles.messageSection}>
        <Text style={styles.label}>Custom Message (Optional)</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Add a personal message to your invitation..."
          placeholderTextColor={colors.text.disabled}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.sendButton, isLoading && styles.buttonDisabled]}
        onPress={handleSendEmails}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary.contrast} />
        ) : (
          <>
            <Icon name="Send" size={20} color={colors.primary.contrast} />
            <Text style={styles.sendButtonText}>Send Invitations</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderWhatsAppTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.label}>Phone Numbers</Text>
      <Text style={styles.helperText}>Enter phone numbers with country code (e.g., +1234567890)</Text>
      
      <View style={styles.inputsList}>
        {phones.map((phone, index) => (
          <View key={phone.id} style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Icon name="Phone" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.input}
                placeholder={`Phone ${index + 1}`}
                placeholderTextColor={colors.text.disabled}
                value={phone.value}
                onChangeText={(text) => updatePhone(phone.id, text)}
                keyboardType="phone-pad"
              />
            </View>
            {phones.length > 1 && (
              <TouchableOpacity
                onPress={() => removePhoneField(phone.id)}
                style={styles.removeButton}
              >
                <Icon name="X" size={20} color={colors.error.main} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={addPhoneField} style={styles.addButton}>
        <Icon name="Plus" size={20} color={colors.primary.main} />
        <Text style={styles.addButtonText}>Add Another Phone</Text>
      </TouchableOpacity>

      <View style={styles.messageSection}>
        <Text style={styles.label}>Custom Message (Optional)</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Add a personal message to your invitation..."
          placeholderTextColor={colors.text.disabled}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.sendButton, isLoading && styles.buttonDisabled]}
        onPress={handleGenerateWhatsAppLinks}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary.contrast} />
        ) : (
          <>
            <Icon name="MessageCircle" size={20} color={colors.primary.contrast} />
            <Text style={styles.sendButtonText}>Generate WhatsApp Links</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderResults = () => {
    if (!results) return null;

    if (results.type === 'email') {
      return (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Email Results</Text>
          {results.data.results.map((result: any, index: number) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                result.sent ? styles.resultSuccess : styles.resultError
              ]}
            >
              <Icon
                name={result.sent ? 'CheckCircle' : 'XCircle'}
                size={20}
                color={result.sent ? colors.success.main : colors.error.main}
              />
              <View style={styles.resultContent}>
                <Text style={styles.resultEmail}>{result.email}</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (results.type === 'whatsapp') {
      return (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>WhatsApp Links Generated</Text>
          
          <View style={styles.messagePreview}>
            <Text style={styles.messagePreviewLabel}>Message:</Text>
            <Text style={styles.messagePreviewText}>{results.data.whatsappMessage}</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(results.data.whatsappMessage)}
              style={styles.copyButton}
            >
              <Icon name="Copy" size={16} color={colors.primary.main} />
              <Text style={styles.copyButtonText}>Copy Message</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.linksLabel}>Tap to open WhatsApp:</Text>
          {results.data.whatsappLinks.map((link: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.whatsappLinkButton}
              onPress={() => openWhatsAppLink(link.whatsappUrl)}
            >
              <Icon name="MessageCircle" size={20} color={colors.success.main} />
              <Text style={styles.whatsappLinkText}>{link.originalPhone}</Text>
              <Icon name="ExternalLink" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="ArrowLeft" size={24} color={colors.primary.main} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Invite Members</Text>
            <Text style={styles.subtitle}>{cooperativeName}</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, inviteMethod === 'email' && styles.tabActive]}
            onPress={() => setInviteMethod('email')}
          >
            <Icon
              name="Mail"
              size={20}
              color={inviteMethod === 'email' ? colors.primary.main : colors.text.secondary}
            />
            <Text style={[styles.tabText, inviteMethod === 'email' && styles.tabTextActive]}>
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, inviteMethod === 'whatsapp' && styles.tabActive]}
            onPress={() => setInviteMethod('whatsapp')}
          >
            <Icon
              name="MessageCircle"
              size={20}
              color={inviteMethod === 'whatsapp' ? colors.primary.main : colors.text.secondary}
            />
            <Text style={[styles.tabText, inviteMethod === 'whatsapp' && styles.tabTextActive]}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        {inviteMethod === 'email' ? renderEmailTab() : renderWhatsAppTab()}

        {renderResults()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.paper,
    ...shadows.sm,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
    gap: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary.light,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary.main,
  },
  tabContent: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  helperText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  inputsList: {
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.paper,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text.primary,
  },
  removeButton: {
    padding: spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  messageSection: {
    marginTop: spacing.lg,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: colors.background.paper,
    minHeight: 100,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  resultsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.paper,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    ...shadows.md,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  resultSuccess: {
    backgroundColor: colors.success.light,
  },
  resultError: {
    backgroundColor: colors.error.light,
  },
  resultContent: {
    flex: 1,
  },
  resultEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  resultMessage: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  messagePreview: {
    backgroundColor: colors.background.default,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  messagePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  messagePreviewText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  linksLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  whatsappLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  whatsappLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default InviteMembersScreen;
