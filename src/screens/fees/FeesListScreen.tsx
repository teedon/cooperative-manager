import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { feeApi } from '../../api/feeApi';
import { CooperativeFee } from '../../models';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { usePermissions } from '../../hooks/usePermissions';

type Props = NativeStackScreenProps<HomeStackParamList, 'FeesList'>;

const FeesListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const [fees, setFees] = useState<CooperativeFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { canCreateFees, canApproveFeePayments } = usePermissions(cooperativeId);

  const loadFees = useCallback(async () => {
    try {
      const response = await feeApi.getFees(cooperativeId);
      if (response.success) {
        setFees(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load fees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cooperativeId]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFees();
  };

  const renderItem = ({ item }: { item: CooperativeFee }) => {
    const paid = item.myPaid || 0;
    const progress = item.amount > 0 ? Math.min(100, (paid / item.amount) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.feeCard}
        onPress={() =>
          navigation.navigate('FeePayments', {
            cooperativeId,
            feeId: item.id,
            feeName: item.name,
          })
        }
      >
        <View style={styles.feeHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.feeName}>{item.name}</Text>
            {item.description ? <Text style={styles.feeDescription}>{item.description}</Text> : null}
          </View>
          <View style={[styles.badge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.badgeText, item.isActive ? styles.activeText : styles.inactiveText]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <Text style={styles.feeAmount}>₦{item.amount.toLocaleString()}</Text>
        <Text style={styles.paidText}>My paid: ₦{paid.toLocaleString()}</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        {canCreateFees && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateFee', { cooperativeId })}
          >
            <Icon name="Plus" size={16} color={colors.white} />
            <Text style={styles.actionText}>Create Fee</Text>
          </TouchableOpacity>
        )}
        {canApproveFeePayments && (
          <TouchableOpacity
            style={[styles.actionButton, styles.approvalButton]}
            onPress={() => navigation.navigate('FeePaymentApproval', { cooperativeId })}
          >
            <Icon name="CheckCircle2" size={16} color={colors.white} />
            <Text style={styles.actionText}>Approvals</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={fees}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="Tags" size={40} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No fees yet</Text>
            <Text style={styles.emptySubtitle}>Create a fee to start collecting payments.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  approvalButton: {
    backgroundColor: colors.warning.main,
  },
  actionText: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  feeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  feeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  feeDescription: {
    marginTop: 2,
    color: colors.text.secondary,
    fontSize: 13,
  },
  feeAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  paidText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.background.paper,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.primary.main,
    borderRadius: 999,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(107,114,128,0.15)',
  },
  activeText: {
    color: '#15803d',
  },
  inactiveText: {
    color: '#6b7280',
  },
  emptyContainer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySubtitle: {
    color: colors.text.secondary,
  },
});

export default FeesListScreen;
