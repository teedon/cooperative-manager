import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCooperatives } from '../../store/slices/cooperativeSlice';
import { colors, spacing, borderRadius } from '../../theme';
import Icon from '../../components/common/Icon';
import { useNavigation } from '@react-navigation/native';
import logger from '../../utils/logger';
import { activityApi } from '../../api/activityApi';
import { loanApi } from '../../api/loanApi';
import { Activity } from '../../models';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

// Helper function to format elapsed time
const formatElapsedTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Helper function to get icon and color for activity type
const getActivityIcon = (action: string): { icon: string; color: string } => {
  const actionMap: Record<string, { icon: string; color: string }> = {
    'auth.register': { icon: 'User', color: colors.success.main },
    'auth.login': { icon: 'Key', color: colors.primary.main },
    'cooperative.create': { icon: 'Home', color: colors.success.main },
    'cooperative.join_request': { icon: 'Plus', color: colors.accent.main },
    'member.approve': { icon: 'Check', color: colors.success.main },
    'member.approved': { icon: 'Check', color: colors.success.main },
    'member.reject': { icon: 'X', color: colors.error.main },
    'member.rejected': { icon: 'X', color: colors.error.main },
    'contribution.payment': { icon: 'DollarSign', color: colors.success.main },
    'loan.request': { icon: 'CreditCard', color: colors.warning.main },
    'loan.approved': { icon: 'Check', color: colors.success.main },
  };
  return actionMap[action] || { icon: 'Activity', color: colors.text.secondary };
};

