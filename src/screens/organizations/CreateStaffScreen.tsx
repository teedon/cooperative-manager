import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { organizationsApi } from '../../api/organizationsApi';
import { cooperativeApi } from '../../api/cooperativeApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateStaff'>;

interface InviteStaffDto {
  email: string;
  role: 'admin' | 'supervisor' | 'agent';
  permissions: string[];
  employeeCode?: string;
  message?: string;
  cooperativeIds?: string[];
}

const ROLES = [
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full access to all organization features'
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    description: 'Can manage cooperatives and oversee operations'
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'Works directly with cooperative members'
  }
];

const PERMISSIONS = [
  {
    id: 'MANAGE_COLLECTIONS',
    label: 'Manage Collections',
    description: 'Create and manage daily collections'
  },
  {
    id: 'APPROVE_COLLECTIONS',
    label: 'Approve Collections',
    description: 'Approve and review collection submissions'
  },
  {
    id: 'VIEW_REPORTS',
    label: 'View Reports',
    description: 'Access financial and activity reports'
  },
  {
    id: 'MANAGE_STAFF',
    label: 'Manage Staff',
    description: 'Add, edit, and remove staff members'
  },
  {
    id: 'MANAGE_SETTINGS',
    label: 'Manage Settings',
    description: 'Configure organization settings'
  },
  {
    id: 'VIEW_AUDIT_LOGS',
    label: 'View Audit Logs',
    description: 'Access system audit logs and activity'
  }
];

