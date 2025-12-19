import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { cooperativeApi } from '../../api/cooperativeApi';
import { CooperativeMember } from '../../models';
import { formatCurrency } from '../../utils/formatters';
import DocumentPicker, { types } from 'react-native-document-picker';
import * as XLSX from 'xlsx';
import ReactNativeBlobUtil from 'react-native-blob-util';

type Props = NativeStackScreenProps<HomeStackParamList, 'OfflineMembers'>;

interface OfflineMemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  initialBalance: string;
  autoSubscribe: boolean;
}

const initialFormData: OfflineMemberFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  initialBalance: '0',
  autoSubscribe: false,
};

const OfflineMembersScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId, cooperativeName } = route.params;

  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CooperativeMember | null>(null);

  // Form data
  const [formData, setFormData] = useState<OfflineMemberFormData>(initialFormData);

  // Bulk import data
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportResult, setBulkImportResult] = useState<{
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    failed: Array<{ member: any; error: string }>;
  } | null>(null);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    isImporting: boolean;
  }>({ current: 0, total: 0, isImporting: false });
  const [parsedMembers, setParsedMembers] = useState<Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }>>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOfflineMembers = useCallback(async () => {
    try {
      const response = await cooperativeApi.getOfflineMembers(cooperativeId);
      if (response.success) {
        setMembers(response.data || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch offline members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cooperativeId]);

  useEffect(() => {
    fetchOfflineMembers();
  }, [fetchOfflineMembers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOfflineMembers();
  }, [fetchOfflineMembers]);

  const filteredMembers = members.filter((member) => {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
    const email = (member.email || '').toLowerCase();
    const phone = (member.phone || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query) || phone.includes(query);
  });

  const handleAddMember = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await cooperativeApi.createOfflineMember(cooperativeId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        initialBalance: parseFloat(formData.initialBalance) || 0,
        autoSubscribe: formData.autoSubscribe,
      });

      if (response.success) {
        Alert.alert('Success', 'Offline member added successfully');
        setShowAddModal(false);
        setFormData(initialFormData);
        fetchOfflineMembers();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add offline member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMember = async () => {
    if (!selectedMember) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await cooperativeApi.updateOfflineMember(
        cooperativeId,
        selectedMember.id,
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        }
      );

      if (response.success) {
        Alert.alert('Success', 'Offline member updated successfully');
        setShowEditModal(false);
        setSelectedMember(null);
        setFormData(initialFormData);
        fetchOfflineMembers();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update offline member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (member: CooperativeMember) => {
    const memberName = `${member.firstName} ${member.lastName}`;
    Alert.alert(
      'Delete Member',
      `Are you sure you want to delete ${memberName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cooperativeApi.deleteOfflineMember(cooperativeId, member.id);
              if (response.success) {
                Alert.alert('Success', 'Offline member deleted successfully');
                fetchOfflineMembers();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete offline member');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (member: CooperativeMember) => {
    setSelectedMember(member);
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      phone: member.phone || '',
      initialBalance: '0',
      autoSubscribe: false,
    });
    setShowEditModal(true);
  };

  // Update parsed members when text changes
  useEffect(() => {
    const members = parseBulkImportText(bulkImportText);
    setParsedMembers(members);
  }, [bulkImportText]);

  const parseBulkImportText = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const members: Array<{
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    }> = [];

    for (const line of lines) {
      // Skip header row if detected
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('firstname') || lowerLine.includes('first name') || lowerLine.includes('lastname')) {
        continue;
      }

      // Support CSV format: firstName,lastName,email,phone
      // Or simple format: firstName LastName
      const parts = line.includes(',') 
        ? line.split(',').map(p => p.trim())
        : line.trim().split(/\s+/);

      if (parts.length >= 2 && parts[0] && parts[1]) {
        members.push({
          firstName: parts[0],
          lastName: parts[1],
          email: parts[2] || undefined,
          phone: parts[3] || undefined,
        });
      }
    }

    return members;
  };

  const parseExcelFile = async (fileUri: string): Promise<Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }>> => {
    try {
      // Read file as base64
      const base64Data = await ReactNativeBlobUtil.fs.readFile(fileUri, 'base64');
      
      // Parse workbook
      const workbook = XLSX.read(base64Data, { type: 'base64' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
      
      const members: Array<{
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
      }> = [];

      for (const row of jsonData) {
        // Try different column name variations
        const firstName = row['FirstName'] || row['First Name'] || row['firstName'] || row['first_name'] || row['FIRSTNAME'] || '';
        const lastName = row['LastName'] || row['Last Name'] || row['lastName'] || row['last_name'] || row['LASTNAME'] || '';
        const email = row['Email'] || row['email'] || row['EMAIL'] || row['E-mail'] || '';
        const phone = row['Phone'] || row['phone'] || row['PHONE'] || row['PhoneNumber'] || row['Phone Number'] || row['phone_number'] || '';

        if (firstName && lastName) {
          members.push({
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            email: email ? String(email).trim() : undefined,
            phone: phone ? String(phone).trim() : undefined,
          });
        }
      }

      return members;
    } catch (error) {
      console.error('Excel parse error:', error);
      throw new Error('Failed to parse Excel file');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // Create template data
      const templateData = [
        { FirstName: 'John', LastName: 'Doe', Email: 'john.doe@example.com', Phone: '08012345678' },
        { FirstName: 'Jane', LastName: 'Smith', Email: 'jane.smith@example.com', Phone: '08087654321' },
        { FirstName: 'Mike', LastName: 'Johnson', Email: '', Phone: '' },
      ];

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // FirstName
        { wch: 15 }, // LastName
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
      ];

      // Generate file
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      // Save to device
      const fileName = `offline_members_template_${Date.now()}.xlsx`;
      const filePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
      
      await ReactNativeBlobUtil.fs.writeFile(filePath, wbout, 'base64');
      
      // Share the file
      if (Platform.OS === 'ios') {
        await Share.share({
          url: `file://${filePath}`,
          title: 'Offline Members Template',
        });
      } else {
        // For Android, use ReactNativeBlobUtil to open/share
        await ReactNativeBlobUtil.android.actionViewIntent(
          filePath,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
      }
      
      Alert.alert('Success', 'Template downloaded successfully!');
    } catch (error) {
      console.error('Template download error:', error);
      Alert.alert('Error', 'Failed to download template. Please try again.');
    }
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          types.csv, 
          types.plainText, 
          types.xlsx,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          types.allFiles
        ],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        const fileUri = file.fileCopyUri || file.uri;
        const fileName = file.name || '';
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
                        file.type?.includes('spreadsheet') || file.type?.includes('excel');
        
        try {
          if (isExcel) {
            // Parse Excel file
            const members = await parseExcelFile(fileUri);
            setParsedMembers(members);
            // Convert to text format for display
            const textContent = members.map(m => 
              `${m.firstName},${m.lastName},${m.email || ''},${m.phone || ''}`
            ).join('\n');
            setBulkImportText(textContent);
            Alert.alert('File Loaded', `Successfully loaded ${fileName}. ${members.length} members detected from Excel file.`);
          } else {
            // Read as text (CSV or plain text)
            const response = await fetch(fileUri);
            const content = await response.text();
            setBulkImportText(content);
            const members = parseBulkImportText(content);
            setParsedMembers(members);
            Alert.alert('File Loaded', `Successfully loaded ${fileName}. ${members.length} members detected.`);
          }
        } catch (readError) {
          console.error('File read error:', readError);
          Alert.alert('Error', 'Failed to read file contents. Please ensure the file is a valid CSV, Excel, or text file.');
        }
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        console.error('Document picker error:', err);
        Alert.alert('Error', 'Failed to select file. Please try again.');
      }
    }
  };

  const handleBulkImport = async () => {
    const members = parsedMembers.length > 0 ? parsedMembers : parseBulkImportText(bulkImportText);
    
    if (members.length === 0) {
      Alert.alert('Validation Error', 'Please enter at least one member. Format: FirstName,LastName,Email(optional),Phone(optional)');
      return;
    }

    setSubmitting(true);
    setBulkImportResult(null);
    setImportProgress({ current: 0, total: members.length, isImporting: true });

    try {
      // For large imports, process in batches with progress updates
      const BATCH_SIZE = 50;
      let successCount = 0;
      let failedCount = 0;
      const allFailed: Array<{ member: any; error: string }> = [];

      if (members.length <= BATCH_SIZE) {
        // Small import - do it in one request
        const response = await cooperativeApi.bulkCreateOfflineMembers(cooperativeId, members);
        
        if (response.success && response.data) {
          setImportProgress({ current: members.length, total: members.length, isImporting: false });
          setBulkImportResult(response.data);
          
          if (response.data.failedCount === 0) {
            Alert.alert(
              'Success', 
              `Successfully added ${response.data.successCount} offline members!`,
              [{ text: 'OK', onPress: () => {
                setShowBulkImportModal(false);
                setBulkImportText('');
                setParsedMembers([]);
                setBulkImportResult(null);
                fetchOfflineMembers();
              }}]
            );
          }
        }
      } else {
        // Large import - process in batches
        for (let i = 0; i < members.length; i += BATCH_SIZE) {
          const batch = members.slice(i, i + BATCH_SIZE);
          
          try {
            const response = await cooperativeApi.bulkCreateOfflineMembers(cooperativeId, batch);
            
            if (response.success && response.data) {
              successCount += response.data.successCount;
              failedCount += response.data.failedCount;
              if (response.data.failed) {
                allFailed.push(...response.data.failed);
              }
            }
          } catch (batchError: any) {
            // Mark all in batch as failed
            failedCount += batch.length;
            batch.forEach(m => allFailed.push({ member: m, error: 'Batch request failed' }));
          }

          // Update progress
          const processed = Math.min(i + BATCH_SIZE, members.length);
          setImportProgress({ current: processed, total: members.length, isImporting: true });
        }

        setImportProgress({ current: members.length, total: members.length, isImporting: false });
        
        const result = {
          totalProcessed: members.length,
          successCount,
          failedCount,
          failed: allFailed,
        };
        setBulkImportResult(result);

        if (failedCount === 0) {
          Alert.alert(
            'Success', 
            `Successfully added ${successCount} offline members!`,
            [{ text: 'OK', onPress: () => {
              setShowBulkImportModal(false);
              setBulkImportText('');
              setParsedMembers([]);
              setBulkImportResult(null);
              fetchOfflineMembers();
            }}]
          );
        }
      }
    } catch (error: any) {
      setImportProgress({ current: 0, total: 0, isImporting: false });
      Alert.alert('Error', error.response?.data?.message || 'Failed to import members');
    } finally {
      setSubmitting(false);
    }
  };
      setSubmitting(false);
    }
  };

  const renderMemberItem = ({ item }: { item: CooperativeMember }) => {
    const fullName = `${item.firstName || ''} ${item.lastName || ''}`;
    const initials = `${(item.firstName || 'U')[0]}${(item.lastName || 'U')[0]}`.toUpperCase();

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberRow}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Member Info */}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{fullName}</Text>
            {item.email && (
              <Text style={styles.memberDetail}>{item.email}</Text>
            )}
            {item.phone && (
              <Text style={styles.memberDetail}>{item.phone}</Text>
            )}
            <View style={styles.memberMeta}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Offline Member</Text>
              </View>
              <Text style={styles.balanceText}>
                Balance: {formatCurrency(item.virtualBalance || 0)}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={[styles.actionButton, styles.editButton]}
            >
              <Icon name="Edit2" size={18} color={colors.primary.main} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteMember(item)}
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Icon name="Trash2" size={18} color={colors.error.main} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFormContent = (isEdit: boolean) => (
    <ScrollView style={styles.formContainer}>
      {/* First Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter first name"
          placeholderTextColor={colors.text.disabled}
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />
      </View>

      {/* Last Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter last name"
          placeholderTextColor={colors.text.disabled}
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        />
      </View>

      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          placeholderTextColor={colors.text.disabled}
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
        />
      </View>

      {/* Phone */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          placeholderTextColor={colors.text.disabled}
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
        />
      </View>

      {/* Initial Balance - Only for Add */}
      {!isEdit && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Initial Balance (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.text.disabled}
            keyboardType="numeric"
            value={formData.initialBalance}
            onChangeText={(text) => setFormData({ ...formData, initialBalance: text })}
          />
          <Text style={styles.helperText}>
            Set an initial balance if this member has contributed before joining the platform.
          </Text>
        </View>
      )}

      {/* Auto Subscribe - Only for Add */}
      {!isEdit && (
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Auto Subscribe to Plans</Text>
            <Text style={styles.switchDescription}>
              Automatically subscribe this member to all active contribution plans.
            </Text>
          </View>
          <Switch
            value={formData.autoSubscribe}
            onValueChange={(value) => setFormData({ ...formData, autoSubscribe: value })}
            trackColor={{ false: colors.text.disabled, true: colors.primary.light }}
            thumbColor={formData.autoSubscribe ? colors.primary.main : colors.background.paper}
          />
        </View>
      )}

      {/* Submit Button */}
      <Button
        title={isEdit ? 'Update Member' : 'Add Member'}
        onPress={isEdit ? handleEditMember : handleAddMember}
        loading={submitting}
        style={styles.submitButton}
      />
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="ArrowLeft" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Offline Members</Text>
            <Text style={styles.headerSubtitle}>{cooperativeName}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading offline members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="ArrowLeft" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Offline Members</Text>
          <Text style={styles.headerSubtitle}>{cooperativeName}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="Search" size={20} color={colors.text.disabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor={colors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="X" size={20} color={colors.text.disabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Icon name="Info" size={24} color={colors.info.main} />
        <View style={styles.infoBannerContent}>
          <Text style={styles.infoBannerTitle}>Offline Members</Text>
          <Text style={styles.infoBannerText}>
            These members don't have mobile devices. You can manage their contributions and records on their behalf.
          </Text>
        </View>
      </View>

      {/* Member List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMemberItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.main]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="Users" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No offline members</Text>
            <Text style={styles.emptyText}>
              Add members who don't have mobile devices to manage their contributions.
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          onPress={() => {
            setBulkImportText('');
            setParsedMembers([]);
            setBulkImportResult(null);
            setImportProgress({ current: 0, total: 0, isImporting: false });
            setShowBulkImportModal(true);
          }}
          style={[styles.fab, styles.fabSecondary]}
        >
          <Icon name="Upload" size={24} color={colors.primary.main} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setFormData(initialFormData);
            setShowAddModal(true);
          }}
          style={styles.fab}
        >
          <Icon name="Plus" size={28} color={colors.primary.contrast} />
        </TouchableOpacity>
      </View>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialFormData);
        }}
        title="Add Offline Member"
      >
        {renderFormContent(false)}
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
          setFormData(initialFormData);
        }}
        title="Edit Offline Member"
      >
        {renderFormContent(true)}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        visible={showBulkImportModal}
        onClose={() => {
          if (!importProgress.isImporting) {
            setShowBulkImportModal(false);
            setBulkImportText('');
            setParsedMembers([]);
            setBulkImportResult(null);
            setImportProgress({ current: 0, total: 0, isImporting: false });
          }
        }}
        title="Bulk Import Members"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bulkImportContainer}
        >
          <ScrollView style={styles.formContainer}>
            <View style={styles.infoBanner}>
              <Icon name="Info" size={20} color={colors.info.main} />
              <View style={styles.infoBannerContent}>
                <Text style={styles.infoBannerTitle}>Import Format</Text>
                <Text style={styles.infoBannerText}>
                  Upload an Excel file or enter members manually.{'\n'}
                  Columns: FirstName, LastName, Email, Phone{'\n'}
                  Email and Phone are optional.
                </Text>
              </View>
            </View>

            {/* Download Template Button */}
            <TouchableOpacity 
              style={styles.downloadTemplateButton} 
              onPress={handleDownloadTemplate}
            >
              <Icon name="Download" size={20} color={colors.success.main} />
              <Text style={styles.downloadTemplateText}>Download Excel Template</Text>
            </TouchableOpacity>

            {/* File Selection */}
            <TouchableOpacity style={styles.selectFileButton} onPress={handleSelectFile}>
              <Icon name="Upload" size={20} color={colors.primary.main} />
              <Text style={styles.selectFileText}>Select Excel/CSV File</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR ENTER MANUALLY</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Members Data</Text>
              <TextInput
                style={styles.bulkInput}
                placeholder="John,Doe,john@email.com,08012345678
Jane,Smith
Mike,Johnson,mike@email.com"
                placeholderTextColor={colors.text.disabled}
                value={bulkImportText}
                onChangeText={setBulkImportText}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                editable={!importProgress.isImporting}
              />
              <Text style={styles.helperText}>
                {parsedMembers.length} member(s) detected
              </Text>
            </View>

            {/* Import Progress */}
            {importProgress.isImporting && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <ActivityIndicator size="small" color={colors.primary.main} />
                  <Text style={styles.progressText}>
                    Importing members... {importProgress.current} / {importProgress.total}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${(importProgress.current / importProgress.total) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round((importProgress.current / importProgress.total) * 100)}%
                </Text>
              </View>
            )}

            {bulkImportResult && bulkImportResult.failedCount > 0 && (
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <Icon name="AlertTriangle" size={20} color={colors.warning.main} />
                  <Text style={styles.resultTitle}>
                    {bulkImportResult.successCount} added, {bulkImportResult.failedCount} failed
                  </Text>
                </View>
                <ScrollView style={styles.failedList}>
                  {bulkImportResult.failed.map((item, index) => (
                    <View key={index} style={styles.failedItem}>
                      <Text style={styles.failedName}>
                        {item.member.firstName} {item.member.lastName}
                      </Text>
                      <Text style={styles.failedError}>{item.error}</Text>
                    </View>
                  ))}
                </ScrollView>
                <Button
                  title="Done"
                  onPress={() => {
                    setShowBulkImportModal(false);
                    setBulkImportText('');
                    setParsedMembers([]);
                    setBulkImportResult(null);
                    setImportProgress({ current: 0, total: 0, isImporting: false });
                    fetchOfflineMembers();
                  }}
                  style={styles.submitButton}
                />
              </View>
            )}

            {!bulkImportResult && !importProgress.isImporting && (
              <Button
                title={`Import ${parsedMembers.length} Members`}
                onPress={handleBulkImport}
                loading={submitting}
                disabled={parsedMembers.length === 0}
                style={styles.submitButton}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  header: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border?.light || '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text.primary,
    fontSize: 16,
  },
  infoBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.info.light + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
  },
  infoBannerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoBannerTitle: {
    fontWeight: '600',
    color: colors.info.dark,
  },
  infoBannerText: {
    fontSize: 13,
    color: colors.info.main,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  memberCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary.main,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberDetail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: colors.warning.light + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    color: colors.warning.dark,
  },
  balanceText: {
    fontSize: 12,
    color: colors.text.disabled,
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.primary.light + '20',
  },
  deleteButton: {
    backgroundColor: colors.error.light + '20',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: 18,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.disabled,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.paper,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  formContainer: {
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  switchInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  submitButton: {
    marginBottom: spacing.lg,
  },
  bulkImportContainer: {
    flex: 1,
  },
  bulkInput: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text.primary,
    minHeight: 160,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resultContainer: {
    backgroundColor: colors.warning.light + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning.dark,
    marginLeft: spacing.sm,
  },
  failedList: {
    maxHeight: 150,
  },
  failedItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning.light,
  },
  failedName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  failedError: {
    fontSize: 12,
    color: colors.error.main,
  },
  selectFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.light + '20',
    borderWidth: 2,
    borderColor: colors.primary.main,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectFileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
  downloadTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success.light + '20',
    borderWidth: 1,
    borderColor: colors.success.main,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  downloadTemplateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.main,
    marginLeft: spacing.sm,
  },
  progressContainer: {
    backgroundColor: colors.primary.light + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.neutral?.[200] || '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
    textAlign: 'center',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  orText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },
});

export default OfflineMembersScreen;
