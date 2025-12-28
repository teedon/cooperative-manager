import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { Card, Icon } from '../../components/common';
import reportsApi from '../../api/reportsApi';

type ReportType =
  | 'contribution_summary'
  | 'member_balances'
  | 'loan_summary'
  | 'loan_repayment'
  | 'loan_interest'
  | 'expense_summary'
  | 'financial_statement'
  | 'member_activity';

type ExportFormat = 'csv' | 'excel';

interface ReportTypeInfo {
  id: ReportType;
  name: string;
  description: string;
  icon: string;
}

const REPORT_TYPES: ReportTypeInfo[] = [
  {
    id: 'contribution_summary',
    name: 'Contribution Summary',
    description: 'Overview of all contributions by period and member',
    icon: 'PieChart',
  },
  {
    id: 'member_balances',
    name: 'Member Balances',
    description: 'Current balance for each member including contributions and loans',
    icon: 'Wallet',
  },
  {
    id: 'loan_summary',
    name: 'Loan Summary',
    description: 'Summary of all loans with status and amounts',
    icon: 'Banknote',
  },
  {
    id: 'loan_repayment',
    name: 'Loan Repayment Schedule',
    description: 'Detailed repayment schedule for all active loans',
    icon: 'Calendar',
  },
  {
    id: 'loan_interest',
    name: 'Loan Interest Report',
    description: 'Interest earned and pending from all loans by type and member',
    icon: 'TrendingUp',
  },
  {
    id: 'expense_summary',
    name: 'Expense Summary',
    description: 'Breakdown of cooperative expenses by category',
    icon: 'Receipt',
  },
  {
    id: 'financial_statement',
    name: 'Financial Statement',
    description: 'Complete financial overview including income and expenses',
    icon: 'FileText',
  },
  {
    id: 'member_activity',
    name: 'Member Activity',
    description: 'Detailed activity log for each member',
    icon: 'Users',
  },
];