const CreateStaffScreen: React.FC<Props> = ({ navigation, route }) => {
  const { organizationId } = route.params;

  const [formData, setFormData] = useState<InviteStaffDto>({
    email: '',
    role: 'agent',
    permissions: [],
    employeeCode: '',
    message: '',
    cooperativeIds: []
  });
  const [loading, setLoading] = useState(false);
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const [loadingCooperatives, setLoadingCooperatives] = useState(true);

  useEffect(() => {
    loadCooperatives();
  }, []);

  const loadCooperatives = async () => {
    try {
      setLoadingCooperatives(true);
      const response = await cooperativeApi.getAll();
      if (response.success) {
        // Filter cooperatives that belong to this organization
        const orgCooperatives = response.data?.filter(coop => coop.organizationId === organizationId) || [];
        setCooperatives(orgCooperatives);
      }
    } catch (error) {
      console.error('Error loading cooperatives:', error);
    } finally {
      setLoadingCooperatives(false);
    }
  };

  const handleCooperativeToggle = (cooperativeId: string) => {
    setFormData(prev => ({
      ...prev,
      cooperativeIds: prev.cooperativeIds?.includes(cooperativeId)
        ? prev.cooperativeIds.filter(id => id !== cooperativeId)
        : [...(prev.cooperativeIds || []), cooperativeId]
    }));
  };

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (formData.permissions.length === 0) {
      Alert.alert('Validation Error', 'At least one permission must be selected');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        email: formData.email.trim(),
        role: formData.role,
        permissions: formData.permissions,
        employeeCode: formData.employeeCode?.trim() || undefined,
        message: formData.message?.trim() || undefined,
        cooperativeIds: formData.cooperativeIds?.length ? formData.cooperativeIds : undefined
      };

      const response = await organizationsApi.inviteStaff(organizationId, submitData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          response.data.emailSent 
            ? 'Staff invitation sent successfully! The user will be added to your organization when they sign up or log in.'
            : 'Staff invitation created successfully! However, the email notification failed to send.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send staff invitation');
      }
    } catch (error: any) {
      console.error('Failed to send staff invitation:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 401) {
        Alert.alert('Authentication Error', 'You do not have permission to invite staff members to this organization.');
      } else if (error?.response?.status === 403) {
        Alert.alert('Access Denied', 'You may not have the required permissions to perform this action.');
      } else if (error?.response?.status === 404) {
        Alert.alert('Error', 'Organization not found.');
      } else {
        Alert.alert('Error', getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Icon name="mail" size={32} color={colors.primary.main} />
          </View>
          <Text style={styles.headerTitle}>Invite Staff Member</Text>
          <Text style={styles.headerSubtitle}>
            Send an email invitation to add a new staff member to your organization
          </Text>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={colors.text.disabled}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employee Code (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter employee code"
              placeholderTextColor={colors.text.disabled}
              value={formData.employeeCode}
              onChangeText={(text) => setFormData(prev => ({ ...prev, employeeCode: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personal Message (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a personal message to the invitation..."
              placeholderTextColor={colors.text.disabled}
              value={formData.message}
              onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Role Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role</Text>
          <Text style={styles.sectionDescription}>
            Select the staff member's role in the organization
          </Text>
          
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.roleOption,
                formData.role === role.value && styles.roleOptionSelected
              ]}
              onPress={() => handleRoleSelect(role.value)}
            >
              <View style={styles.roleContent}>
                <View style={styles.roleHeader}>
                  <Text style={[
                    styles.roleLabel,
                    formData.role === role.value && styles.roleLabelSelected
                  ]}>
                    {role.label}
                  </Text>
                  <View style={[
                    styles.radioButton,
                    formData.role === role.value && styles.radioButtonSelected
                  ]}>
                    {formData.role === role.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cooperative Assignment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooperative Assignments</Text>
          <Text style={styles.sectionDescription}>
            Assign this staff member to manage specific cooperatives (optional)
          </Text>
          
          {loadingCooperatives ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <Text style={styles.loadingText}>Loading cooperatives...</Text>
            </View>
          ) : cooperatives.length > 0 ? (
            cooperatives.map((cooperative) => (
              <TouchableOpacity
                key={cooperative.id}
                style={styles.permissionOption}
                onPress={() => handleCooperativeToggle(cooperative.id)}
              >
                <View style={styles.permissionContent}>
                  <View style={styles.permissionHeader}>
                    <Text style={styles.permissionLabel}>{cooperative.name}</Text>
                    <View style={[
                      styles.checkbox,
                      formData.cooperativeIds?.includes(cooperative.id) && styles.checkboxSelected
                    ]}>
                      {formData.cooperativeIds?.includes(cooperative.id) && (
                        <Icon name="check" size={14} color="#fff" />
                      )}
                    </View>
                  </View>
                  <Text style={styles.permissionDescription}>
                    Allow this staff member to manage collections and members for {cooperative.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noCooperativesText}>
              No cooperatives available. Create cooperatives first to assign staff members.
            </Text>
          )}
        </View>

        {/* Permissions Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.sectionDescription}>
            Select which permissions this staff member should have
          </Text>
          
          {PERMISSIONS.map((permission) => (
            <TouchableOpacity
              key={permission.id}
              style={styles.permissionOption}
              onPress={() => handlePermissionToggle(permission.id)}
            >
              <View style={styles.permissionContent}>
                <View style={styles.permissionHeader}>
                  <Text style={styles.permissionLabel}>{permission.label}</Text>
                  <View style={[
                    styles.checkbox,
                    formData.permissions.includes(permission.id) && styles.checkboxSelected
                  ]}>
                    {formData.permissions.includes(permission.id) && (
                      <Icon name="check" size={14} color="#fff" />
                    )}
                  </View>
                </View>
                <Text style={styles.permissionDescription}>{permission.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary.contrast} />
            ) : (
              <>
                <Icon name="mail" size={20} color={colors.primary.contrast} />
                <Text style={styles.submitButtonText}>Send Invitation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    padding: spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.paper,
  },
  textArea: {
    height: 80,
    paddingTop: spacing.sm,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.paper,
  },
  roleOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  roleContent: {
    padding: spacing.md,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  roleLabelSelected: {
    color: colors.primary.main,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary.main,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.main,
  },
  permissionOption: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.paper,
  },
  permissionContent: {
    padding: spacing.md,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main,
  },
  footer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  noCooperativesText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    fontStyle: 'italic',
  },
});

export default CreateStaffScreen;