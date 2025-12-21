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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { 
  contributionApi, 
  ScheduleDateInfo, 
  ScheduleDateMember,
  ScheduleDateMembersResponse,
} from '../../api/contributionApi';
import { ContributionPlan } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'BulkApproval'>;

type Step = 'select-plan' | 'select-date' | 'select-members';

const BulkApprovalScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  
  // Navigation state
  const [currentStep, setCurrentStep] = useState<Step>('select-plan');
  
  // Plan selection state
  const [plans, setPlans] = useState<ContributionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ContributionPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  // Date selection state
  const [scheduleDates, setScheduleDates] = useState<ScheduleDateInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<ScheduleDateInfo | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);
  
  // Member selection state
  const [members, setMembers] = useState<ScheduleDateMember[]>([]);
  const [membersData, setMembersData] = useState<ScheduleDateMembersResponse | null>(null);
  const [excludedMemberIds, setExcludedMemberIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // General state
  const [isApproving, setIsApproving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load contribution plans
  useEffect(() => {
    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const response = await contributionApi.getPlans(cooperativeId);
        if (response.success) {
          // Filter plans that have continuous frequency (scheduled contributions)
          const continuousPlans = response.data.filter(
            plan => plan.contributionType === 'continuous' && plan.frequency && plan.isActive
          );
          setPlans(continuousPlans);
        }
      } catch (error) {
        console.error('Error loading plans:', error);
        Alert.alert('Error', 'Failed to load contribution plans');
      }
      setLoadingPlans(false);
    };
    loadPlans();
  }, [cooperativeId]);

  // Load schedule dates when plan is selected
  const loadScheduleDates = useCallback(async () => {
    if (!selectedPlan) return;
    
    setLoadingDates(true);
    try {
      const response = await contributionApi.getPlanScheduleDates(cooperativeId, selectedPlan.id);
      if (response.success) {
        setScheduleDates(response.data.scheduleDates);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load schedule dates');
    }
    setLoadingDates(false);
  }, [cooperativeId, selectedPlan]);

  useEffect(() => {
    if (selectedPlan && currentStep === 'select-date') {
      loadScheduleDates();
    }
  }, [selectedPlan, currentStep, loadScheduleDates]);

  // Load members when date is selected
  const loadMembers = useCallback(async () => {
    if (!selectedPlan || !selectedDate) return;
    
    setLoadingMembers(true);
    try {
      const response = await contributionApi.getMembersForScheduleDate(
        cooperativeId,
        selectedPlan.id,
        selectedDate.date
      );
      if (response.success) {
        setMembersData(response.data);
        setMembers(response.data.members);
        setExcludedMemberIds(new Set()); // Reset exclusions
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load members');
    }
    setLoadingMembers(false);
  }, [cooperativeId, selectedPlan, selectedDate]);

  useEffect(() => {
    if (selectedDate && currentStep === 'select-members') {
      loadMembers();
    }
  }, [selectedDate, currentStep, loadMembers]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentStep === 'select-plan') {
      // Reload plans
    } else if (currentStep === 'select-date') {
      await loadScheduleDates();
    } else if (currentStep === 'select-members') {
      await loadMembers();
    }
    setRefreshing(false);
  };

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    
    const query = searchQuery.toLowerCase();
    return members.filter(item => {
      const memberName = `${item.member.firstName} ${item.member.lastName}`.toLowerCase();
      const email = item.member.email?.toLowerCase() || '';
      return memberName.includes(query) || email.includes(query);
    });
  }, [members, searchQuery]);

  // Calculate totals for pending members (including those with missing schedules)
  const calculatedTotals = useMemo(() => {
    const pendingMembers = members.filter(m => m.status === 'pending' || m.status === 'overdue' || m.status === 'missing');
    const includedMembers = pendingMembers.filter(m => !excludedMemberIds.has(m.memberId));
    const missingCount = includedMembers.filter(m => m.status === 'missing').length;
    return {
      count: includedMembers.length,
      amount: includedMembers.reduce((sum, m) => sum + m.amount, 0),
      missingCount,
    };
  }, [members, excludedMemberIds]);

  // Toggle member exclusion
  const toggleExclude = (memberId: string) => {
    setExcludedMemberIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  // Select/Deselect all pending members (including those with missing schedules)
  const toggleSelectAll = () => {
    const pendingMemberIds = filteredMembers
      .filter(m => m.status === 'pending' || m.status === 'overdue' || m.status === 'missing')
      .map(m => m.memberId);
    const allExcluded = pendingMemberIds.every(id => excludedMemberIds.has(id));
    
    if (allExcluded) {
      setExcludedMemberIds(prev => {
        const newSet = new Set(prev);
        pendingMemberIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      setExcludedMemberIds(prev => {
        const newSet = new Set(prev);
        pendingMemberIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  // Navigation handlers
  const handleSelectPlan = (plan: ContributionPlan) => {
    setSelectedPlan(plan);
    setCurrentStep('select-date');
    setSelectedDate(null);
    setScheduleDates([]);
  };

  const handleSelectDate = (dateInfo: ScheduleDateInfo) => {
    if (dateInfo.pendingCount === 0) {
      Alert.alert('No Pending Payments', 'All members have already paid for this date.');
      return;
    }
    setSelectedDate(dateInfo);
    setCurrentStep('select-members');
    setMembers([]);
    setSearchQuery('');
  };

  const handleBack = () => {
    if (currentStep === 'select-date') {
      setCurrentStep('select-plan');
      setSelectedPlan(null);
    } else if (currentStep === 'select-members') {
      setCurrentStep('select-date');
      setSelectedDate(null);
    }
  };

  // Perform bulk approval
  const handleBulkApprove = async () => {
    if (!selectedPlan || !selectedDate) return;
    
    const toApprove = calculatedTotals.count;
    if (toApprove === 0) {
      Alert.alert('No Members', 'There are no members to approve payments for.');
      return;
    }

    const dateLabel = new Date(selectedDate.date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const missingNote = calculatedTotals.missingCount > 0 
      ? `\n\n⚠️ ${calculatedTotals.missingCount} member(s) have no schedule and will have schedules created.`
      : '';

    Alert.alert(
      'Confirm Bulk Approval',
      `You are about to mark ${toApprove} member(s) as paid for "${selectedPlan.name}" on ${dateLabel}.\n\nTotal: ₦${calculatedTotals.amount.toLocaleString()}${missingNote}\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          style: 'default',
          onPress: async () => {
            setIsApproving(true);
            try {
              const response = await contributionApi.bulkApproveByDate(cooperativeId, {
                planId: selectedPlan.id,
                scheduleDate: selectedDate.date,
                excludeMemberIds: Array.from(excludedMemberIds),
                includeMissingSchedules: true,
              });
              
              if (response.success) {
                const createdNote = response.data.createdSchedulesCount > 0
                  ? `\n${response.data.createdSchedulesCount} schedule(s) were created.`
                  : '';
                Alert.alert(
                  'Success',
                  `Successfully marked ${response.data.approvedCount} payments as paid.\nTotal: ₦${response.data.totalAmount.toLocaleString()}${createdNote}`,
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format frequency for display
  const formatFrequency = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return frequency || 'N/A';
    }
  };

  // Render plan item
  const renderPlanItem = ({ item }: { item: ContributionPlan }) => (
    <TouchableOpacity
      style={styles.planItem}
      onPress={() => handleSelectPlan(item)}
      activeOpacity={0.7}
    >
      <View style={styles.planIcon}>
        <Icon name="wallet" size={24} color={colors.primary.main} />
      </View>
      <View style={styles.planInfo}>
        <Text style={styles.planName}>{item.name}</Text>
        <Text style={styles.planMeta}>
          {formatFrequency(item.frequency)} • {item.amountType === 'fixed' ? `₦${item.fixedAmount?.toLocaleString()}` : 'Variable'}
        </Text>
        {item._count?.subscriptions !== undefined && (
          <Text style={styles.planSubscribers}>
            {item._count.subscriptions} subscriber{item._count.subscriptions !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
      <Icon name="chevron-right" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  // Render date item
  const renderDateItem = ({ item }: { item: ScheduleDateInfo }) => {
    const isPending = item.pendingCount > 0;
    const isComplete = item.pendingCount === 0 && item.paidCount > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          isComplete && styles.dateItemComplete,
          item.isToday && styles.dateItemToday,
        ]}
        onPress={() => handleSelectDate(item)}
        activeOpacity={0.7}
      >
        <View style={styles.dateLeft}>
          <View style={[
            styles.dateIndicator,
            isComplete ? styles.dateIndicatorComplete : 
            isPending ? styles.dateIndicatorPending : styles.dateIndicatorNone,
          ]}>
            <Icon 
              name={isComplete ? 'check' : 'calendar'} 
              size={16} 
              color={isComplete ? colors.success.contrast : colors.primary.main} 
            />
          </View>
          <View>
            <Text style={[styles.dateText, isComplete && styles.dateTextComplete]}>
              {formatDate(item.date)}
            </Text>
            {item.isToday && (
              <Text style={styles.todayBadge}>Today</Text>
            )}
          </View>
        </View>
        
        <View style={styles.dateRight}>
          <View style={styles.dateStats}>
            {item.pendingCount > 0 && (
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>{item.pendingCount} pending</Text>
              </View>
            )}
            {item.paidCount > 0 && (
              <View style={[styles.statBadge, styles.statBadgePaid]}>
                <Text style={[styles.statBadgeText, styles.statBadgeTextPaid]}>{item.paidCount} paid</Text>
              </View>
            )}
          </View>
          {item.pendingAmount > 0 && (
            <Text style={styles.dateAmount}>₦{item.pendingAmount.toLocaleString()}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render member item
  const renderMemberItem = ({ item }: { item: ScheduleDateMember }) => {
    const isPending = item.status === 'pending' || item.status === 'overdue' || item.status === 'missing';
    const isPaid = item.status === 'paid';
    const isMissing = item.status === 'missing';
    const isExcluded = excludedMemberIds.has(item.memberId);
    const memberName = `${item.member.firstName || ''} ${item.member.lastName || ''}`.trim() || 'Unknown';
    
    return (
      <TouchableOpacity
        style={[
          styles.memberItem,
          isPaid && styles.memberItemPaid,
          isMissing && styles.memberItemMissing,
          isExcluded && isPending && styles.memberItemExcluded,
        ]}
        onPress={() => isPending && toggleExclude(item.memberId)}
        activeOpacity={isPending ? 0.7 : 1}
        disabled={isPaid}
      >
        {isPending && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, !isExcluded && styles.checkboxChecked]}>
              {!isExcluded && <Icon name="check" size={14} color={colors.primary.contrast} />}
            </View>
          </View>
        )}
        
        {isPaid && (
          <View style={styles.paidBadgeContainer}>
            <View style={styles.paidBadge}>
              <Icon name="check-circle" size={20} color={colors.success.main} />
            </View>
          </View>
        )}
        
        <View style={styles.memberInfo}>
          <Text style={[
            styles.memberName,
            isPaid && styles.memberNamePaid,
            isExcluded && styles.memberNameExcluded,
          ]}>
            {memberName}
            {item.member.isOfflineMember && (
              <Text style={styles.offlineBadge}> (Offline)</Text>
            )}
          </Text>
          {item.member.email && (
            <Text style={[
              styles.memberEmail,
              isPaid && styles.memberEmailPaid,
            ]}>
              {item.member.email}
            </Text>
          )}
          {isMissing && (
            <View style={styles.missingBadge}>
              <Icon name="alert-circle" size={12} color={colors.warning.main} />
              <Text style={styles.missingBadgeText}>No schedule - will be created</Text>
            </View>
          )}
        </View>
        
        <View style={styles.memberAmountContainer}>
          <Text style={[
            styles.memberAmount,
            isPaid && styles.memberAmountPaid,
            isExcluded && styles.memberAmountExcluded,
          ]}>
            ₦{item.amount.toLocaleString()}
          </Text>
          <Text style={[
            styles.memberStatus, 
            isPaid && styles.memberStatusPaid,
            isMissing && styles.memberStatusMissing,
          ]}>
            {isPaid ? 'Paid' : isMissing ? 'Missing' : item.status === 'overdue' ? 'Overdue' : 'Pending'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Step indicator component
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, styles.stepActive]}>
        <Text style={styles.stepNumber}>1</Text>
      </View>
      <View style={[styles.stepLine, currentStep !== 'select-plan' && styles.stepLineActive]} />
      <View style={[styles.step, currentStep !== 'select-plan' && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep === 'select-plan' && styles.stepNumberInactive]}>2</Text>
      </View>
      <View style={[styles.stepLine, currentStep === 'select-members' && styles.stepLineActive]} />
      <View style={[styles.step, currentStep === 'select-members' && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep !== 'select-members' && styles.stepNumberInactive]}>3</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      {renderStepIndicator()}
      
      {/* Header */}
      <View style={styles.header}>
        {currentStep !== 'select-plan' && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-left" size={24} color={colors.primary.main} />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {currentStep === 'select-plan' && 'Select Contribution Plan'}
            {currentStep === 'select-date' && 'Select Payment Date'}
            {currentStep === 'select-members' && 'Confirm Members'}
          </Text>
          {selectedPlan && (
            <Text style={styles.headerSubtitle}>{selectedPlan.name}</Text>
          )}
          {selectedDate && currentStep === 'select-members' && (
            <Text style={styles.headerSubtitle}>{formatDate(selectedDate.date)}</Text>
          )}
        </View>
      </View>

      {/* Content */}
      {currentStep === 'select-plan' && (
        loadingPlans ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingText}>Loading contribution plans...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="file-text" size={64} color={colors.border.main} />
            <Text style={styles.emptyText}>No contribution plans with schedules found</Text>
            <Text style={styles.emptySubtext}>
              Create a continuous contribution plan with a frequency to use bulk approval
            </Text>
          </View>
        ) : (
          <FlatList
            data={plans}
            renderItem={renderPlanItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )
      )}

      {currentStep === 'select-date' && (
        loadingDates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingText}>Loading schedule dates...</Text>
          </View>
        ) : scheduleDates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="calendar" size={64} color={colors.border.main} />
            <Text style={styles.emptyText}>No scheduled dates found</Text>
            <Text style={styles.emptySubtext}>
              Members need to subscribe to this plan for schedules to be generated
            </Text>
          </View>
        ) : (
          <FlatList
            data={scheduleDates}
            renderItem={renderDateItem}
            keyExtractor={item => item.date}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )
      )}

      {currentStep === 'select-members' && (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by member name or email..."
              placeholderTextColor={colors.text.disabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x-circle" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Summary Stats */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{membersData?.totalMembers || 0}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
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
              <Text style={[styles.summaryValue, { color: colors.warning.main }]}>
                {excludedMemberIds.size}
              </Text>
              <Text style={styles.summaryLabel}>Excluded</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.text.secondary }]}>
                {membersData?.paidCount || 0}
              </Text>
              <Text style={styles.summaryLabel}>Already Paid</Text>
            </View>
          </View>

          {/* Select All / Total Amount */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
              <Icon
                name={
                  filteredMembers
                    .filter(m => m.status === 'pending' || m.status === 'overdue')
                    .every(m => excludedMemberIds.has(m.memberId))
                    ? 'square'
                    : 'check-square'
                }
                size={20}
                color={colors.primary.main}
              />
              <Text style={styles.selectAllText}>
                {filteredMembers
                  .filter(m => m.status === 'pending' || m.status === 'overdue')
                  .every(m => excludedMemberIds.has(m.memberId))
                  ? 'Select All'
                  : 'Deselect All'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.totalAmount}>
              Total: ₦{calculatedTotals.amount.toLocaleString()}
            </Text>
          </View>

          {/* Members List */}
          {loadingMembers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
              <Text style={styles.loadingText}>Loading members...</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="users" size={64} color={colors.border.main} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching members found' : 'No members found for this date'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMembers}
              renderItem={renderMemberItem}
              keyExtractor={item => item.scheduleId}
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
                  <Icon name="check-check" size={20} color={colors.primary.contrast} />
                  <Text style={styles.approveButtonText}>
                    Mark {calculatedTotals.count} as Paid
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  step: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: colors.primary.main,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  stepNumberInactive: {
    color: colors.text.secondary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border.main,
    marginHorizontal: spacing.xs,
  },
  stepLineActive: {
    backgroundColor: colors.primary.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary.main,
    marginTop: 2,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
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
  emptySubtext: {
    fontSize: 14,
    color: colors.text.disabled,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  // Plan items
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  planMeta: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  planSubscribers: {
    fontSize: 12,
    color: colors.primary.main,
    marginTop: 4,
  },
  // Date items
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning.main,
    ...shadows.sm,
  },
  dateItemComplete: {
    borderLeftColor: colors.success.main,
    opacity: 0.7,
  },
  dateItemToday: {
    borderLeftColor: colors.primary.main,
    backgroundColor: colors.primary.light + '10',
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.primary.light + '20',
  },
  dateIndicatorComplete: {
    backgroundColor: colors.success.main,
  },
  dateIndicatorPending: {
    backgroundColor: colors.warning.light + '20',
  },
  dateIndicatorNone: {
    backgroundColor: colors.border.light,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dateTextComplete: {
    color: colors.text.secondary,
  },
  todayBadge: {
    fontSize: 11,
    color: colors.primary.main,
    fontWeight: '600',
    marginTop: 2,
  },
  dateRight: {
    alignItems: 'flex-end',
  },
  dateStats: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.warning.light + '30',
  },
  statBadgePaid: {
    backgroundColor: colors.success.light + '30',
  },
  statBadgeText: {
    fontSize: 11,
    color: colors.warning.dark,
    fontWeight: '500',
  },
  statBadgeTextPaid: {
    color: colors.success.dark,
  },
  dateAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  // Search
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
  // Summary
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.xs,
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
  // Member items
  memberItem: {
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
  memberItemPaid: {
    borderLeftColor: colors.text.disabled,
    backgroundColor: colors.secondary.main,
    opacity: 0.6,
  },
  memberItemMissing: {
    borderLeftColor: colors.warning.main,
    backgroundColor: colors.warning.light,
  },
  memberItemExcluded: {
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
  paidBadgeContainer: {
    marginRight: spacing.md,
  },
  paidBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  memberNamePaid: {
    color: colors.text.secondary,
  },
  memberNameExcluded: {
    color: colors.text.secondary,
  },
  offlineBadge: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  memberEmail: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  memberEmailPaid: {
    color: colors.text.disabled,
  },
  memberAmountContainer: {
    alignItems: 'flex-end',
  },
  memberAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success.main,
  },
  memberAmountPaid: {
    color: colors.text.disabled,
  },
  memberAmountExcluded: {
    color: colors.text.secondary,
  },
  memberStatus: {
    fontSize: 11,
    color: colors.warning.main,
    marginTop: 2,
  },
  memberStatusPaid: {
    color: colors.text.disabled,
  },
  memberStatusMissing: {
    color: colors.warning.dark,
    fontWeight: '600',
  },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
  },
  missingBadgeText: {
    fontSize: 10,
    color: colors.warning.dark,
    marginLeft: 4,
    fontWeight: '500',
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
