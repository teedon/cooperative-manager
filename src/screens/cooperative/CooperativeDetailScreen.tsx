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
  Alert,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCooperative, fetchMembers, fetchPendingMembers, approveMember, rejectMember } from '../../store/slices/cooperativeSlice';
import { fetchPlans } from '../../store/slices/contributionSlice';
import { fetchGroupBuys } from '../../store/slices/groupBuySlice';
import { fetchLoans } from '../../store/slices/loanSlice';
import { fetchSubscription } from '../../store/slices/subscriptionSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { usePermissions } from '../../hooks/usePermissions';
import { getGradientConfig } from '../../utils/gradients';
import { GradientPreset } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'CooperativeDetail'>;

type TabType = 'overview' | 'members' | 'contributions' | 'groupbuys' | 'loans';

const CooperativeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'online' | 'offline'>('all');

  const { currentCooperative, members, pendingMembers, isLoading } = useAppSelector((state) => state.cooperative);
  const { plans } = useAppSelector((state) => state.contribution);
  const { groupBuys } = useAppSelector((state) => state.groupBuy);
  const { loans } = useAppSelector((state) => state.loan);
  const { user } = useAppSelector((state) => state.auth);
  const { currentSubscription } = useAppSelector((state) => state.subscription);

  // Use permission hook
  const {
    currentMember,
    isAdmin,
    isAdminOrModerator,
    canCreateContributionPlan,
    canApprovePayments,
    canBulkApprove,
    canViewLedger,
    canViewAdmins,
    canApproveMembers,
    canEditSettings,
    canViewExpenses,
    canApproveExpenses,
  } = usePermissions(cooperativeId);

  const loadData = useCallback(async () => {
    const promises = [
      dispatch(fetchCooperative(cooperativeId)),
      dispatch(fetchMembers(cooperativeId)),
      dispatch(fetchPlans(cooperativeId)),
      dispatch(fetchGroupBuys(cooperativeId)),
      dispatch(fetchLoans(cooperativeId)),
      dispatch(fetchSubscription(cooperativeId)),
    ];
    await Promise.all(promises);
  }, [dispatch, cooperativeId]);

  // Fetch pending members when user can approve members
  useEffect(() => {
    if (canApproveMembers) {
      dispatch(fetchPendingMembers(cooperativeId));
    }
  }, [dispatch, cooperativeId, canApproveMembers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (canApproveMembers) {
      await dispatch(fetchPendingMembers(cooperativeId));
    }
    setRefreshing(false);
  };

  const handleApproveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Approve Member',
      `Are you sure you want to approve ${memberName}'s membership request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await dispatch(approveMember(memberId)).unwrap();
              Alert.alert('Success', `${memberName} has been approved as a member.`);
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to approve member');
            }
          },
        },
      ]
    );
  };

  const handleRejectMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Reject Member',
      `Are you sure you want to reject ${memberName}'s membership request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(rejectMember(memberId)).unwrap();
              Alert.alert('Success', `${memberName}'s request has been rejected.`);
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to reject member');
            }
          },
        },
      ]
    );
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

      {/* Admin/Moderator Actions - Show based on permissions */}
      {isAdminOrModerator && (
        <View style={styles.adminSection}>
          {/* Role Badge */}
          <View style={styles.roleBadgeContainer}>
            <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.moderatorBadge]}>
              <Icon name={isAdmin ? 'Shield' : 'UserCog'} size={16} color={isAdmin ? colors.warning.main : colors.primary.main} />
              <Text style={[styles.roleBadgeText, isAdmin ? styles.adminBadgeText : styles.moderatorBadgeText]}>
                {isAdmin ? 'Admin' : 'Moderator'}
              </Text>
            </View>
          </View>

          {/* Show permissions for moderators */}
          {!isAdmin && currentMember?.permissions && currentMember.permissions.length > 0 && (
            <View style={styles.permissionsContainer}>
              <Text style={styles.permissionsTitle}>Your Permissions</Text>
              <View style={styles.permissionsList}>
                {canCreateContributionPlan && (
                  <View style={styles.permissionChip}>
                    <Icon name="Plus" size={12} color={colors.success.main} />
                    <Text style={styles.permissionText}>Create Plans</Text>
                  </View>
                )}
                {canApprovePayments && (
                  <View style={styles.permissionChip}>
                    <Icon name="Check" size={12} color={colors.success.main} />
                    <Text style={styles.permissionText}>Approve Payments</Text>
                  </View>
                )}
                {canBulkApprove && (
                  <View style={styles.permissionChip}>
                    <Icon name="CheckCheck" size={12} color={colors.success.main} />
                    <Text style={styles.permissionText}>Bulk Approve</Text>
                  </View>
                )}
                {canViewLedger && (
                  <View style={styles.permissionChip}>
                    <Icon name="BarChart" size={12} color={colors.success.main} />
                    <Text style={styles.permissionText}>View Ledger</Text>
                  </View>
                )}
                {canViewExpenses && (
                  <View style={styles.permissionChip}>
                    <Icon name="Receipt" size={12} color={colors.success.main} />
                    <Text style={styles.permissionText}>Manage Expenses</Text>
                  </View>
                )}
                {canApproveMembers && (
                  <View style={styles.permissionChip}>
                    <Icon name="UserCheck" size={12} color={colors.success.main} />
                    <Text style={styles.permissionText}>Approve Members</Text>
                  </View>
                )}
                {canViewAdmins && (
                  <View style={styles.permissionChip}>
                    <Icon name="Users" size={12} color={colors.success.main} />
                    <Text style={styles.permissionText}>Manage Admins</Text>
                  </View>
                )}
                {canEditSettings && (
                  <View style={styles.permissionChip}>
                    <Icon name="Settings" size={12} color={colors.success.main} />
                    <Text style={styles.permissionText}>Edit Settings</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Admin Actions</Text>
          
          {/* Create Contribution - requires canCreateContributionPlan */}
          {canCreateContributionPlan && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CreateContribution', { cooperativeId })}
            >
              <Icon name="Plus" size={24} color={colors.primary.main} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Create Contribution</Text>
                <Text style={styles.actionSubtitle}>Set up a new contribution plan</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}
          
          {/* Verify Payments - Hidden for now
          {canApprovePayments && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('PaymentVerification', { cooperativeId })}
            >
              <Icon name="Check" size={24} color={colors.primary.main} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Verify Payments</Text>
                <Text style={styles.actionSubtitle}>Review pending payment records</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}
          */}
          
          {/* Approve Subscription Payments - requires canApprovePayments */}
          {canApprovePayments && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('PaymentApproval', { cooperativeId })}
            >
              <Icon name="CreditCard" size={24} color={colors.primary.main} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Approve Subscription Payments</Text>
                <Text style={styles.actionSubtitle}>Review member subscription payments</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}
          
          {/* Bulk Approve - requires canBulkApprove */}
          {canBulkApprove && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('BulkApproval', { cooperativeId })}
            >
              <Icon name="CheckCheck" size={24} color={colors.success.main} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Bulk Approve Schedules</Text>
                <Text style={styles.actionSubtitle}>Approve all payments for a month</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}
          
          {/* View Ledger - requires canViewLedger */}
          {canViewLedger && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Ledger', { cooperativeId })}
            >
              <Icon name="BarChart" size={24} color={colors.primary.main} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>View Ledger</Text>
                <Text style={styles.actionSubtitle}>Full cooperative financial records</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}

          {/* Manage Expenses - requires canViewExpenses */}
          {canViewExpenses && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ExpenseList', { cooperativeId })}
            >
              <Icon name="Receipt" size={24} color={colors.error.main} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Manage Expenses</Text>
                <Text style={styles.actionSubtitle}>Track and record cooperative expenses</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}
          
          {/* Manage Admins - requires canViewAdmins */}
          {canViewAdmins && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminManagement', { cooperativeId })}
            >
              <Icon name="UserCog" size={24} color={colors.warning.main} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Manage Admins</Text>
                <Text style={styles.actionSubtitle}>Add and configure admin permissions</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}

          {/* Manage Offline Members - requires canApproveMembers */}
          {canApproveMembers && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('OfflineMembers', { 
                cooperativeId, 
                cooperativeName: currentCooperative?.name || 'Cooperative'
              })}
            >
              <Icon name="Users" size={24} color={colors.info?.main || '#3B82F6'} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Offline Members</Text>
                <Text style={styles.actionSubtitle}>Manage members without mobile devices</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}

          {/* Subscription Management - requires canEditSettings */}
          {canEditSettings && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SubscriptionManagement', { cooperativeId })}
            >
              <Icon name="CreditCard" size={24} color={colors.accent?.main || '#26A69A'} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Subscription</Text>
                <Text style={styles.actionSubtitle}>Manage plan and billing</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}

          {/* Cooperative Settings - requires canEditSettings */}
          {canEditSettings && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CooperativeSettings', { cooperativeId })}
            >
              <Icon name="Settings" size={24} color={colors.neutral?.[600] || '#4B5563'} style={styles.actionIcon} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Cooperative Settings</Text>
                <Text style={styles.actionSubtitle}>Name, description, and appearance</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
            </TouchableOpacity>
          )}
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
          <Icon name="User" size={24} color={colors.primary.main} style={styles.actionIcon} />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>My Dashboard</Text>
            <Text style={styles.actionSubtitle}>View your personal summary</Text>
          </View>
          <Icon name="ChevronRight" size={20} color={colors.text.disabled} style={styles.actionArrow} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMembers = () => {
    // Filter members based on search and filter type
    const filteredMembers = members.filter((member) => {
      const memberUser = (member as unknown as { user?: { firstName: string; lastName: string } }).user;
      const memberName = member.isOfflineMember 
        ? `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase()
        : `${memberUser?.firstName || ''} ${memberUser?.lastName || ''}`.toLowerCase();
      
      // Search filter
      const matchesSearch = memberSearchQuery === '' || 
        memberName.includes(memberSearchQuery.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(memberSearchQuery.toLowerCase());
      
      // Type filter
      const matchesType = memberFilter === 'all' || 
        (memberFilter === 'offline' && member.isOfflineMember) ||
        (memberFilter === 'online' && !member.isOfflineMember);
      
      return matchesSearch && matchesType;
    });

    return (
    <View style={styles.section}>
      {/* Search and Filter */}
      <View style={styles.memberFilterContainer}>
        <View style={styles.memberSearchBar}>
          <Icon name="Search" size={18} color={colors.text.disabled} />
          <TextInput
            style={styles.memberSearchInput}
            placeholder="Search members..."
            placeholderTextColor={colors.text.disabled}
            value={memberSearchQuery}
            onChangeText={setMemberSearchQuery}
          />
          {memberSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
              <Icon name="X" size={18} color={colors.text.disabled} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterTabs}>
          {(['all', 'online', 'offline'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, memberFilter === filter && styles.filterTabActive]}
              onPress={() => setMemberFilter(filter)}
            >
              <Text style={[styles.filterTabText, memberFilter === filter && styles.filterTabTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pending Members Section - requires canApproveMembers permission */}
      {canApproveMembers && pendingMembers.length > 0 && (
        <View style={styles.pendingSection}>
          <View style={styles.pendingHeader}>
            <Icon name="Clock" size={20} color={colors.warning.main} />
            <Text style={styles.pendingTitle}>Pending Requests ({pendingMembers.length})</Text>
          </View>
          {pendingMembers.map((member) => {
            const memberUser = member.user || (member as any).user;
            const memberName = memberUser 
              ? `${memberUser.firstName} ${memberUser.lastName}`
              : 'Unknown Member';
            return (
              <View key={member.id} style={styles.pendingMemberCard}>
                <Image
                  source={{
                    uri: memberUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=4f46e5&color=fff&size=150`,
                  }}
                  style={styles.memberAvatar}
                />
                <View style={styles.pendingMemberInfo}>
                  <Text style={styles.memberName}>{memberName}</Text>
                  <Text style={styles.pendingDate}>
                    Requested {new Date(member.joinedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApproveMember(member.id, memberName)}
                  >
                    <Icon name="Check" size={18} color={colors.background.paper} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectMember(member.id, memberName)}
                  >
                    <Icon name="X" size={18} color={colors.background.paper} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Active Members */}
      <Text style={styles.sectionTitle}>
        {memberFilter === 'all' ? 'Active Members' : memberFilter === 'online' ? 'Online Members' : 'Offline Members'} ({filteredMembers.length})
      </Text>
      {filteredMembers.map((member) => {
        // Helper to get member name - handles both online and offline members
        const memberUser = (member as unknown as { user?: { firstName: string; lastName: string; avatarUrl?: string } }).user;
        const memberName = member.isOfflineMember 
          ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
          : `${memberUser?.firstName || ''} ${memberUser?.lastName || ''}`.trim();
        const avatarUrl = memberUser?.avatarUrl || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName || 'U')}&background=4f46e5&color=fff&size=150`;

        return (
          <TouchableOpacity
            key={member.id}
            style={styles.memberCard}
            onPress={() =>
              // Only allow navigation to member dashboard if admin or viewing own profile
              (isAdmin || member.userId === user?.id) &&
              navigation.navigate('MemberDashboard', {
                cooperativeId,
                memberId: member.id,
              })
            }
          >
            <Image
              source={{ uri: avatarUrl }}
              style={styles.memberAvatar}
            />
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName}>{memberName || 'Unknown Member'}</Text>
                {member.isOfflineMember && (
                  <View style={styles.offlineBadge}>
                    <Text style={styles.offlineBadgeText}>Offline</Text>
                  </View>
                )}
              </View>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
            <View style={styles.memberBalance}>
              {member.isFinancialDataHidden ? (
                <>
                  <Text style={styles.balanceHidden}>--</Text>
                  <Text style={styles.balanceLabel}>Balance</Text>
                </>
              ) : (
                <>
                  <Text style={styles.balanceValue}>₦{(member.virtualBalance ?? 0).toLocaleString()}</Text>
                  <Text style={styles.balanceLabel}>Balance</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {filteredMembers.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="Users" size={48} color={colors.text.disabled} />
          <Text style={styles.emptyText}>
            {memberSearchQuery ? 'No members match your search' : 'No members found'}
          </Text>
        </View>
      )}
    </View>
  );
  };

  const getCategoryBadgeStyle = (category: string) => {
    return category === 'compulsory' 
      ? { backgroundColor: colors.error.light } 
      : { backgroundColor: colors.success.light };
  };

  const getCategoryTextStyle = (category: string) => {
    return category === 'compulsory' 
      ? { color: colors.error.main } 
      : { color: colors.success.main };
  };

  const renderContributions = () => (
    <View style={styles.section}>
      {isAdmin && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateContribution', { cooperativeId })}
        >
          <Icon name="Plus" size={20} color={colors.primary.contrast} />
          <Text style={styles.createButtonText}>Create New Contribution</Text>
        </TouchableOpacity>
      )}
      
      {plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="Clipboard" size={48} color={colors.text.disabled} />
          <Text style={styles.emptyText}>No contribution plans yet</Text>
          {isAdmin && (
            <Text style={styles.emptyHint}>Create your first contribution plan above</Text>
          )}
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
              <View style={styles.planBadges}>
                <View style={[styles.categoryBadge, getCategoryBadgeStyle(plan.category)]}>
                  <Text style={[styles.categoryBadgeText, getCategoryTextStyle(plan.category)]}>
                    {plan.category}
                  </Text>
                </View>
                <View style={[styles.badge, plan.isActive && styles.activeBadge]}>
                  <Text style={styles.badgeText}>{plan.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.planDescription} numberOfLines={2}>
              {plan.description || 'No description'}
            </Text>
            <View style={styles.planDetails}>
              <View style={styles.planDetailRow}>
                <Icon name="DollarSign" size={14} color={colors.text.secondary} />
                <Text style={styles.planDetail}>
                  {plan.amountType === 'fixed' 
                    ? `₦${plan.fixedAmount?.toLocaleString()}` 
                    : plan.minAmount && plan.maxAmount
                      ? `₦${plan.minAmount.toLocaleString()} - ₦${plan.maxAmount.toLocaleString()}`
                      : 'Member decides'}
                </Text>
              </View>
              <View style={styles.planDetailRow}>
                <Icon name="Calendar" size={14} color={colors.text.secondary} />
                <Text style={styles.planDetail}>{plan.frequency || 'N/A'}</Text>
              </View>
              <View style={styles.planDetailRow}>
                <Icon name="Clock" size={14} color={colors.text.secondary} />
                <Text style={styles.planDetail}>{plan.contributionType}</Text>
              </View>
            </View>
            {plan._count && (
              <View style={styles.subscribersRow}>
                <Icon name="Users" size={14} color={colors.primary.main} />
                <Text style={styles.subscribersText}>
                  {plan._count.subscriptions} subscriber{plan._count.subscriptions !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.viewAllText}>View All Group Buys</Text>
          <Icon name="ChevronRight" size={16} color={colors.primary.main} style={{ marginLeft: 8 }} />
        </View>
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
            <Text style={styles.gbPrice}>₦{gb.unitPrice.toLocaleString()}/unit</Text>
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
      {/* Admin Actions */}
      {isAdmin && (
        <View style={styles.adminLoanActions}>
          <TouchableOpacity
            style={styles.adminLoanAction}
            onPress={() => navigation.navigate('LoanTypes', { cooperativeId })}
          >
            <Icon name="Settings" size={20} color={colors.primary.main} />
            <Text style={styles.adminLoanActionText}>Configure Loan Types</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminLoanAction}
            onPress={() => navigation.navigate('LoanApprovalList', { cooperativeId })}
          >
            <Icon name="CheckCircle" size={20} color={colors.primary.main} />
            <Text style={styles.adminLoanActionText}>Pending Approvals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminLoanAction, styles.adminLoanActionPrimary]}
            onPress={() => navigation.navigate('LoanInitiate', { cooperativeId })}
          >
            <Icon name="Plus" size={20} color={colors.text.inverse} />
            <Text style={styles.adminLoanActionTextPrimary}>Initiate Loan for Member</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => navigation.navigate('LoanRequest', { cooperativeId })}
      >
        <Text style={styles.requestButtonText}>+ Request New Loan</Text>
      </TouchableOpacity>

      {loans.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="CreditCard" size={48} style={styles.emptyIcon} />
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
              <Text style={styles.loanAmount}>₦{loan.amount.toLocaleString()}</Text>
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
            {loan.loanType && (
              <View style={styles.loanTypeTag}>
                <Text style={styles.loanTypeTagText}>{loan.loanType.name}</Text>
              </View>
            )}
            <Text style={styles.loanPurpose}>{loan.purpose}</Text>
            <Text style={styles.loanDetails}>
              {loan.duration} months • {loan.interestRate}% interest
            </Text>
            {loan.initiatedBy === 'admin' && (
              <View style={styles.adminInitiatedBadge}>
                <Text style={styles.adminInitiatedText}>Admin Initiated</Text>
              </View>
            )}
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

  // Show error state if no cooperative found
  if (!currentCooperative) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>Cooperative not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => dispatch(fetchCooperative(cooperativeId))}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get gradient configuration
  const useGradient = currentCooperative.useGradient !== false; // Default to true
  const gradientPreset = (currentCooperative.gradientPreset || 'ocean') as GradientPreset;
  const gradientConfig = getGradientConfig(gradientPreset);

  const renderHeaderBackground = () => {
    if (useGradient || !currentCooperative.imageUrl) {
      return (
        <LinearGradient
          colors={[...gradientConfig.colors] as [string, string, ...string[]]}
          start={{ x: gradientConfig.start.x, y: gradientConfig.start.y }}
          end={{ x: gradientConfig.end.x, y: gradientConfig.end.y }}
          style={styles.headerGradient}
        >
          <View style={styles.gradientPattern}>
            {/* Decorative circles for professional look */}
            <View style={[styles.decorativeCircle, styles.circle1]} />
            <View style={[styles.decorativeCircle, styles.circle2]} />
            <View style={[styles.decorativeCircle, styles.circle3]} />
          </View>
        </LinearGradient>
      );
    }
    return (
      <Image
        source={{ uri: currentCooperative.imageUrl }}
        style={styles.headerImage}
      />
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        {renderHeaderBackground()}
        <View style={styles.headerOverlay}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{currentCooperative.name}</Text>
            {currentCooperative.code && (
              <View style={styles.codeBadge}>
                <Icon name="Key" size={12} color={colors.text.inverse} />
                <Text style={styles.codeText}>{currentCooperative.code}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerBadgesRow}>
            {currentMember && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{currentMember.role}</Text>
              </View>
            )}
            {currentSubscription && (
              <TouchableOpacity 
                style={[
                  styles.subscriptionBadge,
                  currentSubscription.status === 'active' && styles.subscriptionBadgeActive,
                  currentSubscription.status === 'past_due' && styles.subscriptionBadgePastDue,
                  currentSubscription.status === 'cancelled' && styles.subscriptionBadgeCancelled,
                ]}
                onPress={() => navigation.navigate('SubscriptionManagement', { cooperativeId })}
              >
                <Icon 
                  name="Crown" 
                  size={12} 
                  color={colors.text.inverse} 
                  style={styles.subscriptionBadgeIcon} 
                />
                <Text style={styles.subscriptionBadgeText}>
                  {currentSubscription.plan?.name || 'Free'} Plan
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
    backgroundColor: colors.background.default,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.primary.contrast,
    fontWeight: '600',
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
  headerGradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientPattern: {
    flex: 1,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -30,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -40,
    left: -20,
  },
  circle3: {
    width: 100,
    height: 100,
    top: 40,
    left: '40%',
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
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: 'bold',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  codeText: {
    color: colors.text.inverse,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
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
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral?.[500] || '#6B7280',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  subscriptionBadgeActive: {
    backgroundColor: colors.success.main,
  },
  subscriptionBadgePastDue: {
    backgroundColor: colors.warning.main,
  },
  subscriptionBadgeCancelled: {
    backgroundColor: colors.error.main,
  },
  subscriptionBadgeIcon: {
    marginRight: spacing.xs,
  },
  subscriptionBadgeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
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
  roleBadgeContainer: {
    marginBottom: spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  adminBadge: {
    backgroundColor: colors.warning.light,
  },
  moderatorBadge: {
    backgroundColor: colors.primary.light,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  adminBadgeText: {
    color: colors.warning.dark,
  },
  moderatorBadgeText: {
    color: colors.primary.dark,
  },
  permissionsContainer: {
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  permissionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  permissionText: {
    fontSize: 11,
    color: colors.success.dark,
    fontWeight: '500',
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
  // Pending members styles
  pendingSection: {
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing['xl'],
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning.dark,
  },
  pendingMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  pendingMemberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pendingDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  approveButton: {
    backgroundColor: colors.success.main,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: colors.error.main,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  offlineBadge: {
    backgroundColor: colors.warning.light,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning.dark,
  },
  memberFilterContainer: {
    marginBottom: spacing.md,
  },
  memberSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  memberSearchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary.main,
  },
  filterTabActive: {
    backgroundColor: colors.primary.main,
  },
  filterTabText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.primary.contrast,
  },
  memberBalance: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  balanceHidden: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.disabled,
  },
  balanceLabel: {
    fontSize: 10,
    color: colors.text.disabled,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  emptyHint: {
    fontSize: 12,
    color: colors.text.disabled,
    marginTop: spacing.xs,
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  planBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    fontSize: 11,
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
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  planDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  planDetail: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  subscribersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.xs,
  },
  subscribersText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '500',
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
  adminLoanActions: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  adminLoanAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.main,
  },
  adminLoanActionPrimary: {
    backgroundColor: colors.primary.main,
    marginBottom: 0,
  },
  adminLoanActionText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.main,
  },
  adminLoanActionTextPrimary: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
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
  loanTypeTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  loanTypeTagText: {
    fontSize: 11,
    color: '#0ea5e9',
    fontWeight: '500',
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
  adminInitiatedBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  adminInitiatedText: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  smallIcon: {
    marginRight: spacing.xs,
  },
});

export default CooperativeDetailScreen;
