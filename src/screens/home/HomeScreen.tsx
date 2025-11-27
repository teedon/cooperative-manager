import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCooperatives } from '../../store/slices/cooperativeSlice';
import { Cooperative } from '../../models';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const CooperativeCard: React.FC<{
  cooperative: Cooperative;
  onPress: () => void;
}> = ({ cooperative, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <Image
      source={{ uri: cooperative.imageUrl || 'https://picsum.photos/400/200' }}
      style={styles.cardImage}
      resizeMode="cover"
    />
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{cooperative.name}</Text>
        <View style={[styles.statusBadge, cooperative.status === 'active' && styles.statusActive]}>
          <Text style={styles.statusText}>{cooperative.status}</Text>
        </View>
      </View>
      {cooperative.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {cooperative.description}
        </Text>
      )}
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cooperative.memberCount}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${cooperative.totalContributions.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Contributions</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const QuickAction: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}> = ({ icon, label, onPress, color = '#0ea5e9' }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
      <Text style={styles.quickActionEmoji}>{icon}</Text>
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { cooperatives, isLoading } = useAppSelector((state) => state.cooperative);
  const { user } = useAppSelector((state) => state.auth);

  const loadCooperatives = useCallback(() => {
    dispatch(fetchCooperatives());
  }, [dispatch]);

  useEffect(() => {
    loadCooperatives();
  }, [loadCooperatives]);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.firstName || 'User'} 👋</Text>
      </View>

      <View style={styles.quickActions}>
        <QuickAction
          icon="💰"
          label="Record Payment"
          onPress={() => {
            if (cooperatives.length > 0) {
              navigation.navigate('CooperativeDetail', { cooperativeId: cooperatives[0].id });
            }
          }}
          color="#22c55e"
        />
        <QuickAction
          icon="🛒"
          label="Group Buys"
          onPress={() => {
            if (cooperatives.length > 0) {
              navigation.navigate('GroupBuyList', { cooperativeId: cooperatives[0].id });
            }
          }}
          color="#f59e0b"
        />
        <QuickAction
          icon="💳"
          label="Request Loan"
          onPress={() => {
            if (cooperatives.length > 0) {
              navigation.navigate('LoanRequest', { cooperativeId: cooperatives[0].id });
            }
          }}
          color="#8b5cf6"
        />
        <QuickAction
          icon="📊"
          label="View Ledger"
          onPress={() => {
            if (cooperatives.length > 0) {
              navigation.navigate('Ledger', { cooperativeId: cooperatives[0].id });
            }
          }}
          color="#0ea5e9"
        />
      </View>

      <Text style={styles.sectionTitle}>My Cooperatives</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏠</Text>
      <Text style={styles.emptyTitle}>No Cooperatives Yet</Text>
      <Text style={styles.emptyText}>
        You haven&apos;t joined any cooperatives yet. Create one or ask to be invited to an existing
        cooperative.
      </Text>
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>Create Cooperative</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && cooperatives.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading cooperatives...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cooperatives}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CooperativeCard
            cooperative={item}
            onPress={() => navigation.navigate('CooperativeDetail', { cooperativeId: item.id })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadCooperatives} tintColor="#0ea5e9" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  greeting: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: '#64748b',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e2e8f0',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16a34a',
    textTransform: 'capitalize',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
