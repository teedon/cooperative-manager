import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { reviewLoan } from '../../store/slices/loanSlice';

type Props = NativeStackScreenProps<HomeStackParamList, 'LoanDecision'>;

const LoanDecisionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { loanId } = route.params;
  const dispatch = useAppDispatch();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const { loans } = useAppSelector((state) => state.loan);
  const loan = loans.find((l) => l.id === loanId);

  const handleDecision = async (approved: boolean) => {
    if (!approved) {
      Alert.prompt(
        'Rejection Reason',
        'Please provide a reason for rejecting this loan:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async (reason: string | undefined) => {
              setIsProcessing(true);
              try {
                await dispatch(reviewLoan({ loanId, approved: false, reason })).unwrap();
                Alert.alert('Success', 'Loan has been rejected', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } catch {
                Alert.alert('Error', 'Failed to reject loan');
              } finally {
                setIsProcessing(false);
              }
            },
          },
        ],
        'plain-text'
      );
    } else {
      Alert.alert(
        'Approve Loan',
        `Are you sure you want to approve this ₦${loan?.amount.toLocaleString()} loan request?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            onPress: async () => {
              setIsProcessing(true);
              try {
                await dispatch(reviewLoan({ loanId, approved: true })).unwrap();
                Alert.alert('Success', 'Loan has been approved', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } catch {
                Alert.alert('Error', 'Failed to approve loan');
              } finally {
                setIsProcessing(false);
              }
            },
          },
        ]
      );
    }
  };

  if (!loan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Loan Request</Text>
        <Text style={styles.headerAmount}>₦{loan.amount.toLocaleString()}</Text>
      </View>

      <View style={styles.applicantSection}>
        <Image
          source={{
            uri:
              (loan as unknown as { member?: { user?: { avatarUrl: string } } })?.member?.user
                ?.avatarUrl || 'https://i.pravatar.cc/150',
          }}
          style={styles.avatar}
        />
        <View style={styles.applicantInfo}>
          <Text style={styles.applicantName}>
            {
              (loan as unknown as { member?: { user?: { firstName: string; lastName: string } } })
                ?.member?.user?.firstName
            }{' '}
            {
              (loan as unknown as { member?: { user?: { firstName: string; lastName: string } } })
                ?.member?.user?.lastName
            }
          </Text>
          <Text style={styles.applicantDate}>
            Applied {new Date(loan.requestedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loan Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount Requested</Text>
          <Text style={styles.detailValue}>₦{loan.amount.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Purpose</Text>
          <Text style={styles.detailValue}>{loan.purpose}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{loan.duration} months</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>{loan.interestRate}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Payment</Text>
          <Text style={styles.detailValue}>₦{loan.monthlyRepayment.toLocaleString()}</Text>
        </View>
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Repayment</Text>
          <Text style={styles.totalValue}>₦{loan.totalRepayment.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        {isProcessing ? (
          <ActivityIndicator size="large" color="#8b5cf6" />
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleDecision(false)}
            >
              <Text style={styles.rejectButtonText}>Reject Loan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleDecision(true)}
            >
              <Text style={styles.approveButtonText}>Approve Loan</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#8b5cf6',
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  headerAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  applicantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: '#e2e8f0',
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  applicantDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  actionSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoanDecisionScreen;
