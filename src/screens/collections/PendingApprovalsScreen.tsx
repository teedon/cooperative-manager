import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { collectionsApi, DailyCollection } from '../../api';
import { Card, Button, Badge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';
import { getErrorMessage } from '../../utils/errorHandler';
import { List, Check, X, User, Wallet, Clock, Eye, XCircle, CheckCircle, CheckCheck } from 'lucide-react-native';

type Props = NativeStackScreenProps<any, 'PendingApprovals'>;

const PendingApprovalsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { organizationId } = route.params as { organizationId: string };
  const [collections, setCollections] = useState<DailyCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Approval modal
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<DailyCollection | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingApprovals();
  }, [organizationId]);

  const loadPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const response = await collectionsApi.getPendingApprovals(organizationId);
      if (response.success && response.data) {
        setCollections(response.data);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load pending approvals'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPendingApprovals();
    setRefreshing(false);
  }, [organizationId]);

  const openApproveModal = (collection: DailyCollection) => {
    setSelectedCollection(collection);
    setApprovalNotes('');
    setApproveModalVisible(true);
  };

  const openRejectModal = (collection: DailyCollection) => {
    setSelectedCollection(collection);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedCollection) return;

    try {
      setIsProcessing(true);
      const response = await collectionsApi.approve(
        organizationId,
        selectedCollection.id,
        {approvalNotes: approvalNotes || undefined }
      );

      if (response.success) {
        Alert.alert('Success', 'Collection approved successfully');
        setApproveModalVisible(false);
        setSelectedCollection(null);
        loadPendingApprovals();
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to approve collection'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCollection) return;

    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await collectionsApi.reject(
        organizationId,
        selectedCollection.id,
        { rejectionReason: rejectionReason.trim() }
      );

      if (response.success) {
        Alert.alert('Success', 'Collection rejected');
        setRejectModalVisible(false);
        setSelectedCollection(null);
        loadPendingApprovals();
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to reject collection'));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCollection = ({ item }: { item: DailyCollection }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Clock size={24} color="#f39c12" />
          <View style={styles.headerText}>
            <Text style={styles.date}>{formatDate(item.collectionDate)}</Text>
            {item.staff?.user && (
              <Text style={styles.staffName}>
                {item.staff.user.firstName} {item.staff.user.lastName}
              </Text>
            )}
          </View>
        </View>
        <Badge text="PENDING" variant="warning" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Wallet size={20} color="#3498db" />
          <Text style={styles.statValue}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        <View style={styles.stat}>
          <List size={20} color="#9b59b6" />
          <Text style={styles.statValue}>{item.transactionCount} txns</Text>
        </View>
      </View>

      {item.submittedAt && (
        <Text style={styles.submittedText}>
          Submitted {formatDate(item.submittedAt)}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() =>
            navigation.navigate('CollectionDetails', {
              organizationId,
              collectionId: item.id,
            })
          }
        >
          <Eye size={18} color="#3498db" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => openRejectModal(item)}
        >
          <XCircle size={18} color="#e74c3c" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => openApproveModal(item)}
        >
          <CheckCircle size={18} color="#fff" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <CheckCheck size={64} color="#bdc3c7" />
      <Text style={styles.emptyText}>No pending approvals</Text>
      <Text style={styles.emptySubtext}>All collections have been reviewed</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={collections}
          renderItem={renderCollection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Approve Modal */}
      <Modal
        visible={approveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setApproveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Approve Collection</Text>
              <TouchableOpacity onPress={() => setApproveModalVisible(false)}>
                <X size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              Approve this collection of {selectedCollection?.transactionCount} transactions
              totaling {formatCurrency(selectedCollection?.totalAmount || 0)}?
            </Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              value={approvalNotes}
              onChangeText={setApprovalNotes}
              placeholder="Add approval notes (optional)"
              placeholderTextColor="#95a5a6"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setApproveModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalApproveButton]}
                onPress={handleApprove}
                disabled={isProcessing}
              >
                <Text style={styles.modalApproveText}>
                  {isProcessing ? 'Approving...' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Collection</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <X size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              Please provide a reason for rejecting this collection:
            </Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Rejection reason (required)"
              placeholderTextColor="#95a5a6"
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalRejectButton]}
                onPress={handleReject}
                disabled={isProcessing}
              >
                <Text style={styles.modalRejectText}>
                  {isProcessing ? 'Rejecting...' : 'Reject'}
                </Text>
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
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  staffName: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  submittedText: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewButton: {
    backgroundColor: '#e8f4f8',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498db',
  },
  rejectButton: {
    backgroundColor: '#fee',
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e74c3c',
  },
  approveButton: {
    backgroundColor: '#27ae60',
  },
  approveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#95a5a6',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#ecf0f1',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  modalApproveButton: {
    backgroundColor: '#27ae60',
  },
  modalApproveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalRejectButton: {
    backgroundColor: '#e74c3c',
  },
  modalRejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PendingApprovalsScreen;