type RootStackParamList = {
  Reports: { cooperativeId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

export default function ReportsScreen({ route }: Props) {
  const { cooperativeId } = route.params;
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const handleGenerateReport = async (reportType: ReportType) => {
    setSelectedReport(reportType);
    setIsGenerating(true);
    setReportData(null);

    try {
      const data = await reportsApi.generateReport(cooperativeId, reportType, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setReportData(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!selectedReport) {
      Alert.alert('Error', 'Please select a report type first');
      return;
    }

    setIsExporting(true);

    try {
      const exportFn = 
        format === 'csv' ? reportsApi.exportReportCSV : 
        format === 'excel' ? reportsApi.exportReportExcel :
        reportsApi.exportReportPDF;
        
      const blob = await exportFn(cooperativeId, selectedReport, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const extension = format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf';
      const mimeType = 
        format === 'csv' ? 'text/csv' : 
        format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
        'application/pdf';
        
      const fileName = `${selectedReport}_${dateRange.startDate}_${dateRange.endDate}.${extension}`;
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const filePath = `${dirs.DocumentDir}/${fileName}`;

      // Convert blob to base64 and save
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        await ReactNativeBlobUtil.fs.writeFile(filePath, base64data, 'base64');

        if (Platform.OS === 'ios') {
          ReactNativeBlobUtil.ios.openDocument(filePath);
        } else {
          ReactNativeBlobUtil.android.actionViewIntent(filePath, mimeType);
        }

        Alert.alert('Success', `Report exported as ${fileName}`);
      };
      reader.readAsDataURL(blob);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const renderReportPreview = () => {
    if (!reportData) return null;

    const reportInfo = REPORT_TYPES.find((r) => r.id === selectedReport);

    return (
      <Card style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>{reportInfo?.name}</Text>
          <Text style={styles.previewSubtitle}>
            {dateRange.startDate} to {dateRange.endDate}
          </Text>
        </View>

        <View style={styles.previewContent}>
          {selectedReport === 'contribution_summary' && reportData.summary && (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Contributions</Text>
                <Text style={styles.summaryValue}>
                  ₦{reportData.summary.totalContributions?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Members</Text>
                <Text style={styles.summaryValue}>
                  {reportData.summary.memberCount || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Active Periods</Text>
                <Text style={styles.summaryValue}>
                  {reportData.summary.periodCount || 0}
                </Text>
              </View>
            </View>
          )}

          {selectedReport === 'member_balances' && reportData.summary && (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Balance</Text>
                <Text style={styles.summaryValue}>
                  ₦{reportData.summary.totalBalance?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Outstanding Loans</Text>
                <Text style={styles.summaryValue}>
                  ₦{reportData.summary.totalOutstandingLoans?.toLocaleString() || 0}
                </Text>
              </View>
            </View>
          )}

          {selectedReport === 'loan_summary' && reportData.summary && (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Disbursed</Text>
                <Text style={styles.summaryValue}>
                  ₦{reportData.summary.totalDisbursed?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Repaid</Text>
                <Text style={styles.summaryValue}>
                  ₦{reportData.summary.totalRepaid?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Outstanding</Text>
                <Text style={styles.summaryValue}>
                  ₦{reportData.summary.totalOutstanding?.toLocaleString() || 0}
                </Text>
              </View>
            </View>
          )}

          {selectedReport === 'loan_interest' && reportData.summary && (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Interest Earned</Text>
                <Text style={[styles.summaryValue, styles.incomeText]}>
                  ₦{reportData.summary.totalInterestEarned?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Interest Pending</Text>
                <Text style={styles.summaryValue}>
                  ₦{reportData.summary.totalInterestPending?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg. Interest Rate</Text>
                <Text style={styles.summaryValue}>
                  {reportData.summary.averageInterestRate?.toFixed(2) || 0}%
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Loans with Interest</Text>
                <Text style={styles.summaryValue}>
                  {reportData.summary.totalLoansWithInterest || 0}
                </Text>
              </View>
            </View>
          )}

          {selectedReport === 'financial_statement' && reportData.summary && (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Income</Text>
                <Text style={[styles.summaryValue, styles.incomeText]}>
                  ₦{reportData.summary.totalIncome?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
                <Text style={[styles.summaryValue, styles.expenseText]}>
                  ₦{reportData.summary.totalExpenses?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Net Balance</Text>
                <Text style={[
                  styles.summaryValue,
                  reportData.summary.netBalance >= 0 ? styles.incomeText : styles.expenseText
                ]}>
                  ₦{reportData.summary.netBalance?.toLocaleString() || 0}
                </Text>
              </View>
            </View>
          )}

          {(selectedReport === 'expense_summary' ||
            selectedReport === 'loan_repayment' ||
            selectedReport === 'member_activity') && (
            <View style={styles.dataInfo}>
              <Icon name="FileText" size={24} color="#6B7280" />
              <Text style={styles.dataInfoText}>
                {reportData.data?.length || 0} records found
              </Text>
            </View>
          )}
        </View>

        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={[styles.exportButton, styles.csvButton]}
            onPress={() => handleExport('csv')}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="Download" size={16} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>CSV</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, styles.excelButton]}
            onPress={() => handleExport('excel')}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="FileSpreadsheet" size={16} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Excel</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, styles.pdfButton]}
            onPress={() => handleExport('pdf')}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="FileText" size={16} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Generate and export cooperative reports</Text>
      </View>

      <View style={styles.dateRangeContainer}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>{dateRange.startDate}</Text>
          </View>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Text style={styles.dateValue}>{dateRange.endDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.reportTypesContainer}>
        <Text style={styles.sectionTitle}>Report Types</Text>
        <View style={styles.reportGrid}>
          {REPORT_TYPES.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[
                styles.reportCard,
                selectedReport === report.id && styles.reportCardSelected,
              ]}
              onPress={() => handleGenerateReport(report.id)}
              disabled={isGenerating}
            >
              <View style={[
                styles.reportIconContainer,
                selectedReport === report.id && styles.reportIconContainerSelected,
              ]}>
                <Icon
                  name={report.icon as any}
                  size={24}
                  color={selectedReport === report.id ? '#FFFFFF' : '#3B82F6'}
                />
              </View>
              <Text style={[
                styles.reportName,
                selectedReport === report.id && styles.reportNameSelected,
              ]}>
                {report.name}
              </Text>
              <Text style={styles.reportDescription} numberOfLines={2}>
                {report.description}
              </Text>
              {isGenerating && selectedReport === report.id && (
                <ActivityIndicator style={styles.loader} size="small" color="#3B82F6" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderReportPreview()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dateRangeContainer: {
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  reportTypesContainer: {
    marginBottom: 24,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reportCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reportIconContainerSelected: {
    backgroundColor: '#3B82F6',
  },
  reportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reportNameSelected: {
    color: '#3B82F6',
  },
  reportDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  loader: {
    marginTop: 8,
  },
  previewCard: {
    padding: 16,
    marginBottom: 24,
  },
  previewHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  previewContent: {
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  incomeText: {
    color: '#10B981',
  },
  expenseText: {
    color: '#EF4444',
  },
  dataInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  dataInfoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  csvButton: {
    backgroundColor: '#3B82F6',
  },
  excelButton: {
    backgroundColor: '#10B981',
  },
  pdfButton: {
    backgroundColor: '#EF4444',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
