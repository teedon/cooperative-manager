import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { contributionApi, BulkApprovalSchedule, BulkApprovalPreview } from '../../api/contributionApi';
import { ContributionPlan } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'BulkApproval'>;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BulkApprovalScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  
  // State
  const [plans, setPlans] = useState<ContributionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [preview, setPreview] = useState<BulkApprovalPreview | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  // Load contribution plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await contributionApi.getPlans(cooperativeId);
        if (response.success) {
          setPlans(response.data);
        }
      } catch (error) {
        console.error('Error loading plans:', error);
      }
    };
    loadPlans();
  }, [cooperativeId]);

  // Load preview data
  const loadPreview = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await contributionApi.getSchedulesForBulkApproval(cooperativeId, {
        month: selectedMonth,
        year: selectedYear,
        planId: selectedPlanId,
      });
      if (response.success) {
        setPreview(response.data);
        setExcludedIds(new Set()); // Reset exclusions on new preview
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load schedules');
    }
    setIsLoading(false);
  }, [cooperativeId, selectedMonth, selectedYear, selectedPlanId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPreview();
    setRefreshing(false);
  };

  // Filter schedules by search query
  const filteredSchedules = useMemo(() => {
    if (!preview?.schedules) return [];
    if (!searchQuery.trim()) return preview.schedules;
    
    const query = searchQuery.toLowerCase();
    return preview.schedules.filter(schedule => {
      const memberName = `${schedule.member.user.firstName} ${schedule.member.user.lastName}`.toLowerCase();
      const email = schedule.member.user.email.toLowerCase();
      return memberName.includes(query) || email.includes(query);
    });
  }, [preview?.schedules, searchQuery]);

  // Calculate totals excluding excluded items
  const calculatedTotals = useMemo(() => {
    if (!preview?.schedules) return { count: 0, amount: 0 };
    const includedSchedules = preview.schedules.filter(s => !excludedIds.has(s.id));
    return {
      count: includedSchedules.length,
      amount: includedSchedules.reduce((sum, s) => sum + s.amount, 0),
    };
  }, [preview?.schedules, excludedIds]);

  // Toggle exclusion
  const toggleExclude = (scheduleId: string) => {
    setExcludedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  // Select/Deselect all visible
  const toggleSelectAll = () => {
    const allVisibleIds = filteredSchedules.map(s => s.id);
    const allExcluded = allVisibleIds.every(id => excludedIds.has(id));
    
    if (allExcluded) {
      // Include all visible
      setExcludedIds(prev => {
        const newSet = new Set(prev);
        allVisibleIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Exclude all visible
      setExcludedIds(prev => {
        const newSet = new Set(prev);
        allVisibleIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  // Perform bulk approval
  const handleBulkApprove = async () => {
    const toApprove = calculatedTotals.count;
    if (toApprove === 0) {
      Alert.alert('No Schedules', 'There are no schedules to approve.');
      return;
    }

    Alert.alert(
      'Confirm Bulk Approval',
      `You are about to approve ${toApprove} payment schedule(s) totaling ₦${calculatedTotals.amount.toLocaleString()}.\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          style: 'default',
          onPress: async () => {
            setIsApproving(true);
            try {
              const response = await contributionApi.bulkApproveSchedules(cooperativeId, {
                month: selectedMonth,
                year: selectedYear,
                planId: selectedPlanId,
                excludeScheduleIds: Array.from(excludedIds),
              });
              
              if (response.success) {
                Alert.alert(
                  'Success',
                  `Successfully approved ${response.data.approvedCount} payments totaling ₦${response.data.totalAmount.toLocaleString()}`,
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve payments');
            }
            setIsApproving(false);
          },
        },
      ]
    );
  };

  const renderScheduleItem = ({ item }: { item: BulkApprovalSchedule }) => {
    const isExcluded = excludedIds.has(item.id);
    const memberName = `${item.member.user.firstName} ${item.member.user.lastName}`;
    
    return (
      <TouchableOpacity
        style={[styles.scheduleItem, isExcluded && styles.excludedItem]}
        onPress={() => toggleExclude(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, !isExcluded && styles.checkboxChecked]}>
            {!isExcluded && <Icon name="check" size={14} color={colors.primary.contrast} />}
          </View>
        </View>
        
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, isExcluded && styles.excludedText]}>{memberName}</Text>
          <Text style={[styles.memberEmail, isExcluded && styles.excludedText]}>
            {item.member.user.email}
          </Text>
          {item.subscription?.plan && (
            <Text style={[styles.planName, isExcluded && styles.excludedText]}>
              {item.subscription.plan.name}
            </Text>
          )}
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, isExcluded && styles.excludedText]}>
            ₦{item.amount.toLocaleString()}
          </Text>
          <Text style={[styles.dueDate, isExcluded && styles.excludedText]}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <View style={styles.container}>
      {/* Filters Section */}
      <View style={styles.filtersSection}>
        {/* Month/Year Picker */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowMonthPicker(!showMonthPicker)}
        >
          <Icon name="calendar-outline" size={18} color={colors.primary.main} />
          <Text style={styles.filterButtonText}>
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </Text>
          <Icon name={showMonthPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* Plan Picker */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowPlanPicker(!showPlanPicker)}
        >
          <Icon name="document-text-outline" size={18} color={colors.primary.main} />
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {selectedPlan?.name || 'All Plans'}
          </Text>
          <Icon name={showPlanPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Month Picker Dropdown */}
      {showMonthPicker && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            {MONTHS.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.dropdownItem,
                  selectedMonth === index + 1 && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setSelectedMonth(index + 1);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedMonth === index + 1 && styles.dropdownItemTextSelected
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.yearSelector}>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={() => setSelectedYear(y => y - 1)}
            >
              <Icon name="chevron-back" size={20} color={colors.primary.main} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}</Text>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={() => setSelectedYear(y => y + 1)}
            >
              <Icon name="chevron-forward" size={20} color={colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Plan Picker Dropdown */}
      {showPlanPicker && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                !selectedPlanId && styles.dropdownItemSelected
              ]}
              onPress={() => {
                setSelectedPlanId(undefined);
                setShowPlanPicker(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                !selectedPlanId && styles.dropdownItemTextSelected
              ]}>
                All Plans
              </Text>
            </TouchableOpacity>
            {plans.map(plan => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.dropdownItem,
                  selectedPlanId === plan.id && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setSelectedPlanId(plan.id);
                  setShowPlanPicker(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedPlanId === plan.id && styles.dropdownItemTextSelected
                ]}>
                  {plan.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by member name or email..."
          placeholderTextColor={colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{preview?.totalCount || 0}</Text>
          <Text style={styles.summaryLabel}>Total Schedules</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.success.main }]}>
            {calculatedTotals.count}
          </Text>
          <Text style={styles.summaryLabel}>To Approve</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.error.main }]}>
            {excludedIds.size}
          </Text>
          <Text style={styles.summaryLabel}>Excluded</Text>
        </View>
      </View>

      {/* Select All / Total Amount */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
          <Icon
            name={filteredSchedules.every(s => excludedIds.has(s.id)) ? 'square-outline' : 'checkbox'}
            size={20}
            color={colors.primary.main}
          />
          <Text style={styles.selectAllText}>
            {filteredSchedules.every(s => excludedIds.has(s.id)) ? 'Select All' : 'Deselect All'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.totalAmount}>
          Total: ₦{calculatedTotals.amount.toLocaleString()}
        </Text>
      </View>

      {/* Schedules List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      ) : filteredSchedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-outline" size={64} color={colors.border.main} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching schedules found' : 'No pending schedules for this period'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSchedules}
          renderItem={renderScheduleItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Approve Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.approveButton,
            (calculatedTotals.count === 0 || isApproving) && styles.approveButtonDisabled
          ]}
          onPress={handleBulkApprove}
          disabled={calculatedTotals.count === 0 || isApproving}
        >
          {isApproving ? (
            <ActivityIndicator size="small" color={colors.primary.contrast} />
          ) : (
            <>
              <Icon name="checkmark-done" size={20} color={colors.primary.contrast} />
              <Text style={styles.approveButtonText}>
                Approve {calculatedTotals.count} Payment{calculatedTotals.count !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  filtersSection: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    gap: spacing.xs,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  dropdown: {
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    maxHeight: 250,
    ...shadows.md,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary.light + '20',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.secondary.main,
  },
  yearButton: {
    padding: spacing.sm,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectAllText: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success.main,
    ...shadows.sm,
  },
  excludedItem: {
    borderLeftColor: colors.border.main,
    backgroundColor: colors.secondary.main,
    opacity: 0.7,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  memberInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  planName: {
    fontSize: 11,
    color: colors.primary.main,
    marginTop: 4,
    fontWeight: '500',
  },
  excludedText: {
    color: colors.text.secondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success.main,
  },
  dueDate: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  bottomContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  approveButtonDisabled: {
    backgroundColor: colors.border.main,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default BulkApprovalScreen;
