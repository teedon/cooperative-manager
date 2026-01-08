import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchLoanTypes,
  deleteLoanType,
} from '../../store/slices/loanSlice';
import { Card, Button, Badge } from '../../components/common';
import { LoanType } from '../../models';
import { formatCurrency } from '../../utils';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<any, 'LoanTypes'>;

const LoanTypesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params as { cooperativeId: string };
  const dispatch = useAppDispatch();
  const { loanTypes } = useAppSelector((state) => state.loan);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLoanTypes();
  }, [cooperativeId]);

  const loadLoanTypes = () => {
    dispatch(fetchLoanTypes(cooperativeId));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchLoanTypes(cooperativeId)).finally(() => setRefreshing(false));
  }, [cooperativeId]);

  const openCreateScreen = () => {
    navigation.navigate('CreateEditLoanType', { cooperativeId });
  };

  const openEditScreen = (loanType: LoanType) => {
    navigation.navigate('CreateEditLoanType', { cooperativeId, loanType });
  };

  const handleDelete = (loanType: LoanType) => {
    Alert.alert(
      'Delete Loan Type',
      `Are you sure you want to delete "${loanType.name}"? This cannot be undone if there are existing loans of this type.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(
                deleteLoanType({ cooperativeId, loanTypeId: loanType.id })
              ).unwrap();
              Alert.alert('Success', 'Loan type deleted');
            } catch (error: any) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to delete loan type'));
            }
          },
        },
      ]
    );
  };

  const renderLoanTypeCard = ({ item }: { item: LoanType }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description && (
            <Text style={styles.cardDescription}>{item.description}</Text>
          )}
        </View>
        <Badge
          variant={item.isActive ? 'success' : 'warning'}
          text={item.isActive ? 'Active' : 'Inactive'}
        />
      </View>

      <View style={styles.tagsContainer}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {formatCurrency(item.minAmount)} - {formatCurrency(item.maxAmount)}
          </Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {item.interestRate}% {item.interestType === 'flat' ? 'Flat' : 'Reducing'}
          </Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {item.minDuration} - {item.maxDuration} months
          </Text>
        </View>
        {item.applicationFee && item.applicationFee > 0 && (
          <View style={[styles.tag, styles.infoTag]}>
            <Text style={styles.infoTagText}>Fee: {formatCurrency(item.applicationFee)}</Text>
          </View>
        )}
        {item.deductInterestUpfront && (
          <View style={[styles.tag, styles.infoTag]}>
            <Text style={styles.infoTagText}>Upfront Interest</Text>
          </View>
        )}
        {item.requiresApproval && (
          <View style={[styles.tag, styles.warningTag]}>
            <Text style={styles.warningTagText}>Requires Approval</Text>
          </View>
        )}
        {item.requiresGuarantor && (
          <View style={[styles.tag, styles.infoTag]}>
            <Text style={styles.infoTagText}>{item.minGuarantors} Guarantor(s)</Text>
          </View>
        )}
        {item.requiresKyc && (
          <View style={[styles.tag, styles.infoTag]}>
            <Text style={styles.infoTagText}>KYC Required</Text>
          </View>
        )}
        {item.requiresMultipleApprovals && (
          <View style={[styles.tag, styles.warningTag]}>
            <Text style={styles.warningTagText}>{item.minApprovers} Approvers</Text>
          </View>
        )}
      </View>

      {item._count && (
        <Text style={styles.loanCount}>{item._count.loans} active loan(s)</Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => openEditScreen(item)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={loanTypes}
        renderItem={renderLoanTypeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No loan types configured yet.{'\n'}Create your first loan type to get started.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerDescription}>
              Configure loan products available to members of this cooperative.
            </Text>
            <Button
              title="Create Loan Type"
              onPress={openCreateScreen}
              variant="primary"
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
  },
  warningTag: {
    backgroundColor: '#fef3c7',
  },
  warningTagText: {
    fontSize: 12,
    color: '#92400e',
  },
  infoTag: {
    backgroundColor: '#dbeafe',
  },
  infoTagText: {
    fontSize: 12,
    color: '#1e40af',
  },
  loanCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoanTypesScreen;
