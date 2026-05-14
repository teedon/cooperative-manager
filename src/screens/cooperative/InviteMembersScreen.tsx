import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  Modal,
  Clipboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { cooperativeApi } from '../../api/cooperativeApi';
import { getErrorMessage } from '../../utils/errorHandler';
import Contacts from 'react-native-contacts';

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

interface PhonebookContact {
  id: string;
  name: string;
  number: string;
  normalizedNumber: string;
}

const InviteMembersScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId, cooperativeName } = route.params;
  
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>('email');
  const [emails, setEmails] = useState<EmailInput[]>([{ id: '1', value: '' }]);
  const [phones, setPhones] = useState<PhoneInput[]>([{ id: '1', value: '' }]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpeningContacts, setIsOpeningContacts] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showPhonebookModal, setShowPhonebookModal] = useState(false);
  const [isLoadingPhonebook, setIsLoadingPhonebook] = useState(false);
  const [phonebookSearch, setPhonebookSearch] = useState('');
  const [phonebookContacts, setPhonebookContacts] = useState<PhonebookContact[]>([]);
  const [selectedPhonebookNumbers, setSelectedPhonebookNumbers] = useState<Set<string>>(new Set());

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

  const normalizePhoneNumber = (value: string) => value.replace(/[^\d+]/g, '');

  const filteredPhonebookContacts = useMemo(() => {
    const query = phonebookSearch.trim().toLowerCase();
    if (!query) return phonebookContacts;

    return phonebookContacts.filter((contact) =>
      contact.name.toLowerCase().includes(query) || contact.number.toLowerCase().includes(query)
    );
  }, [phonebookContacts, phonebookSearch]);

  const requestPhonebookPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'Allow access to your contacts to select members for WhatsApp invitations.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    const status = await Contacts.requestPermission();
    return status === 'authorized';
  };

  const handleOpenPhonebookSelector = async () => {
    setIsLoadingPhonebook(true);
    try {
      const hasPermission = await requestPhonebookPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant contacts permission to select from phonebook.');
        return;
      }

      const allContacts = await Contacts.getAll();
      const flattened: PhonebookContact[] = [];
      const seen = new Set<string>();

      allContacts.forEach((contact) => {
        const displayName =
          contact.displayName ||
          `${contact.givenName || ''} ${contact.familyName || ''}`.trim() ||
          'Unnamed Contact';

        contact.phoneNumbers.forEach((phoneNumber, index) => {
          const normalizedNumber = normalizePhoneNumber(phoneNumber.number || '');
          if (!normalizedNumber || seen.has(normalizedNumber)) return;

          seen.add(normalizedNumber);
          flattened.push({
            id: `${contact.recordID}-${index}`,
            name: displayName,
            number: phoneNumber.number,
            normalizedNumber,
          });
        });
      });

      flattened.sort((a, b) => a.name.localeCompare(b.name));
      setPhonebookContacts(flattened);
      setPhonebookSearch('');
      setSelectedPhonebookNumbers(new Set());
      setShowPhonebookModal(true);
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load phonebook contacts'));
    } finally {
      setIsLoadingPhonebook(false);
    }
  };

  const togglePhonebookSelection = (normalizedNumber: string) => {
    setSelectedPhonebookNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedNumber)) {
        next.delete(normalizedNumber);
      } else {
        next.add(normalizedNumber);
      }
      return next;
    });
  };

  const addSelectedPhonebookContacts = () => {
    if (selectedPhonebookNumbers.size === 0) {
      Alert.alert('No Selection', 'Select at least one contact number to add.');
      return;
    }

    const existing = new Set(phones.map((p) => normalizePhoneNumber(p.value)).filter(Boolean));
    const selectedContacts = phonebookContacts.filter((c) => selectedPhonebookNumbers.has(c.normalizedNumber));
    const newContacts = selectedContacts.filter((c) => !existing.has(c.normalizedNumber));

    if (newContacts.length === 0) {
      Alert.alert('No New Numbers', 'All selected contacts are already in the list.');
      return;
    }

    const newInputs: PhoneInput[] = newContacts.map((contact) => ({
      id: `${Date.now()}-${contact.id}`,
      value: contact.number,
    }));

    const hasPlaceholderOnly = phones.length === 1 && !phones[0].value.trim();
    setPhones(hasPlaceholderOnly ? newInputs : [...phones, ...newInputs]);
    setShowPhonebookModal(false);
    setSelectedPhonebookNumbers(new Set());
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

  const buildContactInviteMessage = async () => {
    const coopResponse = await cooperativeApi.getById(cooperativeId);
    const code = coopResponse.data?.code;

    if (!code) {
      throw new Error('Invite code is unavailable for this cooperative');
    }

    const customMessage = message.trim() || `Hello! You are invited to join *${cooperativeName}* on CoopManager.`;
    const deepLink = `coopmanager://join?code=${code}`;
    const webLink = `https://coopmanager.app/join?code=${code}`;

    return `${customMessage}\n\n*Cooperative Code:* ${code}\n\nOpen the CoopManager app and use this code to join, or click the link below:\n${deepLink}\n\nDon't have the app? Join via web:\n${webLink}`;
  };

  const handleInviteFromContacts = async () => {
    setIsOpeningContacts(true);
    try {
      const inviteMessage = await buildContactInviteMessage();
      const encodedMessage = encodeURIComponent(inviteMessage);
      const whatsappDeepLink = `whatsapp://send?text=${encodedMessage}`;
      const whatsappWebFallback = `https://wa.me/?text=${encodedMessage}`;

      if (await Linking.canOpenURL(whatsappDeepLink)) {
        await Linking.openURL(whatsappDeepLink);
      } else if (await Linking.canOpenURL(whatsappWebFallback)) {
        await Linking.openURL(whatsappWebFallback);
      } else {
        Alert.alert('Error', 'Cannot open WhatsApp. Please make sure WhatsApp is installed.');
      }
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to open WhatsApp contacts'));
    } finally {
      setIsOpeningContacts(false);
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

      <TouchableOpacity
        style={[styles.contactsButton, isOpeningContacts && styles.buttonDisabled]}
        onPress={handleInviteFromContacts}
        disabled={isOpeningContacts}
      >
        {isOpeningContacts ? (
          <ActivityIndicator size="small" color={colors.success.main} />
        ) : (
          <Icon name="users" size={18} color={colors.success.main} />
        )}
        <Text style={styles.contactsButtonText}>
          {isOpeningContacts ? 'Opening WhatsApp...' : 'Select Contacts in WhatsApp'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.contactsHint}>
        Opens WhatsApp with your invite message so you can choose contacts directly.
      </Text>

      <TouchableOpacity
        style={[styles.phonebookButton, isLoadingPhonebook && styles.buttonDisabled]}
        onPress={handleOpenPhonebookSelector}
        disabled={isLoadingPhonebook}
      >
        {isLoadingPhonebook ? (
          <ActivityIndicator size="small" color={colors.primary.main} />
        ) : (
          <Icon name="BookUser" size={18} color={colors.primary.main} />
        )}
        <Text style={styles.phonebookButtonText}>
          {isLoadingPhonebook ? 'Loading Phonebook...' : 'Select from Phonebook'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.contactsHint}>
        Pick contacts from your phonebook and add their phone numbers automatically.
      </Text>
      
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

      <Modal
        visible={showPhonebookModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPhonebookModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contacts</Text>
              <TouchableOpacity onPress={() => setShowPhonebookModal(false)}>
                <Icon name="X" size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Icon name="Search" size={18} color={colors.text.secondary} />
              <TextInput
                style={styles.modalSearchInput}
                value={phonebookSearch}
                onChangeText={setPhonebookSearch}
                placeholder="Search contacts"
                placeholderTextColor={colors.text.disabled}
              />
            </View>

            {filteredPhonebookContacts.length === 0 ? (
              <View style={styles.modalEmptyState}>
                <Text style={styles.modalEmptyText}>No contacts found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredPhonebookContacts}
                keyExtractor={(item) => item.id}
                style={styles.modalList}
                renderItem={({ item }) => {
                  const selected = selectedPhonebookNumbers.has(item.normalizedNumber);
                  return (
                    <TouchableOpacity
                      style={styles.modalContactRow}
                      onPress={() => togglePhonebookSelection(item.normalizedNumber)}
                    >
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactName}>{item.name}</Text>
                        <Text style={styles.modalContactNumber}>{item.number}</Text>
                      </View>
                      <Icon
                        name={selected ? 'CheckSquare' : 'Square'}
                        size={20}
                        color={selected ? colors.primary.main : colors.text.secondary}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPhonebookModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={addSelectedPhonebookContacts}
              >
                <Text style={styles.modalAddText}>Add Selected ({selectedPhonebookNumbers.size})</Text>
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
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.success.main,
    backgroundColor: colors.success.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success.main,
  },
  contactsHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  phonebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  phonebookButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '85%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: 14,
  },
  modalList: {
    maxHeight: 420,
  },
  modalContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: spacing.sm,
  },
  modalContactInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  modalContactName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalContactNumber: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalEmptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  modalCancelText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  modalAddText: {
    color: colors.primary.contrast,
    fontWeight: '700',
    fontSize: 14,
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
