import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { collectionsApi, DailyCollection, CollectionTransaction } from '../../api';
import { Card, Button, Badge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';
import { getErrorMessage } from '../../utils/errorHandler';
import { List, Plus, Trash2, Send, Wallet, Receipt, PlusCircle } from 'lucide-react-native';

type Props = NativeStackScreenProps<any, 'CollectionDetails'>;

const CollectionDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { organizationId, collectionId } = route.params as {
    organizationId: string;
    collectionId: string;
  };
  const [collection, setCollection] = useState<DailyCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      setIsLoading(true);
      const response = await collectionsApi.getById(organizationId, collectionId);
      if (response.success && response.data) {
        setCollection(response.data);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load collection'));
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCollection();
    setRefreshing(false);
  }, [collectionId]);

  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction', {
      organizationId,
      collectionId,
    });
  };

  const handleSubmit = () => {
    if (!collection) return;

    if (collection.transactionCount === 0) {
      Alert.alert('Error', 'Cannot submit an empty collection. Please add at least one transaction.');
      return;
    }

    Alert.alert(
      'Submit Collection',
      'Are you sure you want to submit this collection for approval? You won\'t be able to edit it afterwards.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: performSubmit,
        },
      ]
    );
  };

  const performSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await collectionsApi.submit(organizationId, collectionId);
      if (response.success) {
        Alert.alert('Success', 'Collection submitted for approval successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to submit collection'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDeleteTransaction(transactionId),
        },
      ]
    );
  };

  const performDeleteTransaction = async (transactionId: string) => {
    try {
      await collectionsApi.deleteTransaction(organizationId, collectionId, transactionId);
      Alert.alert('Success', 'Transaction deleted');
      loadCollection();
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to delete transaction'));
    }
  };

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'contribution':
        return 'Contribution';
      case 'loan_repayment':
        return 'Loan Repayment';
      case 'ajo_payment':
        return 'AJO Payment';
      case 'esusu_contribution':
        return 'Esusu';
      case 'share_purchase':
        return 'Share Purchase';
      default:
        return type;
    }
  };

  const renderTransaction = ({ item }: { item: CollectionTransaction }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionType}>
          <Wallet
            size={20}
            color="#3498db"
          />
          <Text style={styles.transactionTypeText}>
            {getTransactionTypeLabel(item.type)}
          </Text>
        </View>
        <Text style={styles.transactionAmount}>
          {formatCurrency(item.amount)}
        </Text>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>
            {item.paymentMethod.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        {item.reference && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference:</Text>
            <Text style={styles.detailValue}>{item.reference}</Text>
          </View>
        )}
        {item.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.detailValue}>{item.notes}</Text>
          </View>
        )}
      </View>

      {collection?.status === 'draft' && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTransaction(item.id)}
        >
          <Trash2 size={18} color="#e74c3c" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>Collection Summary</Text>
            <Badge
              text={collection.status.toUpperCase()}
              variant={getStatusVariant(collection.status)}
            />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(collection.collectionDate)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(collection.totalAmount)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transactions:</Text>
            <Text style={styles.summaryValue}>
              {collection.transactionCount}
            </Text>
          </View>

          {collection.submittedAt && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Submitted:</Text>
              <Text style={styles.summaryValue}>
                {formatDate(collection.submittedAt)}
              </Text>
            </View>
          )}

          {collection.approvedAt && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Approved:</Text>
              <Text style={styles.summaryValue}>
                {formatDate(collection.approvedAt)}
              </Text>
            </View>
          )}

          {collection.rejectionReason && (
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
              <Text style={styles.rejectionText}>
                {collection.rejectionReason}
              </Text>
            </View>
          )}
        </Card>

        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Transactions</Text>
          {collection.status === 'draft' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddTransaction}
            >
              <PlusCircle size={20} color="#3498db" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {collection.transactions && collection.transactions.length > 0 ? (
          <FlatList
            data={collection.transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyTransactions}>
            <Receipt size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            {collection.status === 'draft' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleAddTransaction}
              >
                <Text style={styles.emptyButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {collection.status === 'draft' && (
        <View style={styles.footer}>
          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            onPress={handleSubmit}
            disabled={isSubmitting || collection.transactionCount === 0}
            loading={isSubmitting}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c0392b',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#e74c3c',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  transactionCard: {
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27ae60',
  },
  transactionDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#95a5a6',
  },
  detailValue: {
    fontSize: 13,
    color: '#2c3e50',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#e74c3c',
    fontWeight: '500',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
});

export default CollectionDetailsScreen;
