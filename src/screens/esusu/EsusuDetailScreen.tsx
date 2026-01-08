import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { esusuApi, Esusu, EsusuMember, EsusuContribution, EsusuCollection, CycleStatus } from '../../api/esusuApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppSelector } from '../../store/hooks';

type Props = NativeStackScreenProps<HomeStackParamList, 'EsusuDetail'>;

type TabType = 'info' | 'members' | 'cycle' | 'history';

const EsusuDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { esusuId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [esusu, setEsusu] = useState<Esusu | null>(null);
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [cooperativeId, setCooperativeId] = useState<string>('');
  const [respondingToInvitation, setRespondingToInvitation] = useState(false);
  const [determiningOrder, setDeterminingOrder] = useState(false);
  const [showSlotSelection, setShowSlotSelection] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const { isAdmin } = usePermissions(cooperativeId);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    loadEsusu();
  }, []);

  useEffect(() => {
    if (activeTab === 'cycle' && esusu?.status === 'active') {
      loadCycleStatus();
    }
  }, [activeTab, esusu?.status]);

  const loadEsusu = async () => {
    try {
      setLoading(true);
      const data = await esusuApi.findOne(esusuId);
      setEsusu(data);
      setCooperativeId(data.cooperativeId);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadCycleStatus = async () => {
    try {
      const data = await esusuApi.getCycleStatus(esusuId);
      setCycleStatus(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEsusu();
    if (activeTab === 'cycle' && esusu?.status === 'active') {
      await loadCycleStatus();
    }
    setRefreshing(false);
  };

  const handleRespondToInvitation = async (status: 'accepted' | 'declined') => {
    // If accepting and order type is first_come, show slot selection
    if (status === 'accepted' && esusu?.orderType === 'first_come') {
      try {
        const slots = await esusuApi.getAvailableSlots(esusuId);
        setAvailableSlots(slots);
        setShowSlotSelection(true);
      } catch (error) {
        Alert.alert('Error', getErrorMessage(error, 'Failed to load available slots'));
      }
      return;
    }

    // For declined or non-first_come, proceed directly
    try {
      setRespondingToInvitation(true);
      await esusuApi.respondToInvitation(esusuId, status);
      Alert.alert(
        'Success',
        `You have ${status === 'accepted' ? 'accepted' : 'declined'} the invitation`,
        [{ text: 'OK', onPress: () => loadEsusu() }]
      );
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setRespondingToInvitation(false);
    }
  };

  const handleConfirmSlotSelection = async () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a slot');
      return;
    }

    try {
      setRespondingToInvitation(true);
      await esusuApi.respondToInvitation(esusuId, 'accepted', selectedSlot);
      setShowSlotSelection(false);
      Alert.alert(
        'Success',
        `You have accepted the invitation and selected slot #${selectedSlot}`,
        [{ text: 'OK', onPress: () => loadEsusu() }]
      );
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setRespondingToInvitation(false);
    }
  };

  const handleDetermineOrder = async () => {
    if (!esusu) return;

    Alert.alert(
      'Determine Order',
      `This will ${esusu.orderType === 'random' ? 'randomly assign' : 'assign based on acceptance order'} the collection order and activate the Esusu. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          style: 'default',
          onPress: async () => {
            try {
              setDeterminingOrder(true);
              await esusuApi.determineOrder(esusuId);
              Alert.alert('Success', 'Collection order has been determined and Esusu is now active');
              await loadEsusu();
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error));
            } finally {
              setDeterminingOrder(false);
            }
          },
        },
      ]
    );
  };

  const getMyMembership = (): EsusuMember | null => {
    if (!esusu?.members || !user?.id) return null;
    // Find the current user's membership by matching user ID
    return esusu.members.find(m => m.member?.user?.id === user.id) || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success.main;
      case 'completed': return colors.info.main;
      case 'cancelled': return colors.error.main;
      default: return colors.warning.main;
    }
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return colors.success.main;
      case 'pending': return colors.warning.main;
      case 'declined': return colors.error.main;
      default: return colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getOrderTypeLabel = (orderType: string) => {
    switch (orderType) {
      case 'random': return 'Random';
      case 'first_come': return 'First Come First Serve';
      case 'selection': return 'Manual Selection';
      default: return orderType;
    }
  };

  const renderInfo = () => {
    if (!esusu) return null;

    const myMembership = getMyMembership();
    const acceptedMembers = esusu.members?.filter(m => m.status === 'accepted').length || 0;
    const potAmount = esusu.contributionAmount * acceptedMembers;
    const progress = esusu.totalCycles > 0 ? (esusu.currentCycle / esusu.totalCycles) * 100 : 0;

    return (
      <View style={styles.tabContent}>
        {/* Show invitation response buttons if user has pending invitation */}
        {myMembership && myMembership.status === 'pending' && (
          <View style={styles.invitationCard}>
            <View style={styles.invitationHeader}>
              <Icon name="mail" size={24} color={colors.warning.main} />
              <Text style={styles.invitationTitle}>Pending Invitation</Text>
            </View>
            <Text style={styles.invitationText}>
              You have been invited to join this Esusu plan. Please respond by {formatDate(esusu.invitationDeadline)}.
            </Text>
            <View style={styles.invitationButtons}>
              <TouchableOpacity
                style={[styles.invitationButton, styles.declineButton]}
                onPress={() => handleRespondToInvitation('declined')}
                disabled={respondingToInvitation}
              >
                {respondingToInvitation ? (
                  <ActivityIndicator size="small" color={colors.error.main} />
                ) : (
                  <>
                    <Icon name="close-circle" size={20} color={colors.error.main} />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.invitationButton, styles.acceptButton]}
                onPress={() => handleRespondToInvitation('accepted')}
                disabled={respondingToInvitation}
              >
                {respondingToInvitation ? (
                  <ActivityIndicator size="small" color={colors.primary.contrast} />
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={20} color={colors.primary.contrast} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Show determine order button if admin and pending (for random/first_come) */}
        {isAdmin && esusu.status === 'pending' && !esusu.isOrderDetermined && acceptedMembers >= 3 && esusu.orderType !== 'selection' && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleDetermineOrder}
            disabled={determiningOrder}
          >
            <View style={styles.actionCardContent}>
              <Icon name="shuffle" size={24} color={colors.primary.main} />
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Determine Collection Order</Text>
                <Text style={styles.actionCardDescription}>
                  {acceptedMembers} members have accepted. Click to determine order and activate the Esusu.
                </Text>
              </View>
            </View>
            {determiningOrder && <ActivityIndicator size="small" color={colors.primary.main} />}
          </TouchableOpacity>
        )}

        {/* Show set order button if creator and pending (for selection type) */}
        {user && esusu.createdBy === user.id && esusu.status === 'pending' && !esusu.isOrderDetermined && acceptedMembers >= 3 && esusu.orderType === 'selection' && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('SetEsusuOrder', { esusuId: esusu.id })}
          >
            <View style={styles.actionCardContent}>
              <Icon name="list" size={24} color={colors.primary.main} />
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Set Collection Order</Text>
                <Text style={styles.actionCardDescription}>
                  {acceptedMembers} members have accepted. Click to manually set the collection order.
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Title</Text>
          <Text style={styles.infoValue}>{esusu.title}</Text>
        </View>

        {esusu.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{esusu.description}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(esusu.status) }]}>
            <Text style={styles.statusText}>
              {esusu.status.charAt(0).toUpperCase() + esusu.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contribution Amount</Text>
          <Text style={styles.infoValue}>
            {formatCurrency(esusu.contributionAmount)} / {esusu.frequency}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pot Amount</Text>
          <Text style={[styles.infoValue, styles.potAmount]}>{formatCurrency(potAmount)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Collection Order Type</Text>
          <Text style={styles.infoValue}>{getOrderTypeLabel(esusu.orderType)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Start Date</Text>
          <Text style={styles.infoValue}>{formatDate(esusu.startDate)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Invitation Deadline</Text>
          <Text style={styles.infoValue}>{formatDate(esusu.invitationDeadline)}</Text>
        </View>

        {esusu.status === 'active' || esusu.status === 'completed' ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Progress</Text>
              <Text style={styles.infoValue}>
                Cycle {esusu.currentCycle} of {esusu.totalCycles}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </>
        ) : null}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="people" size={24} color={colors.primary.main} />
            <Text style={styles.statValue}>{acceptedMembers}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="cash" size={24} color={colors.success.main} />
            <Text style={styles.statValue}>{esusu._count?.contributions || 0}</Text>
            <Text style={styles.statLabel}>Contributions</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="checkmark-circle" size={24} color={colors.info.main} />
            <Text style={styles.statValue}>{esusu._count?.collections || 0}</Text>
            <Text style={styles.statLabel}>Collections</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMembers = () => {
    if (!esusu?.members) return null;

    const sortedMembers = [...esusu.members].sort((a, b) => {
      if (a.collectionOrder && b.collectionOrder) {
        return a.collectionOrder - b.collectionOrder;
      }
      return 0;
    });

    return (
      <View style={styles.tabContent}>
        {sortedMembers.map((member: EsusuMember) => {
          const memberName = member.member?.user 
            ? `${member.member.user.firstName} ${member.member.user.lastName}` 
            : `${member.member?.firstName || ''} ${member.member?.lastName || ''}`.trim() || 'Unknown';
          const memberEmail = member.member?.user?.email || member.member?.email || '';
          
          return (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                  {member.collectionOrder && (
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderBadgeText}>#{member.collectionOrder}</Text>
                    </View>
                  )}
                  <View style={styles.memberTextInfo}>
                    <Text style={styles.memberName}>{memberName}</Text>
                    <Text style={styles.memberEmail}>{memberEmail}</Text>
                  </View>
                </View>
                <View style={[
                  styles.memberStatusBadge,
                  { backgroundColor: getMemberStatusColor(member.status) }
                ]}>
                  <Text style={styles.memberStatusText}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Text>
                </View>
              </View>

              {member.status === 'accepted' && (
                <View style={styles.memberStats}>
                  <View style={styles.memberStat}>
                    <Text style={styles.memberStatLabel}>Contributions</Text>
                    <Text style={styles.memberStatValue}>
                      {member._count?.contributions || 0}
                    </Text>
                  </View>
                  {member.hasCollected && (
                    <View style={styles.collectedBadge}>
                      <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                      <Text style={styles.collectedText}>Collected in Cycle {member.collectionCycle}</Text>
                    </View>
                  )}
                </View>
              )}

              {member.acceptedAt && (
                <Text style={styles.memberAcceptedDate}>
                  Accepted: {formatDate(member.acceptedAt)}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderCycle = () => {
    if (!esusu || esusu.status !== 'active') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <Icon name="time" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>
              {esusu?.status === 'pending' ? 'Esusu has not started yet' : 'No active cycle'}
            </Text>
          </View>
        </View>
      );
    }

    if (!cycleStatus) {
      return (
        <View style={styles.tabContent}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      );
    }

    const allContributed = cycleStatus.isComplete;
    const acceptedMembers = esusu.members?.filter(m => m.status === 'accepted') || [];

    return (
      <View style={styles.tabContent}>
        <View style={styles.cycleHeader}>
          <Text style={styles.cycleTitle}>Cycle {cycleStatus.currentCycle}</Text>
          <Text style={styles.cycleProgress}>
            {cycleStatus.contributedCount} of {acceptedMembers.length} contributed
          </Text>
        </View>

        {cycleStatus.currentCollector && (
          <View style={styles.collectorCard}>
            <View style={styles.collectorHeader}>
              <Icon name="person" size={24} color={colors.success.main} />
              <Text style={styles.collectorTitle}>Current Collector</Text>
            </View>
            <Text style={styles.collectorName}>
              {cycleStatus.currentCollector.member?.user 
                ? `${cycleStatus.currentCollector.member.user.firstName} ${cycleStatus.currentCollector.member.user.lastName}`
                : `${cycleStatus.currentCollector.member?.firstName || ''} ${cycleStatus.currentCollector.member?.lastName || ''}`.trim() || 'Unknown'}
            </Text>
            <Text style={styles.collectorOrder}>Collection Order: #{cycleStatus.currentCollector.collectionOrder}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Contributions Status</Text>
        
        {acceptedMembers.map((member: EsusuMember) => {
          const hasContributed = cycleStatus.contributions.some(
            c => c.memberId === member.memberId
          );
          const memberName = member.member?.user 
            ? `${member.member.user.firstName} ${member.member.user.lastName}`
            : `${member.member?.firstName || ''} ${member.member?.lastName || ''}`.trim() || 'Unknown';

          return (
            <View key={member.id} style={styles.contributionStatusCard}>
              <View style={styles.contributionStatusHeader}>
                <Text style={styles.contributionMemberName}>{memberName}</Text>
                {hasContributed ? (
                  <View style={styles.contributionPaidBadge}>
                    <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                    <Text style={styles.contributionPaidText}>Paid</Text>
                  </View>
                ) : (
                  <View style={styles.contributionPendingBadge}>
                    <Icon name="time" size={16} color={colors.warning.main} />
                    <Text style={styles.contributionPendingText}>Pending</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {isAdmin && (
          <View style={styles.cycleActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('RecordContribution', { esusuId })}
            >
              <Icon name="add-circle" size={20} color={colors.primary.contrast} />
              <Text style={styles.actionButtonText}>Record Contribution</Text>
            </TouchableOpacity>

            {allContributed && (
              <TouchableOpacity
                style={[styles.actionButton, styles.processButton]}
                onPress={() => navigation.navigate('ProcessCollection', { esusuId })}
              >
                <Icon name="cash" size={20} color={colors.primary.contrast} />
                <Text style={styles.actionButtonText}>Process Collection</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderHistory = () => {
    if (!esusu?.collections) return null;

    const sortedCollections = [...esusu.collections].sort(
      (a: EsusuCollection, b: EsusuCollection) => b.cycleNumber - a.cycleNumber
    );

    return (
      <View style={styles.tabContent}>
        {sortedCollections.map((collection: EsusuCollection) => {
          const collector = esusu.members?.find(
            (m: EsusuMember) => m.collectionOrder === collection.cycleNumber
          );
          const collectorName = collector?.member?.user 
            ? `${collector.member.user.firstName} ${collector.member.user.lastName}`
            : `${collector?.member?.firstName || ''} ${collector?.member?.lastName || ''}`.trim() || 'Unknown';

          return (
            <View key={collection.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyCycle}>Cycle {collection.cycleNumber}</Text>
                  <Text style={styles.historyCollector}>{collectorName}</Text>
                  <Text style={styles.historyDate}>{formatDate(collection.createdAt)}</Text>
                </View>
                <View style={styles.historyAmounts}>
                  <Text style={styles.historyTotalAmount}>{formatCurrency(collection.totalAmount)}</Text>
                  {collection.commission > 0 && (
                    <Text style={styles.historyCommission}>
                      Commission: {formatCurrency(collection.commission)}
                    </Text>
                  )}
                  <Text style={styles.historyNetAmount}>
                    Net: {formatCurrency(collection.netAmount)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {sortedCollections.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="document" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No collection history yet</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!esusu) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>Esusu plan not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Icon 
            name="information-circle" 
            size={20} 
            color={activeTab === 'info' ? colors.primary.main : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Icon 
            name="people" 
            size={20} 
            color={activeTab === 'members' ? colors.primary.main : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
            Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cycle' && styles.tabActive]}
          onPress={() => setActiveTab('cycle')}
        >
          <Icon 
            name="sync" 
            size={20} 
            color={activeTab === 'cycle' ? colors.primary.main : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'cycle' && styles.tabTextActive]}>
            Cycle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Icon 
            name="document-text" 
            size={20} 
            color={activeTab === 'history' ? colors.primary.main : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'info' && renderInfo()}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'cycle' && renderCycle()}
        {activeTab === 'history' && renderHistory()}
      </ScrollView>

      {/* Slot Selection Modal */}
      <Modal
        visible={showSlotSelection}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSlotSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Collection Slot</Text>
              <TouchableOpacity
                onPress={() => setShowSlotSelection(false)}
                disabled={respondingToInvitation}
              >
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Choose when you'd like to receive the collection. First come, first served!
            </Text>

            <FlatList
              data={availableSlots}
              keyExtractor={(item) => item.toString()}
              numColumns={4}
              contentContainerStyle={styles.slotsGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.slotCard,
                    selectedSlot === item && styles.slotCardSelected,
                  ]}
                  onPress={() => setSelectedSlot(item)}
                  disabled={respondingToInvitation}
                >
                  <Text
                    style={[
                      styles.slotNumber,
                      selectedSlot === item && styles.slotNumberSelected,
                    ]}
                  >
                    #{item}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySlots}>
                  <Text style={styles.emptySlotsText}>No available slots</Text>
                </View>
              }
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSlotSelection(false)}
                disabled={respondingToInvitation}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  (!selectedSlot || respondingToInvitation) && styles.modalConfirmButtonDisabled,
                ]}
                onPress={handleConfirmSlotSelection}
                disabled={!selectedSlot || respondingToInvitation}
              >
                {respondingToInvitation ? (
                  <ActivityIndicator size="small" color={colors.primary.contrast} />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Confirm Slot</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.default,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.main,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.lg,
  },
  invitationCard: {
    backgroundColor: colors.warning.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning.dark,
    marginLeft: spacing.sm,
  },
  invitationText: {
    fontSize: 14,
    color: colors.warning.dark,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  invitationButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  invitationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  acceptButton: {
    backgroundColor: colors.primary.main,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  declineButton: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error.main,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionCardText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.dark,
    marginBottom: 4,
  },
  actionCardDescription: {
    fontSize: 13,
    color: colors.primary.dark,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  potAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success.main,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background.paper,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success.main,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  memberCard: {
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    ...shadows.sm,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderBadge: {
    backgroundColor: colors.primary.main,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  orderBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.contrast,
  },
  memberTextInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  memberStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  memberStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background.paper,
  },
  memberStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  memberStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberStatLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  memberStatValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  collectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  collectedText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.success.main,
  },
  memberAcceptedDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  cycleHeader: {
    backgroundColor: colors.primary.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  cycleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.dark,
    marginBottom: spacing.xs,
  },
  cycleProgress: {
    fontSize: 14,
    color: colors.primary.dark,
  },
  collectorCard: {
    backgroundColor: colors.success.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success.main,
  },
  collectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  collectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.dark,
    marginLeft: spacing.sm,
  },
  collectorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success.dark,
    marginBottom: 4,
  },
  collectorOrder: {
    fontSize: 13,
    color: colors.success.dark,
  },
  contributionStatusCard: {
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  contributionStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contributionMemberName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  contributionPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  contributionPaidText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success.main,
  },
  contributionPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  contributionPendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning.main,
  },
  cycleActions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  processButton: {
    backgroundColor: colors.success.main,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  historyCard: {
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    ...shadows.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyInfo: {
    flex: 1,
  },
  historyCycle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginBottom: 4,
  },
  historyCollector: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  historyAmounts: {
    alignItems: 'flex-end',
  },
  historyTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  historyCommission: {
    fontSize: 12,
    color: colors.error.main,
    marginBottom: 2,
  },
  historyNetAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.main,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  slotsGrid: {
    paddingBottom: spacing.lg,
  },
  slotCard: {
    flex: 1,
    aspectRatio: 1,
    margin: spacing.xs,
    backgroundColor: colors.background.default,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    maxWidth: 80,
  },
  slotCardSelected: {
    backgroundColor: colors.primary.light + '20',
    borderColor: colors.primary.main,
  },
  slotNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  slotNumberSelected: {
    color: colors.primary.main,
  },
  emptySlots: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptySlotsText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    ...shadows.sm,
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default EsusuDetailScreen;
