/**
 * Export Utilities for Reports
 * Handles CSV and basic Excel generation
 */

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: 'currency' | 'date' | 'percentage' | 'number';
}

/**
 * Format a value based on its type
 */
function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (format) {
    case 'currency':
      return typeof value === 'number' ? value.toFixed(2) : String(value);
    case 'date':
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      return String(value);
    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : String(value);
    case 'number':
      return typeof value === 'number' ? value.toString() : String(value);
    default:
      return String(value);
  }
}

/**
 * Escape CSV values properly
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Generate CSV content from data
 */
export function generateCsv(data: any[], columns: ExportColumn[]): string {
  // Header row
  const headers = columns.map((col) => escapeCsvValue(col.header));
  const rows = [headers.join(',')];

  // Data rows
  for (const item of data) {
    const row = columns.map((col) => {
      const value = getNestedValue(item, col.key);
      const formatted = formatValue(value, col.format);
      return escapeCsvValue(formatted);
    });
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Generate a simple Excel XML format (SpreadsheetML)
 * This creates a basic .xls file that can be opened by Excel
 */
export function generateExcelXml(
  data: any[],
  columns: ExportColumn[],
  sheetName: string = 'Report',
): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
<Styles>
  <Style ss:ID="Header">
    <Font ss:Bold="1"/>
    <Interior ss:Color="#CCCCCC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
    <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="Date">
    <NumberFormat ss:Format="yyyy-mm-dd"/>
  </Style>
  <Style ss:ID="Percentage">
    <NumberFormat ss:Format="0.00%"/>
  </Style>
</Styles>`;

  const columnDefs = columns
    .map((col) => `<Column ss:Width="${col.width || 100}"/>`)
    .join('\n');

  const headerRow = `<Row ss:StyleID="Header">
${columns.map((col) => `  <Cell><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`).join('\n')}
</Row>`;

  const dataRows = data
    .map((item) => {
      const cells = columns.map((col) => {
        const value = getNestedValue(item, col.key);
        const { type, formattedValue, styleId } = getExcelCellType(value, col.format);
        const styleAttr = styleId ? ` ss:StyleID="${styleId}"` : '';
        return `  <Cell${styleAttr}><Data ss:Type="${type}">${escapeXml(formattedValue)}</Data></Cell>`;
      });
      return `<Row>\n${cells.join('\n')}\n</Row>`;
    })
    .join('\n');

  return `${xmlHeader}
<Worksheet ss:Name="${escapeXml(sheetName)}">
<Table>
${columnDefs}
${headerRow}
${dataRows}
</Table>
</Worksheet>
</Workbook>`;
}

/**
 * Get Excel cell type and style
 */
function getExcelCellType(
  value: any,
  format?: string,
): { type: string; formattedValue: string; styleId?: string } {
  if (value === null || value === undefined) {
    return { type: 'String', formattedValue: '' };
  }

  switch (format) {
    case 'currency':
      return {
        type: 'Number',
        formattedValue: typeof value === 'number' ? value.toString() : '0',
        styleId: 'Currency',
      };
    case 'date':
      if (value instanceof Date) {
        return { type: 'DateTime', formattedValue: value.toISOString(), styleId: 'Date' };
      }
      return { type: 'String', formattedValue: String(value) };
    case 'percentage':
      return {
        type: 'Number',
        formattedValue: typeof value === 'number' ? value.toString() : '0',
        styleId: 'Percentage',
      };
    case 'number':
      return {
        type: 'Number',
        formattedValue: typeof value === 'number' ? value.toString() : '0',
      };
    default:
      if (typeof value === 'number') {
        return { type: 'Number', formattedValue: value.toString() };
      }
      return { type: 'String', formattedValue: String(value) };
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Column definitions for different report types
 */
export const REPORT_COLUMNS: Record<string, ExportColumn[]> = {
  contribution_summary: [
    { header: 'Plan Name', key: 'planName', width: 150 },
    { header: 'Total Collected', key: 'totalCollected', width: 120, format: 'currency' },
    { header: 'Total Expected', key: 'totalExpected', width: 120, format: 'currency' },
    { header: 'Collection Rate', key: 'collectionRate', width: 100, format: 'percentage' },
    { header: 'Active Contributors', key: 'activeContributors', width: 120, format: 'number' },
    { header: 'Pending Payments', key: 'pendingPayments', width: 120, format: 'number' },
  ],
  member_balances: [
    { header: 'Member Name', key: 'memberName', width: 150 },
    { header: 'Email', key: 'email', width: 180 },
    { header: 'Total Contributions', key: 'totalContributions', width: 130, format: 'currency' },
    { header: 'Outstanding Loans', key: 'outstandingLoans', width: 130, format: 'currency' },
    { header: 'Total Expenses', key: 'totalExpenses', width: 120, format: 'currency' },
    { header: 'Net Balance', key: 'netBalance', width: 120, format: 'currency' },
    { header: 'Join Date', key: 'joinDate', width: 100, format: 'date' },
  ],
  loan_summary: [
    { header: 'Loan Type', key: 'loanType', width: 150 },
    { header: 'Total Disbursed', key: 'totalDisbursed', width: 130, format: 'currency' },
    { header: 'Total Repaid', key: 'totalRepaid', width: 130, format: 'currency' },
    { header: 'Outstanding', key: 'outstandingBalance', width: 130, format: 'currency' },
    { header: 'Active Loans', key: 'activeLoans', width: 100, format: 'number' },
    { header: 'Defaulted Loans', key: 'defaultedLoans', width: 110, format: 'number' },
    { header: 'Default Rate', key: 'defaultRate', width: 100, format: 'percentage' },
  ],
  loan_outstanding: [
    { header: 'Borrower', key: 'borrowerName', width: 150 },
    { header: 'Loan Type', key: 'loanType', width: 120 },
    { header: 'Principal', key: 'principalAmount', width: 120, format: 'currency' },
    { header: 'Outstanding', key: 'outstandingAmount', width: 120, format: 'currency' },
    { header: 'Interest Rate', key: 'interestRate', width: 100, format: 'percentage' },
    { header: 'Status', key: 'status', width: 100 },
    { header: 'Next Due Date', key: 'nextPaymentDue', width: 110, format: 'date' },
    { header: 'Days Overdue', key: 'daysOverdue', width: 100, format: 'number' },
  ],
  expense_summary: [
    { header: 'Category', key: 'category', width: 150 },
    { header: 'Total Approved', key: 'totalApproved', width: 130, format: 'currency' },
    { header: 'Total Pending', key: 'totalPending', width: 130, format: 'currency' },
    { header: 'Total Rejected', key: 'totalRejected', width: 130, format: 'currency' },
    { header: 'Approved Count', key: 'approvedCount', width: 110, format: 'number' },
    { header: 'Pending Count', key: 'pendingCount', width: 110, format: 'number' },
  ],
  financial_statement: [
    { header: 'Category', key: 'category', width: 180 },
    { header: 'Item', key: 'item', width: 200 },
    { header: 'Amount', key: 'amount', width: 130, format: 'currency' },
    { header: 'Type', key: 'type', width: 100 },
  ],
  member_contribution_history: [
    { header: 'Date', key: 'date', width: 110, format: 'date' },
    { header: 'Plan', key: 'planName', width: 150 },
    { header: 'Period', key: 'period', width: 120 },
    { header: 'Amount', key: 'amount', width: 120, format: 'currency' },
    { header: 'Payment Method', key: 'paymentMethod', width: 130 },
    { header: 'Status', key: 'status', width: 100 },
    { header: 'Reference', key: 'reference', width: 150 },
  ],
  loan_interest: [
    { header: 'Member Name', key: 'memberName', width: 150 },
    { header: 'Loan Type', key: 'loanTypeName', width: 130 },
    { header: 'Principal Amount', key: 'principalAmount', width: 130, format: 'currency' },
    { header: 'Interest Rate (%)', key: 'interestRate', width: 110, format: 'number' },
    { header: 'Total Interest', key: 'interestAmount', width: 120, format: 'currency' },
    { header: 'Interest Paid', key: 'interestPaid', width: 120, format: 'currency' },
    { header: 'Interest Pending', key: 'interestPending', width: 120, format: 'currency' },
    { header: 'Status', key: 'status', width: 100 },
    { header: 'Disbursed Date', key: 'disbursedAt', width: 110, format: 'date' },
  ],
  loan_repayment: [
    { header: 'Member Name', key: 'memberName', width: 150 },
    { header: 'Loan ID', key: 'loanId', width: 130 },
    { header: 'Due Date', key: 'dueDate', width: 110, format: 'date' },
    { header: 'Amount Due', key: 'amountDue', width: 120, format: 'currency' },
    { header: 'Days Overdue', key: 'daysOverdue', width: 100, format: 'number' },
  ],
  member_activity: [
    { header: 'Member Name', key: 'memberName', width: 150 },
    { header: 'Joined Date', key: 'joinedAt', width: 110, format: 'date' },
    { header: 'Last Activity', key: 'lastActivityDate', width: 110, format: 'date' },
    { header: 'Contributions', key: 'contributionCount', width: 110, format: 'number' },
    { header: 'Total Contributed', key: 'totalContributed', width: 130, format: 'currency' },
    { header: 'Loans', key: 'loanCount', width: 80, format: 'number' },
    { header: 'Status', key: 'status', width: 100 },
  ],
};

/**
 * Flatten report data for export
 * Different report types have different structures
 */
export function flattenReportData(reportType: string, reportData: any): any[] {
  switch (reportType) {
    case 'contribution_summary':
      return reportData.byPlan || [];
    case 'member_balances':
      return reportData.members || [];
    case 'loan_summary':
      return reportData.byLoanType || reportData.byType || [];
    case 'loan_outstanding':
      return reportData.loans || [];
    case 'loan_interest':
      return reportData.loanDetails || [];
    case 'loan_repayment':
      return [...(reportData.overdueRepayments || []), ...(reportData.upcomingRepayments || [])];
    case 'member_activity':
      return reportData.memberDetails || [];
    case 'expense_summary':
      return reportData.byCategory || [];
    case 'financial_statement':
      // Flatten the financial statement into rows
      const rows: any[] = [];
      // Income section
      if (reportData.income) {
        rows.push({ category: 'INCOME', item: '', amount: '', type: '' });
        rows.push({
          category: 'Income',
          item: 'Total Contributions',
          amount: reportData.income.contributions,
          type: 'Credit',
        });
        rows.push({
          category: 'Income',
          item: 'Loan Interest',
          amount: reportData.income.loanInterest,
          type: 'Credit',
        });
        rows.push({
          category: 'Income',
          item: 'Other Income',
          amount: reportData.income.otherIncome,
          type: 'Credit',
        });
        rows.push({
          category: 'Income',
          item: 'Total Income',
          amount: reportData.income.totalIncome,
          type: 'Subtotal',
        });
      }
      // Expenses section
      if (reportData.expenses) {
        rows.push({ category: 'EXPENSES', item: '', amount: '', type: '' });
        rows.push({
          category: 'Expenses',
          item: 'Operating Expenses',
          amount: reportData.expenses.operatingExpenses,
          type: 'Debit',
        });
        rows.push({
          category: 'Expenses',
          item: 'Loan Disbursements',
          amount: reportData.expenses.loanDisbursements,
          type: 'Debit',
        });
        rows.push({
          category: 'Expenses',
          item: 'Total Expenses',
          amount: reportData.expenses.totalExpenses,
          type: 'Subtotal',
        });
      }
      // Summary
      if (reportData.summary) {
        rows.push({ category: 'SUMMARY', item: '', amount: '', type: '' });
        rows.push({
          category: 'Summary',
          item: 'Net Balance',
          amount: reportData.summary.netBalance,
          type: 'Net',
        });
        rows.push({
          category: 'Summary',
          item: 'Total Assets',
          amount: reportData.summary.totalAssets,
          type: 'Asset',
        });
        rows.push({
          category: 'Summary',
          item: 'Total Liabilities',
          amount: reportData.summary.totalLiabilities,
          type: 'Liability',
        });
      }
      return rows;
    case 'member_contribution_history':
      return reportData.contributions || [];
    default:
      // Try to return array data if it exists
      if (Array.isArray(reportData)) {
        return reportData;
      }
      // Try common array property names
      const arrayProps = ['items', 'data', 'records', 'results'];
      for (const prop of arrayProps) {
        if (Array.isArray(reportData[prop])) {
          return reportData[prop];
        }
      }
      return [];
  }
}
