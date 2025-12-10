import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCooperatives, joinCooperativeByCode, createCooperative } from '../../store/slices/cooperativeSlice';
import { Cooperative } from '../../models';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

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
          <Text
            style={[styles.statusText, cooperative.status === 'active' && styles.statusTextActive]}
          >
            {cooperative.status}
          </Text>
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
          <Text style={styles.statValue}>₦{cooperative.totalContributions.toLocaleString()}</Text>
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
}> = ({ icon, label, onPress, color = colors.primary.main }) => (
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
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cooperativeCode, setCooperativeCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [newCoopData, setNewCoopData] = useState({ name: '', description: '' });

  const loadCooperatives = useCallback(() => {
    dispatch(fetchCooperatives());
  }, [dispatch]);

  useEffect(() => {
    loadCooperatives();
  }, [loadCooperatives]);

  const handleJoinCooperative = async () => {
    if (!cooperativeCode.trim()) {
      Alert.alert('Error', 'Please enter a cooperative code');
      return;
    }

    setIsJoining(true);
    try {
      await dispatch(joinCooperativeByCode(cooperativeCode.trim())).unwrap();
      setShowJoinModal(false);
      setCooperativeCode('');
      Alert.alert('Success', 'You have successfully joined the cooperative!');
      loadCooperatives();
    } catch {
      Alert.alert('Error', 'Invalid cooperative code or you are already a member');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateCooperative = async () => {
    if (!newCoopData.name.trim()) {
      Alert.alert('Error', 'Please enter a cooperative name');
      return;
    }

    setIsJoining(true);
    try {
      await dispatch(createCooperative(newCoopData)).unwrap();
      setShowCreateModal(false);
      setNewCoopData({ name: '', description: '' });
      Alert.alert('Success', 'Cooperative created successfully!');
      loadCooperatives();
    } catch {
      Alert.alert('Error', 'Failed to create cooperative');
    } finally {
      setIsJoining(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.firstName || 'User'} 👋</Text>
      </View>

      {/* Join Cooperative Section */}
      <View style={styles.actionCards}>
        <TouchableOpacity style={styles.joinCooperativeCard} onPress={() => setShowJoinModal(true)}>
          <View style={styles.joinCooperativeContent}>
            <Text style={styles.joinCooperativeIcon}>🔑</Text>
            <View style={styles.joinCooperativeText}>
              <Text style={styles.joinCooperativeTitle}>Join a Cooperative</Text>
              <Text style={styles.joinCooperativeSubtitle}>
                Enter a code to join
              </Text>
            </View>
          </View>
          <Text style={styles.joinCooperativeArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createCooperativeCard} onPress={() => setShowCreateModal(true)}>
          <View style={styles.joinCooperativeContent}>
            <Text style={styles.joinCooperativeIcon}>➕</Text>
            <View style={styles.joinCooperativeText}>
              <Text style={styles.joinCooperativeTitle}>Create Cooperative</Text>
              <Text style={styles.joinCooperativeSubtitle}>
                Start your own
              </Text>
            </View>
          </View>
          <Text style={styles.joinCooperativeArrow}>→</Text>
        </TouchableOpacity>
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
          color={colors.success.main}
        />
        <QuickAction
          icon="🛒"
          label="Group Buys"
          onPress={() => {
            if (cooperatives.length > 0) {
              navigation.navigate('GroupBuyList', { cooperativeId: cooperatives[0].id });
            }
          }}
          color={colors.warning.main}
        />
        <QuickAction
          icon="💳"
          label="Request Loan"
          onPress={() => {
            if (cooperatives.length > 0) {
              navigation.navigate('LoanRequest', { cooperativeId: cooperatives[0].id });
            }
          }}
          color={colors.accent.main}
        />
        <QuickAction
          icon="📊"
          label="View Ledger"
          onPress={() => {
            if (cooperatives.length > 0) {
              navigation.navigate('Ledger', { cooperativeId: cooperatives[0].id });
            }
          }}
          color={colors.primary.main}
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
        You haven&apos;t joined any cooperatives yet. Join one using a cooperative code or create a
        new one.
      </Text>
      <TouchableOpacity style={styles.joinButton} onPress={() => setShowJoinModal(true)}>
        <Text style={styles.joinButtonText}>Join with Code</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
        <Text style={styles.createButtonText}>Create Cooperative</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && cooperatives.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
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
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadCooperatives}
            tintColor={colors.primary.main}
          />
        }
      />

      {/* Join Cooperative Modal */}
      <Modal
        visible={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          setCooperativeCode('');
        }}
        title="Join Cooperative"
      >
        <Text style={styles.modalDescription}>
          Enter the cooperative code provided by the cooperative administrator to join.
        </Text>
        <TextInput
          style={styles.codeInput}
          placeholder="Enter cooperative code"
          placeholderTextColor={colors.text.disabled}
          value={cooperativeCode}
          onChangeText={setCooperativeCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <View style={styles.modalButtons}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => {
              setShowJoinModal(false);
              setCooperativeCode('');
            }}
            style={styles.modalButton}
          />
          <Button
            title="Join"
            onPress={handleJoinCooperative}
            loading={isJoining}
            disabled={!cooperativeCode.trim()}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Create Cooperative Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewCoopData({ name: '', description: '' });
        }}
        title="Create Cooperative"
      >
        <Text style={styles.modalDescription}>
          Create a new cooperative and invite members to join.
        </Text>
        <TextInput
          style={styles.codeInput}
          placeholder="Cooperative Name"
          placeholderTextColor={colors.text.disabled}
          value={newCoopData.name}
          onChangeText={(text) => setNewCoopData({ ...newCoopData, name: text })}
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.codeInput, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor={colors.text.disabled}
          value={newCoopData.description}
          onChangeText={(text) => setNewCoopData({ ...newCoopData, description: text })}
          multiline={true}
          numberOfLines={3}
        />
        <View style={styles.modalButtons}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => {
              setShowCreateModal(false);
              setNewCoopData({ name: '', description: '' });
            }}
            style={styles.modalButton}
          />
          <Button
            title="Create"
            onPress={handleCreateCooperative}
            loading={isJoining}
            disabled={!newCoopData.name.trim()}
            style={styles.modalButton}
          />
        </View>
      </Modal>
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
    backgroundColor: colors.background.default,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  greeting: {
    marginBottom: spacing['2xl'],
  },
  greetingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  // Join Cooperative Card
  actionCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  joinCooperativeCard: {
    flex: 1,
    backgroundColor: colors.accent.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.main,
  },
  createCooperativeCard: {
    flex: 1,
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success.main,
  },
  joinCooperativeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  joinCooperativeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  joinCooperativeText: {
    flex: 1,
  },
  joinCooperativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.dark,
    marginBottom: 2,
  },
  joinCooperativeSubtitle: {
    fontSize: 12,
    color: colors.accent.dark,
    opacity: 0.8,
  },
  joinCooperativeArrow: {
    fontSize: 20,
    color: colors.accent.dark,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.secondary.dark,
  },
  cardContent: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary.main,
  },
  statusActive: {
    backgroundColor: colors.success.light,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  statusTextActive: {
    color: colors.success.text,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
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
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.disabled,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing['5xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing['2xl'],
  },
  joinButton: {
    backgroundColor: colors.accent.main,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  joinButtonText: {
    color: colors.accent.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
    backgroundColor: colors.secondary.light,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  textArea: {
    height: 80,
    textAlign: 'left',
    letterSpacing: 0,
    fontWeight: 'normal',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default HomeScreen;
