import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { organizationsApi, Organization } from '../../api/organizationsApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'OrganizationList'>;

const OrganizationListScreen: React.FC<Props> = ({ navigation }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load organizations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrganizations();
    }, [])
  );

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationsApi.getAll();
      setOrganizations(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrganizations();
  };

  const handleOrganizationPress = (organization: Organization) => {
    navigation.navigate('OrganizationDetail', { organizationId: organization.id });
  };

  const handleCreatePress = () => {
    navigation.navigate('CreateOrganization');
  };

  const renderOrganization = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      style={styles.organizationCard}
      onPress={() => handleOrganizationPress(item)}
    >
      <View style={styles.organizationHeader}>
        <View style={styles.organizationIcon}>
          <Icon name="business" size={24} color={colors.primary.main} />
        </View>
        <View style={styles.organizationInfo}>
          <Text style={styles.organizationName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.organizationDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <Icon name="chevron-forward" size={20} color={colors.text.secondary} />
      </View>
      <View style={styles.organizationFooter}>
        <View style={styles.footerItem}>
          <Icon name="people" size={16} color={colors.text.secondary} />
          <Text style={styles.footerText}>
            {item.cooperativesCount || 0} cooperatives
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="person" size={16} color={colors.text.secondary} />
          <Text style={styles.footerText}>
            {item.staffCount || 0} staff
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading organizations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrganizations}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={organizations}
        renderItem={renderOrganization}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="business-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No organizations yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first organization to get started
            </Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
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
  listContent: {
    padding: spacing.md,
  },
  organizationCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  organizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  organizationIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  organizationInfo: {
    flex: 1,
  },
  organizationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  organizationDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  organizationFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing['5xl'],
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});

export default OrganizationListScreen;
