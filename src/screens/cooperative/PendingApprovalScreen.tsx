import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { cooperativeApi } from '../../api/cooperativeApi';
import { Cooperative, CooperativeMember } from '../../models';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, spacing } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'PendingApproval'>;

interface PendingMembership extends CooperativeMember {
  cooperative: Cooperative;
}

const PendingApprovalScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params || {};
  const [pendingMemberships, setPendingMemberships] = useState<PendingMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPendingMemberships = async () => {
    try {
      setIsLoading(true);
      const response = await cooperativeApi.getMyPendingMemberships();
      if (response.success) {
        setPendingMemberships(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load pending memberships:', error);
      Alert.alert('Error', 'Failed to load pending memberships. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingMemberships();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingMemberships();
    setRefreshing(false);
  };

  const handleCancelRequest = (membership: PendingMembership) => {
    Alert.alert(
      'Cancel Request',
      `Are you sure you want to cancel your membership request to "${membership.cooperative.name}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cooperativeApi.cancelPendingRequest(membership.cooperativeId);
              Alert.alert('Success', 'Membership request cancelled successfully');
              loadPendingMemberships();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const handleJoinDifferent = () => {
    navigation.navigate('Home', { openModal: 'join' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="CheckCircle" size={64} color={colors.success.main} />
      </View>
      <Text style={styles.emptyTitle}>No Pending Requests</Text>
      <Text style={styles.emptySubtitle}>
        You don't have any pending cooperative membership requests at the moment.
      </Text>
      <Button
        title="Join a Cooperative"
        onPress={handleJoinDifferent}
        style={styles.emptyButton}
      />
    </View>
  );

  const renderPendingCard = (membership: PendingMembership) => {
    const coop = membership.cooperative;
    const daysSinceRequest = Math.floor(
      (new Date().getTime() - new Date(membership.joinedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <View key={membership.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Pending Approval</Text>
          </View>
          <Text style={styles.timeText}>
            {daysSinceRequest === 0 ? 'Today' : `${daysSinceRequest}d ago`}
          </Text>
        </View>

        <View style={styles.coopInfo}>
          <View style={styles.coopIcon}>
            <Icon name="Home" size={24} color={colors.accent.main} />
          </View>
          <View style={styles.coopDetails}>
            <Text style={styles.coopName}>{coop.name}</Text>
            {coop.description && (
              <Text style={styles.coopDescription} numberOfLines={2}>
                {coop.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="Users" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{coop.memberCount || 0} members</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="Calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>Joined {formatDate(membership.joinedAt)}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Icon name="Info" size={16} color={colors.info.main} />
          <Text style={styles.infoText}>
            Your request is being reviewed by cooperative administrators. 
            You'll be notified once it's approved.
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelRequest(membership)}
          >
            <Icon name="X" size={18} color={colors.error.main} />
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="ArrowLeft" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading && pendingMemberships.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : pendingMemberships.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.headerInfo}>
              <Icon name="Clock" size={20} color={colors.warning.main} />
              <Text style={styles.headerInfoText}>
                {pendingMemberships.length} {pendingMemberships.length === 1 ? 'request' : 'requests'} pending
              </Text>
            </View>

            {pendingMemberships.map(renderPendingCard)}

            <View style={styles.actionsSection}>
              <Text style={styles.actionsSectionTitle}>What would you like to do?</Text>
              
              <TouchableOpacity
                style={styles.actionCard}
                onPress={handleJoinDifferent}
              >
                <View style={styles.actionIconContainer}>
                  <Icon name="Key" size={24} color={colors.accent.main} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Join Another Cooperative</Text>
                  <Text style={styles.actionDescription}>
                    Have another cooperative code? Join while you wait
                  </Text>
                </View>
                <Icon name="ChevronRight" size={20} color={colors.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Home', { openModal: 'create' })}
              >
                <View style={styles.actionIconContainer}>
                  <Icon name="Plus" size={24} color={colors.success.main} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Create Your Own Cooperative</Text>
                  <Text style={styles.actionDescription}>
                    Start your own and invite members immediately
                  </Text>
                </View>
                <Icon name="ChevronRight" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.main,
    backgroundColor: colors.background.paper,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.main + '15',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  headerInfoText: {
    fontSize: 14,
    color: colors.warning.dark,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.main + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning.main,
  },
  statusText: {
    fontSize: 12,
    color: colors.warning.dark,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  coopInfo: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  coopIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coopDetails: {
    flex: 1,
  },
  coopName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  coopDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info.main + '10',
    padding: spacing.sm,
    borderRadius: 8,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.info.dark,
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.error.main,
    fontWeight: '500',
  },
  actionsSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.main,
  },
  actionsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default PendingApprovalScreen;
