import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { Ajo } from '../../models';
import { ajoApi } from '../../api/ajoApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';

type Props = NativeStackScreenProps<HomeStackParamList, 'AjoList'>;

const AjoListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  
  const { isAdmin } = usePermissions(cooperativeId);

  const [ajos, setAjos] = useState<Ajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAjos = async () => {
    try {
      const data = await ajoApi.getAll(cooperativeId);
      setAjos(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load Ajos'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAjos();
  }, [cooperativeId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAjos();
    setRefreshing(false);
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    };
    return labels[frequency] || frequency;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success.main;
      case 'completed':
        return colors.info.main;
      case 'cancelled':
        return colors.error.main;
      default:
        return colors.text.secondary;
    }
  };

  const calculateProgress = (ajo: Ajo) => {
    if (ajo.isContinuous) return null;
    
    const start = new Date(ajo.startDate);
    const end = ajo.endDate ? new Date(ajo.endDate) : new Date();
    const now = new Date();
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = Math.min((elapsed / total) * 100, 100);
    
    return Math.round(progress);
  };

  const renderAjoItem = ({ item }: { item: Ajo }) => {
    const myMembership = item.members?.[0];
    const progress = calculateProgress(item);

    return (
      <TouchableOpacity
        style={styles.ajoCard}
        onPress={() => navigation.navigate('AjoDetail', { ajoId: item.id })}
      >
        <View style={styles.ajoHeader}>
          <View style={styles.ajoTitleRow}>
            <Text style={styles.ajoTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
          {item.description && (
            <Text style={styles.ajoDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>

        <View style={styles.ajoDetails}>
          <View style={styles.detailRow}>
            <Icon name="DollarSign" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>₦{item.amount.toLocaleString()}</Text>
            <Text style={styles.detailLabel}>per {item.frequency}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="Users" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item._count?.members || 0} members</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="Calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {item.isContinuous ? 'Continuous' : new Date(item.startDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {myMembership && (
          <View style={styles.membershipInfo}>
            <View style={styles.membershipRow}>
              <Text style={styles.membershipLabel}>Your Status:</Text>
              <View
                style={[
                  styles.membershipStatusBadge,
                  myMembership.status === 'accepted' && styles.acceptedBadge,
                  myMembership.status === 'pending' && styles.pendingBadge,
                  myMembership.status === 'declined' && styles.declinedBadge,
                ]}
              >
                <Text style={styles.membershipStatusText}>{myMembership.status}</Text>
              </View>
            </View>
            {myMembership.status === 'accepted' && (
              <View style={styles.membershipRow}>
                <Text style={styles.membershipLabel}>Total Paid:</Text>
                <Text style={styles.membershipValue}>₦{myMembership.totalPaid.toLocaleString()}</Text>
              </View>
            )}
          </View>
        )}

        {progress !== null && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}% Complete</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading Ajos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="ArrowLeft" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajo Plans</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('AjoSettings', { cooperativeId })}
          >
            <Icon name="Settings" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={ajos}
        renderItem={renderAjoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="Target" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No Ajo Plans Yet</Text>
            <Text style={styles.emptyText}>
              {isAdmin
                ? 'Create your first Ajo plan to help members save towards their goals'
                : 'No Ajo plans have been created yet'}
            </Text>
          </View>
        }
      />

      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateAjo', { cooperativeId })}
        >
          <Icon name="Plus" size={24} color={colors.primary.contrast} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  listContent: {
    padding: spacing.lg,
  },
  ajoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  ajoHeader: {
    marginBottom: spacing.md,
  },
  ajoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  ajoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ajoDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  ajoDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  membershipInfo: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  membershipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  membershipLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  membershipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.main,
  },
  membershipStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  acceptedBadge: {
    backgroundColor: colors.success.light,
  },
  pendingBadge: {
    backgroundColor: colors.warning.light,
  },
  declinedBadge: {
    backgroundColor: colors.error.light,
  },
  membershipStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success.main,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
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
    ...shadows.md,
  },
});

export default AjoListScreen;
