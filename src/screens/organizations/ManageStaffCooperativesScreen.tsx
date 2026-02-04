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
import { organizationsApi } from '../../api/organizationsApi';
import { cooperativeApi } from '../../api/cooperativeApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'ManageStaffCooperatives'>;

interface Cooperative {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
}

interface Assignment {
  id: string;
  cooperativeId: string;
  cooperative: Cooperative;
  assignedAt: string;
  isActive: boolean;
}

const ManageStaffCooperativesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { organizationId, staffId, staffName } = route.params;

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [cooperativesResponse, assignmentsResponse] = await Promise.all([
        cooperativeApi.getAll(),
        organizationsApi.getStaffAssignments(organizationId, staffId)
      ]);

      if (cooperativesResponse.success) {
        // Filter cooperatives that belong to this organization
        const orgCooperatives = cooperativesResponse.data?.filter(
          coop => coop.organizationId === organizationId
        ) || [];
        setCooperatives(orgCooperatives);
      }

      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.data || []);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssignment = async (cooperativeId: string) => {
    const isAssigned = assignments.some(a => a.cooperativeId === cooperativeId && a.isActive);
    
    try {
      setSubmitting(true);
      
      if (isAssigned) {
        // Remove assignment
        const response = await organizationsApi.removeStaffAssignment(
          organizationId,
          staffId,
          cooperativeId
        );
        
        if (response.success) {
          setAssignments(prev => prev.filter(a => a.cooperativeId !== cooperativeId));
          Alert.alert('Success', 'Staff member removed from cooperative successfully');
        }
      } else {
        // Add assignment
        const response = await organizationsApi.assignStaffToCooperatives(
          organizationId,
          staffId,
          { cooperativeIds: [cooperativeId] }
        );
        
        if (response.success) {
          // Reload assignments to get the latest data
          const assignmentsResponse = await organizationsApi.getStaffAssignments(organizationId, staffId);
          if (assignmentsResponse.success) {
            setAssignments(assignmentsResponse.data || []);
          }
          Alert.alert('Success', 'Staff member assigned to cooperative successfully');
        }
      }
    } catch (err: any) {
      console.error('Error toggling assignment:', err);
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isAssigned = (cooperativeId: string): boolean => {
    return assignments.some(a => a.cooperativeId === cooperativeId && a.isActive);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading cooperative assignments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Manage Cooperative Assignments</Text>
          <Text style={styles.subtitle}>
            Assign {staffName} to manage specific cooperatives
          </Text>
        </View>

        {/* Cooperatives List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Cooperatives</Text>
          <Text style={styles.sectionDescription}>
            Toggle assignments to allow this staff member to manage collections for specific cooperatives
          </Text>
          
          {cooperatives.length > 0 ? (
            cooperatives.map((cooperative) => {
              const assigned = isAssigned(cooperative.id);
              
              return (
                <TouchableOpacity
                  key={cooperative.id}
                  style={styles.cooperativeItem}
                  onPress={() => handleToggleAssignment(cooperative.id)}
                  disabled={submitting}
                >
                  <View style={styles.cooperativeContent}>
                    <View style={styles.cooperativeHeader}>
                      <Text style={styles.cooperativeName}>{cooperative.name}</Text>
                      <View style={[
                        styles.checkbox,
                        assigned && styles.checkboxSelected
                      ]}>
                        {assigned && (
                          <Icon name="check" size={14} color="#fff" />
                        )}
                      </View>
                    </View>
                    {cooperative.description && (
                      <Text style={styles.cooperativeDescription}>
                        {cooperative.description}
                      </Text>
                    )}
                    <Text style={styles.assignmentStatus}>
                      {assigned ? '✓ Assigned' : '○ Not assigned'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noCooperativesText}>
              No cooperatives available. Create cooperatives first to assign staff members.
            </Text>
          )}
        </View>

        {/* Current Assignments Summary */}
        {assignments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Assignments</Text>
            <Text style={styles.assignmentSummary}>
              {staffName} is assigned to {assignments.filter(a => a.isActive).length} cooperative(s)
            </Text>
          </View>
        )}
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
  content: {
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
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  cooperativeItem: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cooperativeContent: {
    flex: 1,
  },
  cooperativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cooperativeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cooperativeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  assignmentStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  checkboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  noCooperativesText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontStyle: 'italic',
  },
  assignmentSummary: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});

export default ManageStaffCooperativesScreen;