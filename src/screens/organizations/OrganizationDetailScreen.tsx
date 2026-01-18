import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { organizationsApi, Organization } from '../../api/organizationsApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'OrganizationDetail'>;

const OrganizationDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { organizationId } = route.params;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadOrganization();
    }, [organizationId])
  );

  const loadOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationsApi.getById(organizationId);
      setOrganization(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewStaff = () => {
    navigation.navigate('StaffList', { organizationId });
  };

  const handleViewCollections = () => {
    navigation.navigate('CollectionsList', { organizationId });
  };

  const handleViewStatistics = () => {
    navigation.navigate('CollectionsStatistics', { organizationId });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading organization...</Text>
      </View>
    );
  }

  if (error || !organization) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>{error || 'Organization not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrganization}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.iconContainer}>
          <Icon name="business" size={32} color={colors.primary.main} />
        </View>
        <Text style={styles.organizationName}>{organization.name}</Text>
        {organization.description && (
          <Text style={styles.organizationDescription}>{organization.description}</Text>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="people" size={24} color={colors.success.main} />
          <Text style={styles.statValue}>{organization.cooperativesCount || 0}</Text>
          <Text style={styles.statLabel}>Cooperatives</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="person" size={24} color={colors.primary.main} />
          <Text style={styles.statValue}>{organization.staffCount || 0}</Text>
          <Text style={styles.statLabel}>Staff Members</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard} onPress={handleViewStaff}>
          <View style={styles.actionIcon}>
            <Icon name="people" size={24} color={colors.primary.main} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Staff</Text>
            <Text style={styles.actionDescription}>
              View and manage staff members
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleViewCollections}>
          <View style={styles.actionIcon}>
            <Icon name="cash" size={24} color={colors.success.main} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Daily Collections</Text>
            <Text style={styles.actionDescription}>
              View and manage daily collections
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleViewStatistics}>
          <View style={styles.actionIcon}>
            <Icon name="bar-chart" size={24} color={colors.accent.main} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Statistics & Reports</Text>
            <Text style={styles.actionDescription}>
              View analytics and performance metrics
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Organization Info */}
      {(organization.email || organization.phone || organization.address) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            {organization.email && (
              <View style={styles.infoRow}>
                <Icon name="mail" size={18} color={colors.text.secondary} />
                <Text style={styles.infoText}>{organization.email}</Text>
              </View>
            )}
            {organization.phone && (
              <View style={styles.infoRow}>
                <Icon name="call" size={18} color={colors.text.secondary} />
                <Text style={styles.infoText}>{organization.phone}</Text>
              </View>
            )}
            {organization.address && (
              <View style={styles.infoRow}>
                <Icon name="location" size={18} color={colors.text.secondary} />
                <Text style={styles.infoText}>{organization.address}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.default,
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
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
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
  organizationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  organizationDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
});

export default OrganizationDetailScreen;
