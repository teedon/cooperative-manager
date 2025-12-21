import React, { useEffect, useState, useCallback } from 'react';
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
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { expenseApi, Expense, ExpenseCategory, ExpenseSummary } from '../../api/expenseApi';
import { usePermissions } from '../../hooks/usePermissions';

type Props = NativeStackScreenProps<HomeStackParamList, 'ExpenseList'>;

const ExpenseListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const { canCreateExpenses, canApproveExpenses } = usePermissions(cooperativeId);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    try {
      const [expensesRes, categoriesRes, summaryRes] = await Promise.all([
        expenseApi.getExpenses(cooperativeId, {
          status: selectedStatus,
          categoryId: selectedCategory,
        }),
        expenseApi.getCategories(cooperativeId),
        expenseApi.getExpenseSummary(cooperativeId),
      ]);

      if (expensesRes.success) setExpenses(expensesRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    }
    setLoading(false);
  }, [cooperativeId, selectedStatus, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success.main;
      case 'rejected':
        return colors.error.main;
      case 'pending':
      default:
        return colors.warning.main;
    }
  };

  const renderSummaryCard = () => {
    if (!summary) return null;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Expense Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Approved</Text>
            <Text style={[styles.summaryValue, { color: colors.success.main }]}>
              ₦{summary.totalApprovedAmount.toLocaleString()}
            </Text>
            <Text style={styles.summaryCount}>{summary.totalApprovedCount} expenses</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: colors.warning.main }]}>
              ₦{summary.totalPendingAmount.toLocaleString()}
            </Text>
            <Text style={styles.summaryCount}>{summary.totalPendingCount} expenses</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.filterChips}>
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                (selectedStatus === status || (status === 'all' && !selectedStatus)) && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(status === 'all' ? undefined : status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  (selectedStatus === status || (status === 'all' && !selectedStatus)) && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onPress={() => navigation.navigate('ExpenseDetail', { cooperativeId, expenseId: item.id, canApprove: canApproveExpenses })}
    >
      <View style={[styles.categoryIndicator, { backgroundColor: item.category?.color || colors.border.main }]} />
      <View style={styles.expenseContent}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.expenseAmount}>₦{item.amount.toLocaleString()}</Text>
        </View>
        <View style={styles.expenseFooter}>
          <View style={styles.expenseMeta}>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Icon name={item.category.icon || 'folder'} size={12} color={item.category.color || colors.text.secondary} />
                <Text style={styles.categoryName}>{item.category.name}</Text>
              </View>
            )}
            <Text style={styles.expenseDate}>{formatDate(item.expenseDate)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="receipt" size={64} color={colors.border.main} />
      <Text style={styles.emptyTitle}>No Expenses Found</Text>
      <Text style={styles.emptyText}>
        {selectedStatus || selectedCategory
          ? 'No expenses match your filters'
          : 'Record your first expense to get started'}
      </Text>
      {canCreateExpenses && !selectedStatus && !selectedCategory && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateExpense', { cooperativeId })}
        >
          <Icon name="plus" size={20} color={colors.primary.contrast} />
          <Text style={styles.createButtonText}>Record Expense</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={expenses.length === 0 ? styles.emptyContainer : styles.listContent}
        ListHeaderComponent={
          <>
            {renderSummaryCard()}
            {renderFilters()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      
      {canCreateExpenses && expenses.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateExpense', { cooperativeId })}
        >
          <Icon name="plus" size={24} color={colors.primary.contrast} />
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
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  summaryCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryCount: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filterRow: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.primary.contrast,
  },
  expenseItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  categoryIndicator: {
    width: 4,
  },
  expenseContent: {
    flex: 1,
    padding: spacing.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  expenseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryName: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});

export default ExpenseListScreen;
