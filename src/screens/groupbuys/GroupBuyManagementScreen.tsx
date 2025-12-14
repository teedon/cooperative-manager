import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchGroupBuy, fetchOrders, finalizeGroupBuy } from '../../store/slices/groupBuySlice';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'GroupBuyManagement'>;

const GroupBuyManagementScreen: React.FC<Props> = ({ route }) => {
  const { groupBuyId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const { currentGroupBuy, orders, isLoading } = useAppSelector((state) => state.groupBuy);

  const loadData = useCallback(async () => {
    if (!groupBuyId) return;
    await Promise.all([dispatch(fetchGroupBuy(groupBuyId)), dispatch(fetchOrders(groupBuyId))]);
  }, [dispatch, groupBuyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFinalize = async () => {
    Alert.alert(
      'Finalize Group Buy',
      'This will allocate units to all members and create their liabilities. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          style: 'destructive',
          onPress: async () => {
            if (!groupBuyId) return;
            setIsProcessing(true);
            try {
              await dispatch(finalizeGroupBuy(groupBuyId)).unwrap();
              Alert.alert(
                'Success',
                'Group buy has been finalized. Allocations and liabilities have been created.'
              );
              loadData();
            } catch {
              Alert.alert('Error', 'Failed to finalize group buy.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading && !currentGroupBuy) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!currentGroupBuy) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Group buy not found</Text>
      </View>
    );
  }

  const totalRequested = orders.reduce((sum, o) => sum + o.requestedQuantity, 0);
  const totalLiability = orders.reduce((sum, o) => sum + o.totalLiability, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{currentGroupBuy.title}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{currentGroupBuy.status}</Text>
        </View>
      </View>

      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{orders.length}</Text>
          <Text style={styles.summaryLabel}>Orders</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalRequested}</Text>
          <Text style={styles.summaryLabel}>Units Requested</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>₦{totalLiability.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Liability</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders ({orders.length})</Text>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.memberInfo}>
                <Image
                  source={{
                    uri:
                      (order as unknown as { member?: { user?: { avatarUrl: string } } })?.member
                        ?.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          `${(order as unknown as { member?: { user?: { firstName: string; lastName: string } } })?.member?.user?.firstName || ''} ${(order as unknown as { member?: { user?: { firstName: string; lastName: string } } })?.member?.user?.lastName || ''}`
                        )}&background=4f46e5&color=fff&size=150`,
                  }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.memberName}>
                    {
                      (
                        order as unknown as {
                          member?: { user?: { firstName: string; lastName: string } };
                        }
                      )?.member?.user?.firstName
                    }{' '}
                    {
                      (
                        order as unknown as {
                          member?: { user?: { firstName: string; lastName: string } };
                        }
                      )?.member?.user?.lastName
                    }
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.orderStatusBadge}>
                <Text style={styles.orderStatusText}>{order.status}</Text>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Quantity</Text>
                <Text style={styles.orderValue}>{order.requestedQuantity} units</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Unit Price</Text>
                <Text style={styles.orderValue}>${order.unitPrice}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Interest</Text>
                <Text style={styles.orderValue}>₦{order.interestAmount.toLocaleString()}</Text>
              </View>
              <View style={[styles.orderRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Liability</Text>
                <Text style={styles.totalValue}>₦{order.totalLiability.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        ))}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        )}
      </View>

      {currentGroupBuy.status === 'open' && orders.length > 0 && (
        <TouchableOpacity
          style={[styles.finalizeButton, isProcessing && styles.buttonDisabled]}
          onPress={handleFinalize}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finalizeButtonText}>Finalize Group Buy</Text>
          )}
        </TouchableOpacity>
      )}

      {currentGroupBuy.status === 'finalized' && (
        <View style={styles.finalizedBanner}>
            <Icon name="Check" size={24} color="#166534" style={styles.finalizedIcon} />
            <Text style={styles.finalizedText}>
              This group buy has been finalized. Liabilities have been created for all members.
            </Text>
          </View>
      )}
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#0ea5e9',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  summaryCards: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  orderDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  orderStatusBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
    textTransform: 'capitalize',
  },
  orderDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  orderLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  orderValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  finalizeButton: {
    backgroundColor: '#22c55e',
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  finalizeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  finalizedBanner: {
    backgroundColor: '#dcfce7',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalizedIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  finalizedText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
});

export default GroupBuyManagementScreen;
