import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useAppDispatch } from '../../store/hooks';
import {
  createLoanType,
  updateLoanType,
} from '../../store/slices/loanSlice';
import { Button } from '../../components/common';
import { LoanType } from '../../models';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../utils/errorHandler';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<any, 'CreateEditLoanType'>;

const CreateEditLoanTypeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId, loanType } = route.params as {
    cooperativeId: string;
    loanType?: LoanType;
  };
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);

  const isEditing = !!loanType;

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    minAmount: string;
    maxAmount: string;
    minDuration: string;
    maxDuration: string;
    interestRate: string;
    interestType: 'flat' | 'reducing_balance';
    applicationFee: string;
    deductInterestUpfront: boolean;
    minMembershipDuration: string;
    minSavingsBalance: string;
    maxActiveLoans: string;
    requiresGuarantor: boolean;
    minGuarantors: string;
    requiresKyc: boolean;
    kycDocumentTypes: string[];
    requiresMultipleApprovals: boolean;
    minApprovers: string;
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
    applicationFee: '',
    deductInterestUpfront: false,
    minMembershipDuration: '0',
    minSavingsBalance: '0',
    maxActiveLoans: '1',
    requiresGuarantor: false,
    minGuarantors: '0',
    requiresKyc: false,
    kycDocumentTypes: [],
    requiresMultipleApprovals: false,
    minApprovers: '2',
    isActive: true,
    requiresApproval: true,
  });

  useEffect(() => {
    if (loanType) {
      setFormData({
        name: loanType.name,
        description: loanType.description || '',
        minAmount: loanType.minAmount.toString(),
        maxAmount: loanType.maxAmount.toString(),
        minDuration: loanType.minDuration.toString(),
        maxDuration: loanType.maxDuration.toString(),
        interestRate: loanType.interestRate.toString(),
        interestType: loanType.interestType,
        applicationFee: loanType.applicationFee?.toString() || '',
        deductInterestUpfront: loanType.deductInterestUpfront,
        minMembershipDuration: loanType.minMembershipDuration?.toString() || '0',
        minSavingsBalance: loanType.minSavingsBalance?.toString() || '0',
        maxActiveLoans: loanType.maxActiveLoans?.toString() || '1',
        requiresGuarantor: loanType.requiresGuarantor,
        minGuarantors: loanType.minGuarantors?.toString() || '0',
        requiresKyc: loanType.requiresKyc,
        kycDocumentTypes: loanType.kycDocumentTypes || [],
        requiresMultipleApprovals: loanType.requiresMultipleApprovals,
        minApprovers: loanType.minApprovers?.toString() || '2',
        isActive: loanType.isActive,
        requiresApproval: loanType.requiresApproval,
      });
    }
  }, [loanType]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter a name');
      return false;
    }
    if (!formData.minAmount || parseFloat(formData.minAmount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid minimum amount');
      return false;
    }
    if (!formData.maxAmount || parseFloat(formData.maxAmount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid maximum amount');
      return false;
    }
    if (parseFloat(formData.minAmount) > parseFloat(formData.maxAmount)) {
      Alert.alert('Validation Error', 'Minimum amount cannot be greater than maximum amount');
      return false;
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid interest rate');
      return false;
    }
    if (parseInt(formData.minDuration) > parseInt(formData.maxDuration)) {
      Alert.alert('Validation Error', 'Minimum duration cannot be greater than maximum duration');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        minDuration: parseInt(formData.minDuration),
        maxDuration: parseInt(formData.maxDuration),
        interestRate: parseFloat(formData.interestRate),
        interestType: formData.interestType,
        applicationFee: formData.applicationFee ? parseFloat(formData.applicationFee) : 0,
        deductInterestUpfront: formData.deductInterestUpfront,
        minMembershipDuration: parseInt(formData.minMembershipDuration),
        minSavingsBalance: parseFloat(formData.minSavingsBalance),
        maxActiveLoans: parseInt(formData.maxActiveLoans),
        requiresGuarantor: formData.requiresGuarantor,
        minGuarantors: formData.requiresGuarantor ? parseInt(formData.minGuarantors) : 0,
        requiresKyc: formData.requiresKyc,
        kycDocumentTypes: formData.requiresKyc ? formData.kycDocumentTypes : [],
        requiresMultipleApprovals: formData.requiresMultipleApprovals,
        minApprovers: formData.requiresMultipleApprovals ? parseInt(formData.minApprovers) : 2,
        isActive: formData.isActive,
        requiresApproval: formData.requiresApproval,
      };

      if (isEditing) {
        await dispatch(
          updateLoanType({
            cooperativeId,
            loanTypeId: loanType.id,
            data,
          })
        ).unwrap();
        Alert.alert('Success', 'Loan type updated successfully');
      } else {
        await dispatch(createLoanType({ cooperativeId, data })).unwrap();
        Alert.alert('Success', 'Loan type created successfully');
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, `Failed to ${isEditing ? 'update' : 'create'} loan type`));
    } finally {
      setSaving(false);
    }
  };

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Loan Type' : 'Create Loan Type'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderFormField('Name *', formData.name, (text) =>
            setFormData({ ...formData, name: text })
          )}
          {renderFormField(
            'Description',
            formData.description,
            (text) => setFormData({ ...formData, description: text }),
            { multiline: true, placeholder: 'Optional description' }
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Amount</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interest & Fees</Text>
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
            'Application Fee (₦)',
            formData.applicationFee,
            (text) => setFormData({ ...formData, applicationFee: text }),
            { keyboardType: 'numeric', placeholder: 'Optional - e.g., 500' }
          )}

          {renderSwitch(
            'Deduct Interest Upfront',
            formData.deductInterestUpfront,
            (value) => setFormData({ ...formData, deductInterestUpfront: value }),
            'Deduct total interest from disbursement amount'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Restrictions</Text>
          {renderFormField(
            'Max Active Loans',
            formData.maxActiveLoans,
            (text) => setFormData({ ...formData, maxActiveLoans: text }),
            { keyboardType: 'numeric' }
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval Requirements</Text>
          {renderSwitch(
            'Requires Approval',
            formData.requiresApproval,
            (value) => setFormData({ ...formData, requiresApproval: value }),
            'Admin must approve loan requests'
          )}

          {renderSwitch(
            'Requires Multiple Approvals',
            formData.requiresMultipleApprovals,
            (value) => setFormData({ ...formData, requiresMultipleApprovals: value }),
            'Loan requires approval from multiple admins'
          )}

          {formData.requiresMultipleApprovals &&
            renderFormField(
              'Min Approvers Required',
              formData.minApprovers,
              (text) => setFormData({ ...formData, minApprovers: text }),
              { keyboardType: 'numeric', placeholder: '2' }
            )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guarantor Requirements</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KYC Requirements</Text>
          {renderSwitch(
            'Requires KYC Documents',
            formData.requiresKyc,
            (value) => setFormData({ ...formData, requiresKyc: value }),
            'Borrower must upload KYC documents'
          )}

          {formData.requiresKyc && (
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Required Document Types</Text>
              <Text style={styles.formHint}>Select documents required for this loan type</Text>
              {['bank_statement', 'id_card', 'drivers_license', 'utility_bill', 'passport'].map((docType) => (
                <TouchableOpacity
                  key={docType}
                  style={styles.checkboxContainer}
                  onPress={() => {
                    const newDocs = formData.kycDocumentTypes.includes(docType)
                      ? formData.kycDocumentTypes.filter(d => d !== docType)
                      : [...formData.kycDocumentTypes, docType];
                    setFormData({ ...formData, kycDocumentTypes: newDocs });
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    formData.kycDocumentTypes.includes(docType) && styles.checkboxChecked
                  ]}>
                    {formData.kycDocumentTypes.includes(docType) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    {docType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          {renderSwitch('Active', formData.isActive, (value) =>
            setFormData({ ...formData, isActive: value })
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={saving ? '...' : isEditing ? 'Update' : 'Create'}
            onPress={handleSave}
            variant="primary"
            style={styles.saveButton}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  halfField: {
    flex: 1,
    paddingHorizontal: 6,
  },
  interestTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  interestTypeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  interestTypeOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  interestTypeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  interestTypeTextActive: {
    color: '#3b82f6',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default CreateEditLoanTypeScreen;
