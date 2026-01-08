import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { ajoApi } from '../../api/ajoApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { AjoStatement } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'AjoStatement'>;

const AjoStatementScreen: React.FC<Props> = ({ route }) => {
  const { ajoId, memberId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState<AjoStatement | null>(null);

  useEffect(() => {
    loadStatement();
  }, []);

  const loadStatement = async () => {
    try {
      setLoading(true);
      const data = await ajoApi.getMemberStatement(ajoId, memberId);
      setStatement(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!statement) return;

    const message = generateStatementText();
    
    try {
      await Share.share({
        message,
        title: `${statement.member.firstName} ${statement.member.lastName} - Ajo Statement`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share statement');
    }
  };

  const generateStatementText = (): string => {
    if (!statement) return '';

    let text = `AJO STATEMENT\n`;
    text += `${'='.repeat(40)}\n\n`;
    text += `Member: ${statement.member.firstName} ${statement.member.lastName}\n`;
    text += `Email: ${statement.member.email}\n`;
    text += `Ajo Plan: ${statement.ajo.title}\n\n`;
    text += `${'='.repeat(40)}\n`;
    text += `SUMMARY\n`;
    text += `${'='.repeat(40)}\n`;
    text += `Total Paid: ${formatCurrency(statement.summary.totalPaid)}\n`;
    text += `Commission (${statement.summary.commissionRate}%): ${formatCurrency(statement.summary.commission)}\n`;
    text += `Interest (${statement.summary.interestRate}%): ${formatCurrency(statement.summary.interest)}\n`;
    text += `Net Amount: ${formatCurrency(statement.summary.netAmount)}\n\n`;
    
    if (statement.payments.length > 0) {
      text += `${'='.repeat(40)}\n`;
      text += `PAYMENT HISTORY\n`;
      text += `${'='.repeat(40)}\n\n`;
      
      statement.payments.forEach((payment, index) => {
        text += `${index + 1}. ${formatDate(payment.paymentDate)}\n`;
        text += `   Amount: ${formatCurrency(payment.amount)}\n`;
        text += `   Method: ${payment.paymentMethod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}\n`;
        if (payment.referenceNumber) {
          text += `   Ref: ${payment.referenceNumber}\n`;
        }
        text += `\n`;
      });
    }

    text += `${'='.repeat(40)}\n`;
    text += `Generated on ${new Date().toLocaleString()}\n`;

    return text;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!statement) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>Statement not available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="document-text" size={32} color={colors.primary.main} />
          </View>
          <Text style={styles.headerTitle}>Ajo Statement</Text>
          <Text style={styles.headerSubtitle}>Complete payment record</Text>
        </View>

        {/* Member Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{statement.member.firstName} {statement.member.lastName}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{statement.member.email}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ajo Plan</Text>
              <Text style={styles.infoValue}>{statement.ajo.title}</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Icon name="wallet" size={20} color={colors.text.secondary} />
                <Text style={styles.summaryLabel}>Total Paid</Text>
              </View>
              <Text style={styles.summaryValue}>{formatCurrency(statement.summary.totalPaid)}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Icon name="remove-circle" size={20} color={colors.error.main} />
                <Text style={styles.summaryLabel}>
                  Commission ({statement.summary.commissionRate}%)
                </Text>
              </View>
              <Text style={[styles.summaryValue, styles.deduction]}>
                -{formatCurrency(statement.summary.commission)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Icon name="add-circle" size={20} color={colors.success.main} />
                <Text style={styles.summaryLabel}>
                  Interest ({statement.summary.interestRate}%)
                </Text>
              </View>
              <Text style={[styles.summaryValue, styles.interest]}>
                +{formatCurrency(statement.summary.interest)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={[styles.summaryRow, styles.totalRow]}>
              <View style={styles.summaryLeft}>
                <Icon name="cash" size={24} color={colors.primary.main} />
                <Text style={styles.totalLabel}>Net Amount</Text>
              </View>
              <Text style={styles.totalValue}>{formatCurrency(statement.summary.netAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {statement.payments.length > 0 ? (
            <View style={styles.historyCard}>
              {statement.payments.map((payment, index) => (
                <View key={payment.id}>
                  {index > 0 && <View style={styles.historyDivider} />}
                  <View style={styles.paymentItem}>
                    <View style={styles.paymentLeft}>
                      <View style={styles.paymentNumber}>
                        <Text style={styles.paymentNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.paymentDetails}>
                        <Text style={styles.paymentDate}>{formatDate(payment.paymentDate)}</Text>
                        <View style={styles.paymentMethod}>
                          <Icon 
                            name={payment.paymentMethod === 'cash' ? 'cash' : payment.paymentMethod === 'transfer' ? 'card' : 'wallet'} 
                            size={14} 
                            color={colors.text.secondary} 
                          />
                          <Text style={styles.paymentMethodText}>
                            {payment.paymentMethod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </Text>
                        </View>
                        {payment.referenceNumber && (
                          <Text style={styles.paymentRef}>Ref: {payment.referenceNumber}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="receipt" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No payments recorded yet</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share-social" size={20} color={colors.primary.contrast} />
            <Text style={styles.shareButtonText}>Share Statement</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Icon name="information-circle" size={16} color={colors.text.secondary} />
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border.main,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  deduction: {
    color: colors.error.main,
  },
  interest: {
    color: colors.success.main,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border.main,
    marginVertical: spacing.sm,
  },
  totalRow: {
    backgroundColor: colors.primary.light,
    marginHorizontal: -spacing.lg,
    marginBottom: -spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.main,
  },
  historyCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.md,
  },
  paymentNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.main,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  paymentMethodText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  paymentRef: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success.main,
    marginLeft: spacing.md,
  },
  historyDivider: {
    height: 1,
    backgroundColor: colors.border.main,
    marginVertical: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  actions: {
    marginBottom: spacing.xl,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default AjoStatementScreen;
