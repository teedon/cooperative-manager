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
import { Esusu } from '../../api/esusuApi';
import { esusuApi } from '../../api';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';

type Props = NativeStackScreenProps<HomeStackParamList, 'EsusuList'>;

const EsusuListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  
  const { isAdmin } = usePermissions(cooperativeId);

  const [esusus, setEsusus] = useState<Esusu[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEsusus = async () => {
    try {
      const data = await esusuApi.findAll(cooperativeId);
      setEsusus(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load Esusus'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEsusus();
  }, [cooperativeId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEsusus();
    setRefreshing(false);
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
    };
    return labels[frequency] || frequency;
  };

  const getOrderTypeLabel = (orderType: string) => {
    const labels: Record<string, string> = {
      random: 'Random',
      first_come: 'First Come',
      selection: 'Selection',
    };
    return labels[orderType] || orderType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success.main;
      case 'pending':
        return colors.warning.main;
      case 'completed':
        return colors.info.main;
      case 'cancelled':
        return colors.error.main;
      default:
        return colors.text.secondary;
    }
  };

  const renderEsusuItem = ({ item }: { item: Esusu }) => {
    const myMembership = item.members?.[0];
    const potAmount = item.contributionAmount * (item._count?.members || 0);
    const progress = item.totalCycles > 0 ? (item.currentCycle / item.totalCycles) * 100 : 0;

    return (
      <TouchableOpacity
        style={styles.esusuCard}
        onPress={() => navigation.navigate('EsusuDetail', { esusuId: item.id })}
      >
        <View style={styles.esusuHeader}>
          <View style={styles.esusuTitleRow}>
            <Text style={styles.esusuTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
          {item.description && (
            <Text style={styles.esusuDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>

        <View style={styles.esusuDetails}>
          <View style={styles.detailRow}>
            <Icon name="DollarSign" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>₦{item.contributionAmount.toLocaleString()}</Text>
            <Text style={styles.detailLabel}>per {getFrequencyLabel(item.frequency)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="TrendingUp" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>₦{potAmount.toLocaleString()}</Text>
            <Text style={styles.detailLabel}>pot per cycle</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="Users" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item._count?.members || 0} members</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="RefreshCw" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              Cycle {item.currentCycle} of {item.totalCycles}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="Shuffle" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{getOrderTypeLabel(item.orderType)}</Text>
          </View>
        </View>

        {item.status === 'active' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
          </View>
        )}

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
            {myMembership.status === 'accepted' && myMembership.collectionOrder && (
              <View style={styles.membershipRow}>
                <Text style={styles.membershipLabel}>Collection Position:</Text>
                <Text style={styles.membershipValue}>#{myMembership.collectionOrder}</Text>
              </View>
            )}
            {myMembership.hasCollected && (
              <View style={styles.collectedBadge}>
                <Icon name="CheckCircle" size={14} color={colors.success.main} />
                <Text style={styles.collectedText}>Collected</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="ArrowLeft" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Esusu</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('EsusuSettings', { cooperativeId })}
          >
            <Icon name="Settings" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={esusus}
        renderItem={renderEsusuItem}
        keyExtractor={(item) => item.id}
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
            <Icon name="RefreshCw" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No Esusu Plans Yet</Text>
            <Text style={styles.emptySubtext}>
              Create a rotational savings plan where members take turns collecting the pot
            </Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateEsusu', { cooperativeId })}
              >
                <Icon name="Plus" size={20} color={colors.primary.contrast} />
                <Text style={styles.createButtonText}>Create Esusu</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {isAdmin && esusus.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateEsusu', { cooperativeId })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['5xl'],
  },
  esusuCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  esusuHeader: {
    marginBottom: spacing.md,
  },
  esusuTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  esusuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
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
  esusuDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  esusuDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success.main,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  membershipInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  membershipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  membershipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  membershipStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  acceptedBadge: {
    backgroundColor: `${colors.success.main}20`,
  },
  pendingBadge: {
    backgroundColor: `${colors.warning.main}20`,
  },
  declinedBadge: {
    backgroundColor: `${colors.error.main}20`,
  },
  membershipStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  collectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  collectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.main,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
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

export default EsusuListScreen;
