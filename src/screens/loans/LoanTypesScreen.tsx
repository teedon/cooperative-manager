import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchLoanTypes,
  createLoanType,
  updateLoanType,
  deleteLoanType,
} from '../../store/slices/loanSlice';
import { Card, Button, Modal, Badge } from '../../components/common';
import { LoanType } from '../../models';
import { formatCurrency } from '../../utils';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'LoanTypes'>;

const LoanTypesScreen: React.FC<Props> = ({ route }) => {
  const { cooperativeId } = route.params as { cooperativeId: string };
  const dispatch = useAppDispatch();
  const { loanTypes } = useAppSelector((state) => state.loan);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLoanType, setEditingLoanType] = useState<LoanType | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    minAmount: string;
    maxAmount: string;
    minDuration: string;
    maxDuration: string;
    interestRate: string;
    interestType: 'flat' | 'reducing_balance';
    minMembershipDuration: string;
    minSavingsBalance: string;
    maxActiveLoans: string;
    requiresGuarantor: boolean;
    minGuarantors: string;
    isActive: boolean;
    requiresApproval: boolean;
  }>({
    name: '',
    description: '',
    minAmount: '',
    maxAmount: '',
    minDuration: '1',
    maxDuration: '12',
    interestRate: '',
    interestType: 'flat',
    minMembershipDuration: '0',
    minSavingsBalance: '0',
    maxActiveLoans: '1',
    requiresGuarantor: false,
    minGuarantors: '0',
    isActive: true,
    requiresApproval: true,
  });

  useEffect(() => {
    loadLoanTypes();
  }, [cooperativeId]);

  const loadLoanTypes = () => {
    dispatch(fetchLoanTypes(cooperativeId));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchLoanTypes(cooperativeId)).finally(() => setRefreshing(false));
  }, [cooperativeId]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      minAmount: '',
      maxAmount: '',
      minDuration: '1',
      maxDuration: '12',
      interestRate: '',
      interestType: 'flat',
      minMembershipDuration: '0',
      minSavingsBalance: '0',
      maxActiveLoans: '1',
      requiresGuarantor: false,
      minGuarantors: '0',
      isActive: true,
      requiresApproval: true,
    });
    setEditingLoanType(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (loanType: LoanType) => {
    setEditingLoanType(loanType);
    setFormData({
      name: loanType.name,
      description: loanType.description || '',
      minAmount: loanType.minAmount.toString(),
      maxAmount: loanType.maxAmount.toString(),
      minDuration: loanType.minDuration.toString(),
      maxDuration: loanType.maxDuration.toString(),
      interestRate: loanType.interestRate.toString(),
      interestType: loanType.interestType,
      minMembershipDuration: (loanType.minMembershipDuration || 0).toString(),
      minSavingsBalance: (loanType.minSavingsBalance || 0).toString(),
      maxActiveLoans: loanType.maxActiveLoans.toString(),
      requiresGuarantor: loanType.requiresGuarantor,
      minGuarantors: loanType.minGuarantors.toString(),
      isActive: loanType.isActive,
      requiresApproval: loanType.requiresApproval,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a loan type name');
      return;
    }
    if (!formData.minAmount || !formData.maxAmount) {
      Alert.alert('Error', 'Please enter minimum and maximum amounts');
      return;
    }
    if (!formData.interestRate) {
      Alert.alert('Error', 'Please enter an interest rate');
      return;
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      minAmount: parseFloat(formData.minAmount),
      maxAmount: parseFloat(formData.maxAmount),
      minDuration: parseInt(formData.minDuration),
      maxDuration: parseInt(formData.maxDuration),
      interestRate: parseFloat(formData.interestRate),
      interestType: formData.interestType,
      minMembershipDuration: parseInt(formData.minMembershipDuration) || undefined,
      minSavingsBalance: parseFloat(formData.minSavingsBalance) || undefined,
      maxActiveLoans: parseInt(formData.maxActiveLoans),
      requiresGuarantor: formData.requiresGuarantor,
      minGuarantors: parseInt(formData.minGuarantors),
      isActive: formData.isActive,
      requiresApproval: formData.requiresApproval,
    };

    try {
      if (editingLoanType) {
        await dispatch(
          updateLoanType({
            cooperativeId,
            loanTypeId: editingLoanType.id,
            data,
          })
        ).unwrap();
        Alert.alert('Success', 'Loan type updated successfully');
      } else {
        await dispatch(createLoanType({ cooperativeId, data })).unwrap();
        Alert.alert('Success', 'Loan type created successfully');
      }
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save loan type');
    }
  };

  const handleDelete = (loanType: LoanType) => {
    Alert.alert(
      'Delete Loan Type',
      `Are you sure you want to delete "${loanType.name}"? This cannot be undone if there are existing loans of this type.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(
                deleteLoanType({ cooperativeId, loanTypeId: loanType.id })
              ).unwrap();
              Alert.alert('Success', 'Loan type deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete loan type');
            }
          },
        },
      ]
    );
  };

  const renderLoanTypeCard = ({ item }: { item: LoanType }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description && (
            <Text style={styles.cardDescription}>{item.description}</Text>
          )}
        </View>
        <Badge
          variant={item.isActive ? 'success' : 'warning'}
          text={item.isActive ? 'Active' : 'Inactive'}
        />
      </View>

      <View style={styles.tagsContainer}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {formatCurrency(item.minAmount)} - {formatCurrency(item.maxAmount)}
          </Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {item.interestRate}% {item.interestType === 'flat' ? 'Flat' : 'Reducing'}
          </Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {item.minDuration} - {item.maxDuration} months
          </Text>
        </View>
        {item.requiresApproval && (
          <View style={[styles.tag, styles.warningTag]}>
            <Text style={styles.warningTagText}>Requires Approval</Text>
          </View>
        )}
      </View>

      {item._count && (
        <Text style={styles.loanCount}>{item._count.loans} active loan(s)</Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      placeholder?: string;
      keyboardType?: 'numeric' | 'default';
      multiline?: boolean;
    }
  ) => (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, options?.multiline && styles.formTextArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options?.placeholder}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

  const renderSwitch = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.switchContainer}>
      <View style={styles.switchLabelContainer}>
        <Text style={styles.switchLabel}>{label}</Text>
        {description && <Text style={styles.switchDescription}>{description}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={loanTypes}
        renderItem={renderLoanTypeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No loan types configured yet.{'\n'}Create your first loan type to get started.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerDescription}>
              Configure loan products available to members of this cooperative.
            </Text>
            <Button
              title="Create Loan Type"
              onPress={openCreateModal}
              variant="primary"
            />
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        title={editingLoanType ? 'Edit Loan Type' : 'Create Loan Type'}
      >
        <ScrollView style={styles.modalContent}>
          {renderFormField('Name *', formData.name, (text) =>
            setFormData({ ...formData, name: text })
          )}
          {renderFormField(
            'Description',
            formData.description,
            (text) => setFormData({ ...formData, description: text }),
            { multiline: true, placeholder: 'Optional description' }
          )}

          <View style={styles.row}>
            <View style={styles.halfField}>
              {renderFormField(
                'Min Amount *',
                formData.minAmount,
                (text) => setFormData({ ...formData, minAmount: text }),
                { keyboardType: 'numeric', placeholder: '0' }
              )}
            </View>
            <View style={styles.halfField}>
              {renderFormField(
                'Max Amount *',
                formData.maxAmount,
                (text) => setFormData({ ...formData, maxAmount: text }),
                { keyboardType: 'numeric', placeholder: '0' }
              )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              {renderFormField(
                'Min Duration (months)',
                formData.minDuration,
                (text) => setFormData({ ...formData, minDuration: text }),
                { keyboardType: 'numeric' }
              )}
            </View>
            <View style={styles.halfField}>
              {renderFormField(
                'Max Duration (months)',
                formData.maxDuration,
                (text) => setFormData({ ...formData, maxDuration: text }),
                { keyboardType: 'numeric' }
              )}
            </View>
          </View>

          {renderFormField(
            'Interest Rate (%) *',
            formData.interestRate,
            (text) => setFormData({ ...formData, interestRate: text }),
            { keyboardType: 'numeric', placeholder: 'e.g., 5' }
          )}

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Interest Type</Text>
            <View style={styles.interestTypeRow}>
              <TouchableOpacity
                onPress={() => setFormData({ ...formData, interestType: 'flat' })}
                style={[
                  styles.interestTypeOption,
                  formData.interestType === 'flat' && styles.interestTypeOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.interestTypeText,
                    formData.interestType === 'flat' && styles.interestTypeTextActive,
                  ]}
                >
                  Flat Rate
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setFormData({ ...formData, interestType: 'reducing_balance' })
                }
                style={[
                  styles.interestTypeOption,
                  formData.interestType === 'reducing_balance' && styles.interestTypeOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.interestTypeText,
                    formData.interestType === 'reducing_balance' && styles.interestTypeTextActive,
                  ]}
                >
                  Reducing Balance
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderFormField(
            'Max Active Loans',
            formData.maxActiveLoans,
            (text) => setFormData({ ...formData, maxActiveLoans: text }),
            { keyboardType: 'numeric' }
          )}

          {renderSwitch(
            'Requires Approval',
            formData.requiresApproval,
            (value) => setFormData({ ...formData, requiresApproval: value }),
            'Admin must approve loan requests'
          )}

          {renderSwitch(
            'Requires Guarantor',
            formData.requiresGuarantor,
            (value) => setFormData({ ...formData, requiresGuarantor: value }),
            'Borrower must provide guarantors'
          )}

          {formData.requiresGuarantor &&
            renderFormField(
              'Min Guarantors',
              formData.minGuarantors,
              (text) => setFormData({ ...formData, minGuarantors: text }),
              { keyboardType: 'numeric' }
            )}

          {renderSwitch('Active', formData.isActive, (value) =>
            setFormData({ ...formData, isActive: value })
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            onPress={() => {
              setModalVisible(false);
              resetForm();
            }}
            variant="outline"
          />
          <View style={styles.actionSpacer} />
          <Button
            title={editingLoanType ? 'Update' : 'Create'}
            onPress={handleSave}
            variant="primary"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
  },
  warningTag: {
    backgroundColor: '#fef3c7',
  },
  warningTagText: {
    fontSize: 12,
    color: '#92400e',
  },
  loanCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContent: {
    maxHeight: 400,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  interestTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  interestTypeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  interestTypeOptionActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  interestTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  interestTypeTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  switchDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionSpacer: {
    width: 12,
  },
});

export default LoanTypesScreen;
