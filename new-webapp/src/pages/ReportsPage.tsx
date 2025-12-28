import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Input, useToast } from '../components/ui'
import {
  ArrowLeft,
  PieChart,
  Wallet,
  Banknote,
  Calendar,
  TrendingUp,
  Receipt,
  FileText,
  Users,
  Download,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import {
  reportsApi,
  type ReportType,
  type Report,
  type ContributionSummaryReport,
  type MemberBalancesReport,
  type LoanSummaryReport,
  type LoanInterestReport,
  type ExpenseSummaryReport,
  type FinancialStatementReport,
  type MemberActivityReport,
} from '../api/reportsApi'

interface ReportTypeInfo {
  id: ReportType
  name: string
  description: string
  icon: React.ElementType
}

const REPORT_TYPES: ReportTypeInfo[] = [
  {
    id: 'contribution_summary',
    name: 'Contribution Summary',
    description: 'Overview of all contributions by period and member',
    icon: PieChart,
  },
  {
    id: 'member_balances',
    name: 'Member Balances',
    description: 'Current balance for each member including contributions and loans',
    icon: Wallet,
  },
  {
    id: 'loan_summary',
    name: 'Loan Summary',
    description: 'Summary of all loans with status and amounts',
    icon: Banknote,
  },
  {
    id: 'loan_repayment',
    name: 'Loan Repayment Schedule',
    description: 'Detailed repayment schedule for all active loans',
    icon: Calendar,
  },
  {
    id: 'loan_interest',
    name: 'Loan Interest Report',
    description: 'Interest earned and pending from all loans by type and member',
    icon: TrendingUp,
  },
  {
    id: 'expense_summary',
    name: 'Expense Summary',
    description: 'Breakdown of cooperative expenses by category',
    icon: Receipt,
  },
  {
    id: 'financial_statement',
    name: 'Financial Statement',
    description: 'Complete financial overview including income and expenses',
    icon: FileText,
  },
  {
    id: 'member_activity',
    name: 'Member Activity',
    description: 'Detailed activity log for each member',
    icon: Users,
  },
]

export function ReportsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [reportData, setReportData] = useState<Report | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const handleGenerateReport = async (reportType: ReportType) => {
    if (!id) return

    setSelectedReport(reportType)
    setIsGenerating(true)
    setReportData(null)

    try {
      const data = await reportsApi.generateReport(id, reportType, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      setReportData(data)
      toast.success('Report generated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!selectedReport || !id) {
      toast.error('Please select a report type first')
      return
    }

    setIsExporting(true)

    try {
      const exportFn = 
        format === 'csv' ? reportsApi.exportReportCSV :
        format === 'excel' ? reportsApi.exportReportExcel :
        reportsApi.exportReportPDF

      const blob = await exportFn(id, selectedReport, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      const extension = format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf'
      const fileName = `${selectedReport}_${dateRange.startDate}_${dateRange.endDate}.${extension}`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Report exported as ${fileName}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  const renderReportPreview = () => {
    if (!reportData) return null

    const reportInfo = REPORT_TYPES.find((r) => r.id === selectedReport)

    return (
      <Card className="p-6">
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{reportInfo?.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {dateRange.startDate} to {dateRange.endDate}
          </p>
        </div>

        <div className="mb-6">
          {selectedReport === 'contribution_summary' && (reportData as ContributionSummaryReport).summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Contributions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₦{(reportData as ContributionSummaryReport).summary.totalContributions?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(reportData as ContributionSummaryReport).summary.memberCount || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Active Periods</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(reportData as ContributionSummaryReport).summary.periodCount || 0}
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'member_balances' && (reportData as MemberBalancesReport).summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₦{(reportData as MemberBalancesReport).summary.totalBalance?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Outstanding Loans</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₦{(reportData as MemberBalancesReport).summary.totalOutstandingLoans?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'loan_summary' && (reportData as LoanSummaryReport).summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Disbursed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₦{((reportData as LoanSummaryReport).summary.totalDisbursed || (reportData as LoanSummaryReport).summary.totalAmountDisbursed || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Repaid</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₦{((reportData as LoanSummaryReport).summary.totalRepaid || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₦{((reportData as LoanSummaryReport).summary.totalOutstanding || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'loan_interest' && (reportData as LoanInterestReport).summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Interest Earned</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₦{(reportData as LoanInterestReport).summary.totalInterestEarned?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Interest Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₦{(reportData as LoanInterestReport).summary.totalInterestPending?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg. Interest Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(reportData as LoanInterestReport).summary.averageInterestRate?.toFixed(2) || 0}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Loans with Interest</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(reportData as LoanInterestReport).summary.totalLoansWithInterest || 0}
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'financial_statement' && (reportData as FinancialStatementReport).summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₦{(reportData as FinancialStatementReport).summary.totalIncome?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  ₦{(reportData as FinancialStatementReport).summary.totalExpenses?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Net Balance</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    (reportData as FinancialStatementReport).summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ₦{(reportData as FinancialStatementReport).summary.netBalance?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          )}

          {(selectedReport === 'expense_summary' ||
            selectedReport === 'loan_repayment' ||
            selectedReport === 'member_activity') && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-6 h-6 text-gray-600" />
              <p className="text-gray-700">
                {(reportData as ExpenseSummaryReport | MemberActivityReport).data?.length || 0} records found
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>

          <Button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export Excel
          </Button>

          <Button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/cooperatives/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cooperative
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">Generate and export cooperative reports</p>
        </div>

        {/* Date Range */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Report Types */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORT_TYPES.map((report) => {
              const Icon = report.icon
              const isSelected = selectedReport === report.id
              const isLoading = isGenerating && selectedReport === report.id

              return (
                <button
                  key={report.id}
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={isGenerating}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent bg-white hover:border-gray-300'
                  } ${isGenerating && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      isSelected ? 'bg-blue-600' : 'bg-blue-50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <h3
                    className={`text-sm font-semibold mb-1 ${
                      isSelected ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {report.name}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{report.description}</p>
                  {isLoading && (
                    <div className="mt-2">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Report Preview */}
        {renderReportPreview()}
      </div>
    </div>
  )
}
