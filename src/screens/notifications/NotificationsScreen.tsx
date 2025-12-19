import React, { useEffect, useCallback, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../../store/slices/notificationSlice';
import { Notification, NotificationType } from '../../models';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { HomeStackParamList } from '../../navigation/MainNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, isLoading } = useAppSelector(
    (state) => state.notification
  );
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    await dispatch(fetchNotifications({}));
  }, [dispatch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    dispatch(markAllAsRead());
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => dispatch(clearAllNotifications()),
        },
      ]
    );
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }

    // Navigate based on notification type/action
    if (notification.actionRoute && notification.actionParams) {
      const route = notification.actionRoute as keyof HomeStackParamList;
      navigation.navigate(route as any, notification.actionParams);
    } else {
      // Default navigation based on type
      handleDefaultNavigation(notification);
    }
  };

  const handleDefaultNavigation = (notification: Notification) => {
    const { type, cooperativeId, data } = notification;

    switch (type) {
      case 'contribution_reminder':
      case 'contribution_received':
      case 'contribution_approved':
      case 'contribution_rejected':
        if (cooperativeId) {
          navigation.navigate('CooperativeDetail', { cooperativeId });
        }
        break;

      case 'loan_requested':
      case 'loan_approved':
      case 'loan_rejected':
      case 'loan_disbursed':
      case 'loan_repayment_due':
      case 'loan_overdue':
        if (data?.loanId) {
          navigation.navigate('LoanDetail', { loanId: data.loanId });
        } else if (cooperativeId) {
          navigation.navigate('CooperativeDetail', { cooperativeId });
        }
        break;

      case 'groupbuy_created':
      case 'groupbuy_joined':
      case 'groupbuy_completed':
      case 'groupbuy_cancelled':
        if (data?.groupBuyId) {
          navigation.navigate('GroupBuyDetail', { groupBuyId: data.groupBuyId });
        } else if (cooperativeId) {
          navigation.navigate('GroupBuyList', { cooperativeId });
        }
        break;

      case 'member_joined':
      case 'member_approved':
      case 'member_rejected':
      case 'member_removed':
      case 'role_changed':
        if (cooperativeId) {
          navigation.navigate('CooperativeDetail', { cooperativeId });
        }
        break;

      default:
        if (cooperativeId) {
          navigation.navigate('CooperativeDetail', { cooperativeId });
        }
        break;
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteNotification(notificationId)),
        },
      ]
    );
  };

  const getNotificationIcon = (type: NotificationType): string => {
    const iconMap: Record<NotificationType, string> = {
      contribution_reminder: 'Bell',
      contribution_received: 'DollarSign',
      contribution_approved: 'CheckCircle',
      contribution_rejected: 'XCircle',
      loan_requested: 'FileText',
      loan_approved: 'CheckCircle',
      loan_rejected: 'XCircle',
      loan_disbursed: 'CreditCard',
      loan_repayment_due: 'Clock',
      loan_overdue: 'AlertTriangle',
      groupbuy_created: 'ShoppingCart',
      groupbuy_joined: 'UserPlus',
      groupbuy_completed: 'CheckCircle',
      groupbuy_cancelled: 'XCircle',
      member_joined: 'UserPlus',
      member_approved: 'UserCheck',
      member_rejected: 'UserX',
      member_removed: 'UserMinus',
      role_changed: 'Shield',
      announcement: 'Megaphone',
      mention: 'AtSign',
      system: 'Info',
    };
    return iconMap[type] || 'Bell';
  };

  const getNotificationColor = (type: NotificationType): string => {
    if (type.includes('approved') || type.includes('completed') || type.includes('received')) {
      return colors.success.main;
    }
    if (type.includes('rejected') || type.includes('cancelled') || type.includes('removed') || type.includes('overdue')) {
      return colors.error.main;
    }
    if (type.includes('reminder') || type.includes('due')) {
      return colors.warning.main;
    }
    return colors.primary.main;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleDeleteNotification(item.id)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) + '20' },
        ]}
      >
        <Icon
          name={getNotificationIcon(item.type)}
          size={20}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        {item.cooperative && (
          <View style={styles.cooperativeTag}>
            <Icon name="Building" size={12} color={colors.text.secondary} />
            <Text style={styles.cooperativeName}>{item.cooperative.name}</Text>
          </View>
        )}
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="Bell" size={64} color={colors.text.disabled} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You're all caught up! We'll notify you when something happens.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerActions}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.headerButton} onPress={handleMarkAllRead}>
          <Icon name="CheckCheck" size={18} color={colors.primary.main} />
          <Text style={styles.headerButtonText}>Mark all read</Text>
        </TouchableOpacity>
      )}
      {notifications.length > 0 && (
        <TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
          <Icon name="Trash2" size={18} color={colors.error.main} />
          <Text style={[styles.headerButtonText, { color: colors.error.main }]}>Clear all</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={notifications.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
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
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerButtonText: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  unreadItem: {
    backgroundColor: colors.primary.light + '10',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadText: {
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  body: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  cooperativeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  cooperativeName: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
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
    lineHeight: 20,
  },
});

export default NotificationsScreen;
