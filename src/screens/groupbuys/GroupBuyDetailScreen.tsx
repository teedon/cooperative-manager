import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchGroupBuy, fetchOrders, indicateInterest } from '../../store/slices/groupBuySlice';

type Props = NativeStackScreenProps<HomeStackParamList, 'GroupBuyDetail'>;

const GroupBuyDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { groupBuyId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentGroupBuy, orders, isLoading } = useAppSelector((state) => state.groupBuy);
  const { members } = useAppSelector((state) => state.cooperative);
  const { user } = useAppSelector((state) => state.auth);

  const currentMember = currentGroupBuy
    ? members.find(
        (m) => m.cooperativeId === currentGroupBuy.cooperativeId && m.userId === user?.id
      )
    : null;
  const isAdmin = currentMember?.role === 'admin';
  const myOrder = orders.find((o) => o.memberId === currentMember?.id);

  const loadData = useCallback(async () => {
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

  const handleIndicateInterest = async () => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }

    if (currentGroupBuy && qty > currentGroupBuy.availableUnits) {
      Alert.alert('Not Enough Units', `Only ${currentGroupBuy.availableUnits} units available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(indicateInterest({ groupBuyId, quantity: qty })).unwrap();
      Alert.alert('Success', 'Your interest has been recorded!');
      loadData();
    } catch {
      Alert.alert('Error', 'Failed to record interest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  const claimedUnits = currentGroupBuy.totalUnits - currentGroupBuy.availableUnits;
  const progressPercent = (claimedUnits / currentGroupBuy.totalUnits) * 100;
  const qty = parseInt(quantity) || 0;
  const subtotal = currentGroupBuy.unitPrice * qty;
  const interest = (subtotal * currentGroupBuy.interestRate) / 100;
  const total = subtotal + interest;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Image source={{ uri: currentGroupBuy.imageUrl }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentGroupBuy.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: currentGroupBuy.status === 'open' ? '#dcfce7' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: currentGroupBuy.status === 'open' ? '#16a34a' : '#64748b' },
              ]}
            >
              {currentGroupBuy.status}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{currentGroupBuy.description}</Text>

        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Unit Price</Text>
            <Text style={styles.priceValue}>${currentGroupBuy.unitPrice}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Interest Rate</Text>
            <Text style={styles.priceValue}>{currentGroupBuy.interestRate}%</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Allocation Method</Text>
            <Text style={styles.priceValue}>
              {currentGroupBuy.allocationMethod.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{claimedUnits} claimed</Text>
            <Text style={styles.progressLabel}>{currentGroupBuy.availableUnits} available</Text>
          </View>
          <Text style={styles.deadline}>
            Deadline: {new Date(currentGroupBuy.deadline).toLocaleString()}
          </Text>
        </View>

        {currentGroupBuy.status === 'open' && !myOrder && (
          <View style={styles.orderSection}>
            <Text style={styles.sectionTitle}>Indicate Your Interest</Text>
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(String(Math.max(1, qty - 1)))}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    setQuantity(
                      String(
                        Math.min(
                          qty + 1,
                          currentGroupBuy.maxUnitsPerMember || currentGroupBuy.availableUnits
                        )
                      )
                    )
                  }
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.calculationCard}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>
                  Subtotal ({qty} × ${currentGroupBuy.unitPrice})
                </Text>
                <Text style={styles.calcValue}>₦{subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Interest ({currentGroupBuy.interestRate}%)</Text>
                <Text style={styles.calcValue}>₦{interest.toLocaleString()}</Text>
              </View>
              <View style={[styles.calcRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Liability</Text>
                <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleIndicateInterest}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Interest</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {myOrder && (
          <View style={styles.myOrderSection}>
            <Text style={styles.sectionTitle}>Your Order</Text>
            <View style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Quantity</Text>
                <Text style={styles.orderValue}>{myOrder.requestedQuantity} units</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Total Liability</Text>
                <Text style={styles.orderValue}>₦{myOrder.totalLiability.toLocaleString()}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Status</Text>
                <Text style={[styles.orderValue, styles.orderStatus]}>{myOrder.status}</Text>
              </View>
            </View>
          </View>
        )}

        {isAdmin && (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('GroupBuyManagement', { groupBuyId })}
          >
            <Text style={styles.manageButtonText}>Manage Group Buy →</Text>
          </TouchableOpacity>
        )}
      </View>
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
  image: {
    width: '100%',
    height: 240,
    backgroundColor: '#e2e8f0',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  progressSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  deadline: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
  },
  orderSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  calculationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  calcLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  calcValue: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  myOrderSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
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
    fontWeight: '600',
    color: '#0f172a',
  },
  orderStatus: {
    color: '#0ea5e9',
    textTransform: 'capitalize',
  },
  manageButton: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  manageButtonText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupBuyDetailScreen;
