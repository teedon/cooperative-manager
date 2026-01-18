import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { formatCurrency, formatDate } from '../../utils';
import { loanApi } from '../../api/loanApi';
import { getErrorMessage } from '../../utils/errorHandler';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'PendingLiquidations'>;

const PendingLiquidationsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liquidations, setLiquidations] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingLiquidations();
  }, [cooperativeId]);

  const fetchPendingLiquidations = async () => {
    try {
      setLoading(true);
      const response = await loanApi.getPendingLiquidations(cooperativeId);
      if (response.success && response.data) {
        setLiquidations(response.data);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingLiquidations();
  }, [cooperativeId]);

  const handleLiquidationPress = (liquidation: any) => {
    navigation.navigate('LiquidationDetail', {
      loanId: liquidation.loanId,
      liquidationId: liquidation.id,
    });
  };

  const renderLiquidationItem = ({ item }: { item: any }) => {
    const member = item.loan?.member;
    const memberName = member?.user
      ? `${member.user.firstName} ${member.user.lastName}`
      : member?.firstName && member?.lastName
      ? `${member.firstName} ${member.lastName}`
      : 'Unknown Member';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleLiquidationPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            <Icon name="person" size={20} color="#007AFF" />
            <Text style={styles.memberName}>{memberName}</Text>
          </View>
          <View style={[styles.badge, styles.pendingBadge]}>
            <Text style={styles.badgeText}>Pending</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Liquidation Type:</Text>
            <Text style={styles.detailValue}>
              {item.liquidationType === 'complete' ? 'Complete' : 'Partial'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={[styles.detailValue, styles.amount]}>
              {formatCurrency(item.finalAmount)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Outstanding Balance:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.outstandingBalance)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested:</Text>
            <Text style={styles.detailValue}>
              {formatDate(new Date(item.requestedAt))}
            </Text>
          </View>
          {item.paymentMethod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method:</Text>
              <Text style={styles.detailValue}>
                {item.paymentMethod.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Icon name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading pending liquidations...</Text>
      </View>
    );
  }

  if (liquidations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="checkmark-circle" size={64} color="#4caf50" />
        <Text style={styles.emptyTitle}>No Pending Liquidations</Text>
        <Text style={styles.emptyText}>
          All liquidation requests have been processed.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={liquidations}
        renderItem={renderLiquidationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
  cardBody: {
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  amount: {
    color: '#007AFF',
    fontWeight: '600',
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});

export default PendingLiquidationsScreen;
