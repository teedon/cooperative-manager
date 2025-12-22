import React, { useEffect, useCallback, useState } from 'react';
import { useRoute } from '@react-navigation/native';
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
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCooperatives,
  joinCooperativeByCode,
  createCooperative,
} from '../../store/slices/cooperativeSlice';
import { Cooperative, GradientPreset } from '../../models';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import logger from '../../utils/logger';
import { getGradientConfig } from '../../utils/gradients';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const CooperativeCard: React.FC<{
  cooperative: Cooperative;
  onPress: () => void;
}> = ({ cooperative, onPress }) => {
  const useGradient = cooperative.useGradient !== false;
  const gradientPreset = (cooperative.gradientPreset || 'ocean') as GradientPreset;
  const gradientConfig = getGradientConfig(gradientPreset);

  const renderBackground = () => {
    if (useGradient || !cooperative.imageUrl) {
      return (
        <LinearGradient
          colors={[...gradientConfig.colors] as [string, string, ...string[]]}
          start={{ x: gradientConfig.start.x, y: gradientConfig.start.y }}
          end={{ x: gradientConfig.end.x, y: gradientConfig.end.y }}
          style={styles.cardGradient}
        >
          <View style={styles.gradientPattern}>
            <View style={[styles.decorativeCircle, styles.circle1]} />
            <View style={[styles.decorativeCircle, styles.circle2]} />
          </View>
        </LinearGradient>
      );
    }
    return (
      <Image
        source={{ uri: cooperative.imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {renderBackground()}
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
        {cooperative.code && (
          <View style={styles.codeContainer}>
            <Icon name="Key" size={14} color={colors.primary.main} />
            <Text style={styles.codeText}>Code: {cooperative.code}</Text>
          </View>
        )}
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
            <Text style={styles.statValue}>₦{(cooperative.userTotalContributions ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>My Contributions</Text>
          </View>
        </View>
        {cooperative.memberRole && (
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>
              {cooperative.memberRole === 'admin' ? '👑 Admin' : cooperative.memberRole === 'moderator' ? '🛡️ Moderator' : '👤 Member'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

import Icon from '../../components/common/Icon';

  const QuickAction: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}> = ({ icon, label, onPress, color = colors.primary.main }) => (
  <TouchableOpacity style={styles.quickActionCompact} onPress={onPress}>
    <View style={[styles.quickActionIconCompact, { backgroundColor: color + '15' }]}> 
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.quickActionLabelCompact}>{label}</Text>
  </TouchableOpacity>
);

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { cooperatives = [], isLoading } = useAppSelector((state) => state.cooperative);
  const { user } = useAppSelector((state) => state.auth);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cooperativeCode, setCooperativeCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [newCoopData, setNewCoopData] = useState({ name: '', description: '' });

  const route: any = useRoute();

  useEffect(() => {
    // open create/join modal if requested via navigation params
    const params = route?.params as any;
    if (params?.openModal === 'create') {
      setShowCreateModal(true);
    }
    if (params?.openModal === 'join') {
      setShowJoinModal(true);
    }
  }, [route?.params]);

  const loadCooperatives = useCallback(() => {
    dispatch(fetchCooperatives());
  }, [dispatch]);

  useEffect(() => {
    loadCooperatives();
  }, [loadCooperatives, user?.id]);

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
      Alert.alert(
        'Request Submitted! 🎉',
        'Your membership request has been submitted successfully. Please wait for an admin to approve your request.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Invalid cooperative code or you are already a member';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateCooperative = async () => {
    logger.info('ui.createCoop.submit', { payload: newCoopData });
    if (!newCoopData.name.trim()) {
      logger.warn('ui.createCoop.validation', { message: 'name is required', payload: newCoopData });
      Alert.alert('Error', 'Please enter a cooperative name');
      return;
    }

    setIsJoining(true);
    try {
      logger.debug('ui.createCoop.dispatch', { payload: newCoopData });
      const createdCooperative = await dispatch(createCooperative(newCoopData)).unwrap();
      logger.info('ui.createCoop.success', { name: newCoopData.name, id: createdCooperative?.id });
      setShowCreateModal(false);
      setNewCoopData({ name: '', description: '' });
      Alert.alert(
        'Success! 🎉',
        `"${createdCooperative?.name || newCoopData.name}" has been created successfully!\n\nYou can now invite members to join your cooperative.`
      );
      loadCooperatives();
    } catch (err: any) {
      logger.debug('ui.createCoop.failure', { message: err, response: err?.response?.data });
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create cooperative';
      logger.error('ui.createCoop.failure', { message: err?.message, response: err?.response?.data });
      Alert.alert('Error', errorMessage);
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
        <TouchableOpacity style={styles.joinCooperativeCard} onPress={() => setShowJoinModal(true)} activeOpacity={0.8}>
          <View style={styles.joinCardInnerVertical}>
            <View style={[styles.joinCardIconContainer, { backgroundColor: colors.accent.main + '20' }]}> 
              <Icon name="Key" size={28} color={colors.accent.main} />
            </View>
            <View style={styles.joinCoopCenteredText}>
              <Text style={[styles.joinCooperativeTitle, { color: colors.accent.dark, textAlign: 'center' }]}>Join a Cooperative</Text>
              <Text style={[styles.joinCooperativeSubtitle, { textAlign: 'center' }]}>Enter a code to join</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createCooperativeCard}
          onPress={() => {
            logger.info('ui.createCoop.openModal', { via: 'card' });
            setShowCreateModal(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.joinCardInnerVertical}>
            <View style={[styles.joinCardIconContainer, { backgroundColor: colors.success.main + '20' }]}>
              <Icon name="Plus" size={28} color={colors.success.main} />
            </View>
            <View style={styles.joinCoopCenteredText}>
              <Text style={[styles.joinCooperativeTitle, { color: colors.success.dark, textAlign: 'center' }]}>Create Cooperative</Text>
              <Text style={[styles.joinCooperativeSubtitle, { textAlign: 'center' }]}>Start your own</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
          <QuickAction
            icon="DollarSign"
            label="Record Payment"
            onPress={() => {
              if (cooperatives.length > 0) {
                navigation.navigate('CooperativeDetail', { cooperativeId: cooperatives[0].id });
              }
            }}
            color={colors.success.main}
          />
          <QuickAction
            icon="ShoppingCart"
            label="Group Buys"
            onPress={() => {
              if (cooperatives.length > 0) {
                navigation.navigate('GroupBuyList', { cooperativeId: cooperatives[0].id });
              }
            }}
            color={colors.warning.main}
          />
          <QuickAction
            icon="CreditCard"
            label="Request Loan"
            onPress={() => {
              if (cooperatives.length > 0) {
                navigation.navigate('LoanRequest', { cooperativeId: cooperatives[0].id });
              }
            }}
            color={colors.accent.main}
          />
          <QuickAction
            icon="BarChart"
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
      <Icon name="Home" size={64} color={colors.primary.main} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No Cooperatives Yet</Text>
      <Text style={styles.emptyText}>
        You haven&apos;t joined any cooperatives yet. Join one using a cooperative code or create a
        new one.
      </Text>
      <TouchableOpacity style={[styles.joinButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} onPress={() => setShowJoinModal(true)}>
        <Icon name="Key" size={18} color={colors.accent.contrast} style={{ marginRight: 8 }} />
        <Text style={styles.joinButtonText}>Join with Code</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.createButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
        onPress={() => {
          logger.info('ui.createCoop.openModal', { via: 'emptyState' });
          setShowCreateModal(true);
        }}
      >
        <Icon name="Plus" size={18} color={colors.primary.contrast} style={{ marginRight: 8 }} />
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
        <View style={styles.modalIconContainer}>
          <View style={[styles.modalIconCircle, { backgroundColor: colors.accent.main + '20' }]}>
            <Icon name="Key" size={32} color={colors.accent.main} />
          </View>
        </View>
        <Text style={styles.modalDescription}>
          Enter the 6-digit cooperative code provided by the administrator to request membership.
        </Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cooperative Code</Text>
          <View style={styles.inputWrapper}>
            <Icon name="Hash" size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. ABC123"
              placeholderTextColor={colors.text.disabled}
              value={cooperativeCode}
              onChangeText={setCooperativeCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
          </View>
        </View>
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
            disabled={!cooperativeCode.trim() || cooperativeCode.length < 6}
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
        <View style={styles.modalIconContainer}>
          <View style={[styles.modalIconCircle, { backgroundColor: colors.success.main + '20' }]}>
            <Icon name="Plus" size={32} color={colors.success.main} />
          </View>
        </View>
        <Text style={styles.modalDescription}>
          Create a new cooperative and invite members using the unique code that will be generated.
        </Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cooperative Name</Text>
          <View style={styles.inputWrapper}>
            <Icon name="Home" size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.modalInput}
              placeholder="Enter cooperative name"
              placeholderTextColor={colors.text.disabled}
              value={newCoopData.name}
              onChangeText={(text) => {
                setNewCoopData({ ...newCoopData, name: text });
                logger.debug('ui.createCoop.input.name', { value: text });
              }}
              autoCapitalize="words"
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description <Text style={styles.optionalLabel}>(Optional)</Text></Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.modalInput, styles.textAreaInput]}
              placeholder="What is this cooperative about?"
              placeholderTextColor={colors.text.disabled}
              value={newCoopData.description}
              onChangeText={(text) => {
                setNewCoopData({ ...newCoopData, description: text });
                logger.debug('ui.createCoop.input.description', { value: text });
              }}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
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
  // compact
  actionCardsCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  quickActionCompact: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  quickActionIconCompact: { width: 44, height: 44, borderRadius: borderRadius.xl, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
  quickActionLabelCompact: { fontSize: 12, color: colors.text.secondary },
  joinCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  joinCardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  joinCardInnerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  joinCoopCenteredText: {
    marginTop: spacing.sm,
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
  cardGradient: {
    width: '100%',
    height: 120,
  },
  gradientPattern: {
    flex: 1,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: -20,
    right: -20,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: -30,
    left: 20,
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
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
    letterSpacing: 1,
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
  roleContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  roleText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
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
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  optionalLabel: {
    fontWeight: '400',
    color: colors.text.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.default,
    gap: spacing.sm,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  modalInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
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
