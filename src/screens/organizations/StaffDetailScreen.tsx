import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { organizationsApi, Staff } from '../../api/organizationsApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'StaffDetail'>;

const StaffDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { organizationId, staffId } = route.params;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaffDetail();
  }, []);

  const loadStaffDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationsApi.getStaffById(organizationId, staffId);
      if (response.success) {
        setStaff(response.data);
      } else {
        setError(response.message || 'Failed to load staff details');
      }
    } catch (err: any) {
      console.error('Error loading staff details:', err);
      
      // Handle specific error cases
      if (err?.response?.status === 401) {
        setError('You do not have permission to view this staff member.');
      } else if (err?.response?.status === 403) {
        setError('Access denied. You may not have the required permissions.');
      } else if (err?.response?.status === 404) {
        setError('Staff member not found.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!staff) return;

    const action = staff.isActive ? 'deactivate' : 'activate';
    const actionLabel = staff.isActive ? 'Deactivate' : 'Activate';
    
    Alert.alert(
      `${actionLabel} Staff Member`,
      `Are you sure you want to ${action} this staff member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: staff.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const response = await organizationsApi.updateStaff(
                organizationId,
                staffId,
                { isActive: !staff.isActive }
              );
              
              if (response.success) {
                setStaff(response.data);
                Alert.alert('Success', `Staff member ${action}d successfully`);
              } else {
                Alert.alert('Error', response.message || `Failed to ${action} staff member`);
              }
            } catch (err) {
              Alert.alert('Error', getErrorMessage(err));
            }
          }
        }
      ]
    );
  };

  const handleDeleteStaff = async () => {
    if (!staff) return;

    Alert.alert(
      'Remove Staff Member',
      'Are you sure you want to remove this staff member? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await organizationsApi.deleteStaff(organizationId, staffId);
              
              if (response.success) {
                Alert.alert(
                  'Success',
                  'Staff member removed successfully',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                Alert.alert('Error', response.message || 'Failed to remove staff member');
              }
            } catch (err) {
              Alert.alert('Error', getErrorMessage(err));
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.error.main;
      case 'supervisor': return colors.warning.main;
      case 'agent': return colors.primary.main;
      default: return colors.text.secondary;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'supervisor': return 'Supervisor';
      case 'agent': return 'Agent';
      default: return role;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading staff details...</Text>
      </View>
    );
  }

  if (error || !staff) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>{error || 'Staff member not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStaffDetail}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userName = `${staff.user?.firstName || ''} ${staff.user?.lastName || ''}`.trim();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {staff.user?.firstName?.[0] || ''}{staff.user?.lastName?.[0] || ''}
            </Text>
          </View>
          <Text style={styles.staffName}>{userName || 'Unknown User'}</Text>
          <Text style={styles.staffEmail}>{staff.user?.email || 'No email'}</Text>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              { backgroundColor: staff.isActive ? colors.success.main : colors.text.disabled }
            ]} />
            <Text style={styles.statusText}>
              {staff.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(staff.role) + '20' }]}>
                <Text style={[styles.roleText, { color: getRoleColor(staff.role) }]}>
                  {getRoleLabel(staff.role)}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>
                {staff.user?.phoneNumber || 'Not provided'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Join Date</Text>
              <Text style={styles.infoValue}>
                {new Date(staff.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          
          {staff.permissions.length > 0 ? (
            <View style={styles.permissionsContainer}>
              {staff.permissions.map((permission, index) => (
                <View key={index} style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>
                    {permission.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noPermissionsText}>No permissions assigned</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.assignButton]}
            onPress={() => navigation.navigate('ManageStaffCooperatives', {
              organizationId,
              staffId,
              staffName: userName || 'Unknown User'
            })}
          >
            <Icon name="users" size={20} color={colors.primary.main} />
            <Text style={[styles.actionButtonText, { color: colors.primary.main }]}>
              Manage Cooperative Assignments
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton]}
            onPress={handleToggleStatus}
          >
            <Icon 
              name={staff.isActive ? "user-x" : "user-check"} 
              size={20} 
              color={staff.isActive ? colors.warning.main : colors.success.main} 
            />
            <Text style={[styles.actionButtonText, {
              color: staff.isActive ? colors.warning.main : colors.success.main
            }]}>
              {staff.isActive ? 'Deactivate' : 'Activate'} Staff
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteStaff}
          >
            <Icon name="trash-2" size={20} color={colors.error.main} />
            <Text style={[styles.actionButtonText, { color: colors.error.main }]}>
              Remove Staff
            </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary.contrast,
  },
  staffName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  staffEmail: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.primary,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  permissionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  permissionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.sm,
  },
  permissionText: {
    fontSize: 12,
    color: colors.primary.dark,
    textTransform: 'capitalize',
  },
  noPermissionsText: {
    fontSize: 16,
    color: colors.text.disabled,
    textAlign: 'center',
    padding: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    gap: spacing.sm,
    ...shadows.sm,
  },
  statusButton: {
    borderColor: colors.border.light,
  },
  assignButton: {
    borderColor: colors.primary.light,
  },
  deleteButton: {
    borderColor: colors.error.light,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StaffDetailScreen;