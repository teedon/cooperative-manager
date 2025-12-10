import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCooperative, fetchMembers } from '../../store/slices/cooperativeSlice';
import { fetchPlans } from '../../store/slices/contributionSlice';
import { fetchGroupBuys } from '../../store/slices/groupBuySlice';
import { fetchLoans } from '../../store/slices/loanSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'CooperativeDetail'>;

type TabType = 'overview' | 'members' | 'contributions' | 'groupbuys' | 'loans';

const CooperativeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const { currentCooperative, members, isLoading } = useAppSelector((state) => state.cooperative);
  const { plans } = useAppSelector((state) => state.contribution);
  const { groupBuys } = useAppSelector((state) => state.groupBuy);
  const { loans } = useAppSelector((state) => state.loan);
  const { user } = useAppSelector((state) => state.auth);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchCooperative(cooperativeId)),
      dispatch(fetchMembers(cooperativeId)),
      dispatch(fetchPlans(cooperativeId)),
      dispatch(fetchGroupBuys(cooperativeId)),
      dispatch(fetchLoans(cooperativeId)),
    ]);
  }, [dispatch, cooperativeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: 'Members' },
    { key: 'contributions', label: 'Contributions' },
    { key: 'groupbuys', label: 'Group Buys' },
    { key: 'loans', label: 'Loans' },
  ];

  const renderTabs = () => (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={styles.tabContainer}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOverview = () => (
    <View style={styles.section}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{currentCooperative?.memberCount || 0}</Text>
          <Text style={styles.statCardLabel}>Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            ₦{currentCooperative?.totalContributions?.toLocaleString() || 0}
          </Text>
          <Text style={styles.statCardLabel}>Total Contributions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{plans.length}</Text>
          <Text style={styles.statCardLabel}>Contribution Plans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            {groupBuys.filter((g) => g.status === 'open').length}
          </Text>
          <Text style={styles.statCardLabel}>Active Group Buys</Text>
        </View>
      </View>

      {isAdmin && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PaymentVerification', { cooperativeId })}
          >
            <Text style={styles.actionIcon}>✅</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Verify Payments</Text>
              <Text style={styles.actionSubtitle}>Review pending payment records</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Ledger', { cooperativeId })}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Ledger</Text>
              <Text style={styles.actionSubtitle}>Full cooperative financial records</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (currentMember) {
              navigation.navigate('MemberDashboard', {
                cooperativeId,
                memberId: currentMember.id,
              });
            }
          }}
        >
          <Text style={styles.actionIcon}>👤</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>My Dashboard</Text>
            <Text style={styles.actionSubtitle}>View your personal summary</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMembers = () => (
    <View style={styles.section}>
      {members.map((member) => (
        <TouchableOpacity
          key={member.id}
          style={styles.memberCard}
          onPress={() =>
            navigation.navigate('MemberDashboard', {
              cooperativeId,
              memberId: member.id,
            })
          }
        >
          <Image
            source={{
              uri:
                (member as unknown as { user?: { avatarUrl: string } }).user?.avatarUrl ||
                'https://i.pravatar.cc/150',
            }}
            style={styles.memberAvatar}
          />
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {
                (member as unknown as { user?: { firstName: string; lastName: string } }).user
                  ?.firstName
              }{' '}
              {
                (member as unknown as { user?: { firstName: string; lastName: string } }).user
                  ?.lastName
              }
            </Text>
            <Text style={styles.memberRole}>{member.role}</Text>
          </View>
          <View style={styles.memberBalance}>
            <Text style={styles.balanceValue}>${member.virtualBalance.toLocaleString()}</Text>
            <Text style={styles.balanceLabel}>Balance</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContributions = () => (
    <View style={styles.section}>
      {plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No contribution plans yet</Text>
        </View>
      ) : (
        plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={styles.planCard}
            onPress={() => navigation.navigate('ContributionPlan', { planId: plan.id })}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={[styles.badge, plan.isActive && styles.activeBadge]}>
                <Text style={styles.badgeText}>{plan.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <Text style={styles.planDescription} numberOfLines={2}>
              {plan.description || 'No description'}
            </Text>
            <View style={styles.planDetails}>
              <Text style={styles.planDetail}>
                💰{' '}
                {plan.type === 'fixed'
                  ? `$${plan.amount}`
                  : `$${plan.minAmount}-$${plan.maxAmount}`}
              </Text>
              <Text style={styles.planDetail}>📅 {plan.frequency}</Text>
              <Text style={styles.planDetail}>⏱️ {plan.duration}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderGroupBuys = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('GroupBuyList', { cooperativeId })}
      >
        <Text style={styles.viewAllText}>View All Group Buys →</Text>
      </TouchableOpacity>
      {groupBuys.slice(0, 3).map((gb) => (
        <TouchableOpacity
          key={gb.id}
          style={styles.gbCard}
          onPress={() => navigation.navigate('GroupBuyDetail', { groupBuyId: gb.id })}
        >
          <Image source={{ uri: gb.imageUrl }} style={styles.gbImage} />
          <View style={styles.gbContent}>
            <Text style={styles.gbTitle}>{gb.title}</Text>
            <Text style={styles.gbPrice}>${gb.unitPrice}/unit</Text>
            <View style={styles.gbProgress}>
              <View
                style={[
                  styles.gbProgressFill,
                  {
                    width: `${((gb.totalUnits - gb.availableUnits) / gb.totalUnits) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.gbUnits}>
              {gb.totalUnits - gb.availableUnits}/{gb.totalUnits} units claimed
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLoans = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => navigation.navigate('LoanRequest', { cooperativeId })}
      >
        <Text style={styles.requestButtonText}>+ Request New Loan</Text>
      </TouchableOpacity>

      {loans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyText}>No loans yet</Text>
        </View>
      ) : (
        loans.map((loan) => (
          <TouchableOpacity
            key={loan.id}
            style={styles.loanCard}
            onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
          >
            <View style={styles.loanHeader}>
              <Text style={styles.loanAmount}>${loan.amount.toLocaleString()}</Text>
              <View
                style={[
                  styles.loanStatus,
                  loan.status === 'approved' && styles.loanApproved,
                  loan.status === 'pending' && styles.loanPending,
                  loan.status === 'rejected' && styles.loanRejected,
                ]}
              >
                <Text style={styles.loanStatusText}>{loan.status}</Text>
              </View>
            </View>
            <Text style={styles.loanPurpose}>{loan.purpose}</Text>
            <Text style={styles.loanDetails}>
              {loan.duration} months • {loan.interestRate}% interest
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  if (isLoading && !currentCooperative) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Image
          source={{ uri: currentCooperative?.imageUrl || 'https://picsum.photos/400/200' }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>{currentCooperative?.name}</Text>
          {currentMember && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{currentMember.role}</Text>
            </View>
          )}
        </View>
      </View>

      {renderTabs()}

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'members' && renderMembers()}
      {activeTab === 'contributions' && renderContributions()}
      {activeTab === 'groupbuys' && renderGroupBuys()}
      {activeTab === 'loans' && renderLoans()}
    </ScrollView>
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
  header: {
    height: 180,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary.dark,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  roleBadge: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  roleBadgeText: {
    color: colors.primary.contrast,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tabContainer: {
    backgroundColor: colors.background.paper,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary.main,
  },
  activeTab: {
    backgroundColor: colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary.contrast,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  statCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '48%',
    ...shadows.md,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statCardLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  adminSection: {
    marginBottom: spacing['2xl'],
  },
  quickSection: {
    marginBottom: spacing['2xl'],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 20,
    color: colors.text.disabled,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary.dark,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberRole: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  memberBalance: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  balanceLabel: {
    fontSize: 10,
    color: colors.text.disabled,
  },
  planCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary.main,
  },
  activeBadge: {
    backgroundColor: colors.success.light,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.success.text,
  },
  planDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  planDetails: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  planDetail: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  viewAllButton: {
    marginBottom: spacing.md,
  },
  viewAllText: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
  gbCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  gbImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.secondary.dark,
  },
  gbContent: {
    flex: 1,
    padding: spacing.md,
  },
  gbTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  gbPrice: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  gbProgress: {
    height: 4,
    backgroundColor: colors.secondary.dark,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  gbProgressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 2,
  },
  gbUnits: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  requestButton: {
    backgroundColor: colors.primary.main,
    padding: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  requestButtonText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  loanCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  loanAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  loanStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary.main,
  },
  loanApproved: {
    backgroundColor: colors.success.light,
  },
  loanPending: {
    backgroundColor: colors.warning.light,
  },
  loanRejected: {
    backgroundColor: colors.error.light,
  },
  loanStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  loanPurpose: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  loanDetails: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default CooperativeDetailScreen;
