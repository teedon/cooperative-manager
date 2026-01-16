import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronDown } from 'lucide-react-native';
import { collectionsApi, cooperativeApi, AddTransactionDto } from '../../api';
import { Card, Button } from '../../components/common';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<any, 'AddTransaction'>;

const AddTransactionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { organizationId, collectionId } = route.params as {
    organizationId: string;
    collectionId: string;
  };

  const [cooperativeId, setCooperativeId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [type, setType] = useState<AddTransactionDto['type']>('contribution');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<AddTransactionDto['paymentMethod']>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  // For production, you would fetch cooperatives and members from API
  // This is a simplified version

  const handleSubmit = async () => {
    // Validation
    if (!cooperativeId || !memberId || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const transactionData: AddTransactionDto = {
        cooperativeId,
        memberId,
        type,
        amount: Math.round(amountNum * 100), // Convert to cents
        paymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
      };

      const response = await collectionsApi.addTransaction(
        organizationId,
        collectionId,
        transactionData
      );

      if (response.success) {
        Alert.alert('Success', 'Transaction added successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to add transaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Transaction Type</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={styles.pickerText}>
              {getTransactionTypeLabel(type)}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Cooperative ID *</Text>
          <TextInput
            style={styles.input}
            value={cooperativeId}
            onChangeText={setCooperativeId}
            placeholder="Enter cooperative ID"
            placeholderTextColor="#95a5a6"
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Member ID *</Text>
          <TextInput
            style={styles.input}
            value={memberId}
            onChangeText={setMemberId}
            placeholder="Enter member ID"
            placeholderTextColor="#95a5a6"
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Amount *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#95a5a6"
            keyboardType="numeric"
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPaymentPicker(true)}
          >
            <Text style={styles.pickerText}>
              {getPaymentMethodLabel(paymentMethod)}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Reference (Optional)</Text>
          <TextInput
            style={styles.input}
            value={reference}
            onChangeText={setReference}
            placeholder="Payment reference number"
            placeholderTextColor="#95a5a6"
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes"
            placeholderTextColor="#95a5a6"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Adding...' : 'Add Transaction'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>

      {/* Transaction Type Picker Modal */}
      <Modal visible={showTypePicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Transaction Type</Text>
            {[
              { label: 'Contribution', value: 'contribution' },
              { label: 'Loan Repayment', value: 'loan_repayment' },
              { label: 'AJO Payment', value: 'ajo_payment' },
              { label: 'Esusu Contribution', value: 'esusu_contribution' },
              { label: 'Share Purchase', value: 'share_purchase' },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.modalItem}
                onPress={() => {
                  setType(item.value as AddTransactionDto['type']);
                  setShowTypePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    type === item.value && styles.modalItemSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payment Method Picker Modal */}
      <Modal visible={showPaymentPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPaymentPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            {[
              { label: 'Cash', value: 'cash' },
              { label: 'Bank Transfer', value: 'bank_transfer' },
              { label: 'Mobile Money', value: 'mobile_money' },
              { label: 'Check', value: 'check' },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.modalItem}
                onPress={() => {
                  setPaymentMethod(item.value as AddTransactionDto['paymentMethod']);
                  setShowPaymentPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    paymentMethod === item.value && styles.modalItemSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getTransactionTypeLabel = (value: string): string => {
  const labels: Record<string, string> = {
    contribution: 'Contribution',
    loan_repayment: 'Loan Repayment',
    ajo_payment: 'AJO Payment',
    esusu_contribution: 'Esusu Contribution',
    share_purchase: 'Share Purchase',
  };
  return labels[value] || value;
};

const getPaymentMethodLabel = (value: string): string => {
  const labels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    check: 'Check',
  };
  return labels[value] || value;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    minHeight: 100,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#2c3e50',
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
    paddingVertical: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
    color: '#2c3e50',
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  modalItemSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
});

export default AddTransactionScreen;
