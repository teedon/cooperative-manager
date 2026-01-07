import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { expenseApi, Expense } from '../../api/expenseApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'ExpenseDetail'>;

const ExpenseDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { expenseId, cooperativeId, canApprove } = route.params;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadExpense();
  }, []);

  const loadExpense = async () => {
    try {
      const response = await expenseApi.getExpense(cooperativeId, expenseId);
      if (response.success) {
        setExpense(response.data);
      }
    } catch (error) {
      console.error('Error loading expense:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadExpense();
  };

  const handleApprove = async (approved: boolean) => {
    const action = approved ? 'approve' : 'reject';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Expense`,
      `Are you sure you want to ${action} this expense?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: approved ? 'default' : 'destructive',
          onPress: async () => {
            setApproving(true);
            try {
              const response = await expenseApi.approveExpense(cooperativeId, expenseId, {
                status: approved ? 'approved' : 'rejected',
              });
              if (response.success) {
                Alert.alert('Success', `Expense ${action}d successfully`);
                loadExpense();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || `Failed to ${action} expense`);
            }
            setApproving(false);
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseApi.deleteExpense(cooperativeId, expenseId);
              Alert.alert('Success', 'Expense deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to delete expense'));
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { color: colors.success.main, bgColor: colors.success.light, icon: 'check-circle', label: 'Approved' };
      case 'rejected':
        return { color: colors.error.main, bgColor: colors.error.light, icon: 'x-circle', label: 'Rejected' };
      default:
        return { color: colors.warning.main, bgColor: colors.warning.light, icon: 'clock', label: 'Pending' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-triangle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>Expense not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadExpense}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = getStatusConfig(expense.status);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
            >
              <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            {expense.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: (expense.category.color || colors.primary.main) + '20' },
                ]}
              >
                <Icon
                  name={expense.category.icon || 'folder'}
                  size={14}
                  color={expense.category.color || colors.primary.main}
                />
                <Text
                  style={[
                    styles.categoryText,
                    { color: expense.category.color || colors.primary.main },
                  ]}
                >
                  {expense.category.name}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.expenseTitle}>{expense.title}</Text>
          <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
          
          <View style={styles.dateRow}>
            <Icon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.dateText}>
              {formatDate(expense.expenseDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Description */}
        {expense.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{expense.description}</Text>
          </View>
        )}

        {/* Vendor Info */}
        {(expense.vendorName || expense.vendorContact) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendor / Payee</Text>
            <View style={styles.detailRows}>
              {expense.vendorName && (
                <View style={styles.detailRow}>
                  <Icon name="building" size={16} color={colors.text.secondary} />
                  <Text style={styles.detailText}>{expense.vendorName}</Text>
                </View>
              )}
              {expense.vendorContact && (
                <View style={styles.detailRow}>
                  <Icon name="phone" size={16} color={colors.text.secondary} />
                  <Text style={styles.detailText}>{expense.vendorContact}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Payment Details */}
        {(expense.paymentMethod || expense.receiptNumber || expense.paymentReference) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.detailRows}>
              {expense.paymentMethod && (
                <View style={styles.detailRow}>
                  <Icon name="credit-card" size={16} color={colors.text.secondary} />
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <Text style={styles.detailValue}>
                    {expense.paymentMethod.replace('_', ' ')}
                  </Text>
                </View>
              )}
              {expense.receiptNumber && (
                <View style={styles.detailRow}>
                  <Icon name="file-text" size={16} color={colors.text.secondary} />
                  <Text style={styles.detailLabel}>Receipt #:</Text>
                  <Text style={styles.detailValue}>{expense.receiptNumber}</Text>
                </View>
              )}
              {expense.paymentReference && (
                <View style={styles.detailRow}>
                  <Icon name="hash" size={16} color={colors.text.secondary} />
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>{expense.paymentReference}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Audit Trail */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit Trail</Text>
          <View style={styles.detailRows}>
            <View style={styles.detailRow}>
              <Icon name="user" size={16} color={colors.text.secondary} />
              <Text style={styles.detailLabel}>Created by:</Text>
              <Text style={styles.detailValue}>
                {expense.createdByUser
                  ? `${expense.createdByUser.firstName} ${expense.createdByUser.lastName}`
                  : 'Unknown'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="clock" size={16} color={colors.text.secondary} />
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>
                {formatDate(expense.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            {expense.approvedBy && (
              <View style={styles.detailRow}>
                <Icon name="check-circle" size={16} color={colors.text.secondary} />
                <Text style={styles.detailLabel}>
                  {expense.status === 'approved' ? 'Approved by:' : 'Rejected by:'}
                </Text>
                <Text style={styles.detailValue}>
                  {expense.approvedByUser
                    ? `${expense.approvedByUser.firstName} ${expense.approvedByUser.lastName}`
                    : 'Unknown'}
                </Text>
              </View>
            )}
            {expense.approvedAt && (
              <View style={styles.detailRow}>
                <Icon name="calendar" size={16} color={colors.text.secondary} />
                <Text style={styles.detailLabel}>
                  {expense.status === 'approved' ? 'Approved on:' : 'Rejected on:'}
                </Text>
                <Text style={styles.detailValue}>
                  {formatDate(expense.approvedAt, { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {expense.status === 'pending' && (
        <View style={styles.footer}>
          {canApprove && (
            <View style={styles.approvalButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleApprove(false)}
                disabled={approving}
              >
                <Icon name="x-circle" size={20} color={colors.error.main} />
                <Text style={[styles.actionButtonText, { color: colors.error.main }]}>
                  Reject
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(true)}
                disabled={approving}
              >
                {approving ? (
                  <ActivityIndicator color={colors.primary.contrast} />
                ) : (
                  <>
                    <Icon name="check-circle" size={20} color={colors.primary.contrast} />
                    <Text style={[styles.actionButtonText, { color: colors.primary.contrast }]}>
                      Approve
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Icon name="trash-2" size={20} color={colors.error.main} />
            <Text style={[styles.actionButtonText, { color: colors.error.main }]}>
              Delete Expense
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.primary.contrast,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 150,
  },
  headerCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  expenseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary.main,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },
  detailRows: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 2,
    textTransform: 'capitalize',
  },
  detailText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  approvalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  approveButton: {
    backgroundColor: colors.primary.main,
  },
  rejectButton: {
    backgroundColor: colors.error.light,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  deleteButton: {
    backgroundColor: colors.error.light,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ExpenseDetailScreen;