// Custom SVG Icons for feature cards
const CooperativesIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="coopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6366f1" />
        <Stop offset="100%" stopColor="#4f46e5" />
      </LinearGradient>
    </Defs>
    <Path
      d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
      stroke="url(#coopGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="7" r="4" stroke="url(#coopGrad)" strokeWidth="2" fill="rgba(99, 102, 241, 0.1)" />
    <Path
      d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      stroke="url(#coopGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GuarantorIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="guarantorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10b981" />
        <Stop offset="100%" stopColor="#059669" />
      </LinearGradient>
    </Defs>
    <Path
      d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
      stroke="url(#guarantorGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="9"
      cy="7"
      r="4"
      stroke="url(#guarantorGrad)"
      strokeWidth="2"
    />
    <Path
      d="M22 11l-3 3m0 0l-3-3m3 3v-6"
      stroke="url(#guarantorGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LoansIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="loanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f59e0b" />
        <Stop offset="100%" stopColor="#d97706" />
      </LinearGradient>
    </Defs>
    <Path
      d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z"
      stroke="url(#loanGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="rgba(245, 158, 11, 0.1)"
    />
    <Path
      d="M1 10h22"
      stroke="url(#loanGrad)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

interface FeatureCardProps {
  title: string;
  subtitle: string;
  value: string | number;
  icon: React.ReactNode;
  gradientColors: string[];
  onPress: () => void;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  value,
  icon,
  gradientColors,
  onPress,
  delay = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.featureCardTouchable}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Decorative gradient accent */}
        <View
          style={[
            styles.featureCardAccent,
            { backgroundColor: gradientColors[0] },
          ]}
        />
        
        <View style={styles.featureCardContent}>
          <View style={[styles.featureIconContainer, { backgroundColor: `${gradientColors[0]}15` }]}>
            {icon}
          </View>
          
          <Text style={styles.featureValue}>{value}</Text>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
          
          <View style={styles.featureCardArrow}>
            <Icon name="ChevronRight" size={16} color={gradientColors[0]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Quick Action Button Component
interface QuickActionProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const LandingScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cooperatives = [], isLoading } = useAppSelector((s) => s.cooperative);
  const { user } = useAppSelector((s) => s.auth);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loanCount, setLoanCount] = useState<number>(0);

  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    dispatch(fetchCooperatives());
    
    try {
      const response = await activityApi.getRecentActivities(10);
      if (response.success && response.data) {
        setActivities(response.data);
      }
    } catch (err) {
      logger.error('ui.landing', 'Failed to fetch activities', { error: err });
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch loan counts for all cooperatives
  const fetchLoanCounts = async (coops: typeof cooperatives) => {
    if (coops.length === 0) {
      setLoanCount(0);
      return;
    }
    
    try {
      const loanPromises = coops.map((coop) => loanApi.getMyLoans(coop.id));
      const results = await Promise.all(loanPromises);
      const totalLoans = results.reduce((count, result) => {
        if (result.success && result.data) {
          return count + result.data.length;
        }
        return count;
      }, 0);
      setLoanCount(totalLoans);
    } catch (err) {
      logger.error('ui.landing', 'Failed to fetch loan counts', { error: err });
    }
  };

  useEffect(() => {
    logger.info('ui.landing.mounted', { userId: user?.id });
    // Reset local state for new user
    setActivities([]);
    setActivitiesLoading(true);
    setLoanCount(0);
    fetchData();
    
    // Animate header
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [dispatch, user?.id]);

  // Fetch loans when cooperatives are loaded
  useEffect(() => {
    if (cooperatives.length > 0) {
      fetchLoanCounts(cooperatives);
    }
  }, [cooperatives]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const navigation: any = useNavigation();

  const handleCooperatives = () => {
    if (cooperatives.length > 0) {
      // Navigate to the last joined or first cooperative as default
      const defaultCoop = cooperatives[cooperatives.length - 1];
      navigation.navigate('CooperativeDetail', { cooperativeId: defaultCoop.id });
    } else {
      navigation.navigate('Home');
    }
  };
  const handleGuarantor = () => {
    if (cooperatives.length > 0) {
      navigation.navigate('GuarantorLoans', { cooperativeId: cooperatives[0].id });
    } else {
      Alert.alert('No Cooperatives', 'Please join a cooperative first to view guarantor requests.');
    }
  };
  const handleLoans = () => {
    if (cooperatives.length > 0) {
      navigation.navigate('CooperativeDetail', { cooperativeId: cooperatives[0].id });
    } else {
      navigation.navigate('Home');
    }
  };
  const handleCreate = () => navigation.navigate('Home', { openModal: 'create' });
  const handleJoin = () => navigation.navigate('Home', { openModal: 'join' });

  // Calculate totals
  const totalMembers = cooperatives.reduce((s, c) => s + (c.memberCount ?? 0), 0);

  const renderActivityItem = (item: Activity) => {
    const { icon, color } = getActivityIcon(item.action);
    return (
      <View key={item.id} style={styles.activityItem}>
        <View style={[styles.activityIconContainer, { backgroundColor: color + '15' }]}>
          <Icon name={icon} size={16} color={color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {item.description}
          </Text>
          {item.cooperative && (
            <Text style={styles.activityCooperative}>{item.cooperative.name}</Text>
          )}
        </View>
        <Text style={styles.activityTime}>{formatElapsedTime(item.createdAt)}</Text>
      </View>
    );
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary.main]}
          tintColor={colors.primary.main}
        />
      }
    >
      {/* Header Section */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.firstName || 'Member'} 👋</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Manage your cooperatives, contributions, and loans
        </Text>
      </Animated.View>

      {/* Feature Cards */}
      <View style={styles.featureCardsContainer}>
        <View style={styles.featureCardsRow}>
          <FeatureCard
            title="Cooperatives"
            subtitle="Groups you belong to"
            value={cooperatives.length}
            icon={<CooperativesIcon size={28} />}
            gradientColors={['#6366f1', '#4f46e5']}
            onPress={handleCooperatives}
            delay={100}
          />
          <FeatureCard
            title="Guarantor"
            subtitle="Requests & approvals"
            value="—"
            icon={<GuarantorIcon size={28} />}
            gradientColors={['#10b981', '#059669']}
            onPress={handleGuarantor}
            delay={200}
          />
        </View>
        <View style={styles.featureCardsRow}>
          <FeatureCard
            title="Loans"
            subtitle="Request & manage loans"
            value={loanCount > 0 ? loanCount : '—'}
            icon={<LoansIcon size={28} />}
            gradientColors={['#f59e0b', '#d97706']}
            onPress={handleLoans}
            delay={300}
          />
          <View style={[styles.featureCard, styles.statsCard]}>
            <View style={styles.statsContent}>
              <Text style={styles.statsLabel}>Total Members</Text>
              <Text style={styles.statsValue}>{totalMembers}</Text>
              <View style={styles.statsDivider} />
              <Text style={styles.statsLabel}>Your Role</Text>
              <Text style={styles.statsRole}>
                {cooperatives.length > 0 ? 'Active' : 'Member'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      {cooperatives.length === 0 && !isLoading && (
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <Text style={styles.sectionSubtitle}>
            You're not part of any cooperative yet. Create or join one to get started.
          </Text>
          <View style={styles.quickActionsRow}>
            <QuickAction
              icon="Plus"
              label="Create Cooperative"
              color={colors.success.main}
              onPress={handleCreate}
            />
            <QuickAction
              icon="Key"
              label="Join with Code"
              color={colors.primary.main}
              onPress={handleJoin}
            />
          </View>
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {activitiesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="Activity" size={32} color={colors.text.disabled} />
            </View>
            <Text style={styles.emptyTitle}>No recent activity</Text>
            <Text style={styles.emptySubtitle}>
              Your recent actions will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {activities.slice(0, 5).map((item) => renderActivityItem(item))}
          </View>
        )}
      </View>

      {/* Bottom Padding */}
      <View style={{ height: spacing.xl * 2 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error.main,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  // Feature Cards
  featureCardsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  featureCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  featureCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  featureCardTouchable: {
    flex: 1,
  },
  featureCardAccent: {
    height: 4,
    width: '100%',
  },
  featureCardContent: {
    padding: spacing.md,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  featureSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  featureCardArrow: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  // Stats Card
  statsCard: {
    backgroundColor: colors.background.paper,
  },
  statsContent: {
    padding: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  statsLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  statsRole: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
    marginTop: 2,
  },
  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  // Activity Section
  activitySection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  activityList: {
    marginTop: spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.paper,
    marginBottom: spacing.sm,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    lineHeight: 18,
  },
  activityCooperative: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: colors.text.disabled,
    marginLeft: spacing.sm,
  },
  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

export default LandingScreen;
