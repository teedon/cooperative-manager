import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchGroupBuys } from '../../store/slices/groupBuySlice';
import { GroupBuy } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'GroupBuyList'>;

const GroupBuyListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);

  const { groupBuys, isLoading } = useAppSelector((state) => state.groupBuy);
  const { members } = useAppSelector((state) => state.cooperative);
  const { user } = useAppSelector((state) => state.auth);
  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  const loadData = useCallback(async () => {
    await dispatch(fetchGroupBuys(cooperativeId));
  }, [dispatch, cooperativeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: GroupBuy['status']) => {
    switch (status) {
      case 'open':
        return '#22c55e';
      case 'closed':
        return '#f59e0b';
      case 'finalized':
        return '#0ea5e9';
      case 'completed':
        return '#6366f1';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const renderGroupBuy = ({ item }: { item: GroupBuy }) => {
    const claimedUnits = item.totalUnits - item.availableUnits;
    const progressPercent = (claimedUnits / item.totalUnits) * 100;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('GroupBuyDetail', { groupBuyId: item.id })}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.unitPrice}</Text>
            <Text style={styles.priceLabel}>/unit</Text>
            {item.interestRate > 0 && (
              <Text style={styles.interest}>+{item.interestRate}% interest</Text>
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {claimedUnits}/{item.totalUnits} units ({item.availableUnits} available)
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.deadline}>
              Deadline: {new Date(item.deadline).toLocaleDateString()}
            </Text>
            {item.status === 'open' && (
              <TouchableOpacity
                style={styles.interestButton}
                onPress={() => navigation.navigate('GroupBuyDetail', { groupBuyId: item.id })}
              >
                <Text style={styles.interestButtonText}>Show Interest</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {isAdmin && (
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Create Group Buy</Text>
        </TouchableOpacity>
      )}
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
          <Text style={[styles.filterChipText, styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Finalized</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Completed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && groupBuys.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={groupBuys}
      keyExtractor={(item) => item.id}
      renderItem={renderGroupBuy}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>No Group Buys</Text>
          <Text style={styles.emptyText}>There are no group buys available yet.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  interest: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 8,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadline: {
    fontSize: 12,
    color: '#94a3b8',
  },
  interestButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  interestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default GroupBuyListScreen;
