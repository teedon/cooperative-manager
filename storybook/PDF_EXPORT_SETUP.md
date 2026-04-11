# PDF Export Setup Instructions

## Backend Dependencies

To enable PDF export functionality, install the required dependencies:

```bash
cd backend
npm install pdfkit @types/pdfkit
```

## What's Implemented

### Backend (`/backend`)
- **PDF Generation Service**: Added `generatePDF()` method in `reports.service.ts`
- **PDF Export Endpoint**: New endpoint `/reports/cooperatives/:id/export/pdf`
- **Professional PDF Layout**: Proper headers, titles, sections, and formatting
- **8 Report Types Supported**:
  - Contribution Summary
  - Member Balances
  - Loan Summary
  - Loan Interest
  - Expense Summary
  - Financial Statement
  - Member Activity
  - Loan Repayment

### Web App (`/new-webapp`)
- **PDF Export Button**: Added red PDF button alongside CSV and Excel
- **API Integration**: `exportReportPDF()` function in `reportsApi.ts`
- **Download Handling**: Automatic PDF download with proper filename

### Mobile App (`/src`)
- **PDF Export Button**: Added red PDF button in export section
- **File Handling**: PDF saved to device Documents directory
- **Auto-open**: Opens PDF automatically after export (iOS & Android)

## PDF Features

✅ **Professional Headers**:
- Report title (e.g., "Contribution Summary Report")
- Cooperative name
- Generation timestamp
- Date range (if applicable)
- Horizontal separator line

✅ **Structured Content**:
- Summary section with key metrics
- Formatted currency values (₦)
- Section headers with proper styling
- Top items/records display (limited for readability)

✅ **Typography**:
- Bold headers (Helvetica-Bold, 14-20pt)
- Regular body text (Helvetica, 8-10pt)
- Consistent spacing and margins

## Usage

### Web App
```typescript
// Export as PDF
await reportsApi.exportReportPDF(cooperativeId, reportType, {
  startDate: '2025-01-01',
  endDate: '2025-12-31'
})
```

### Mobile App
```typescript
// Export as PDF
const blob = await reportsApi.exportReportPDF(cooperativeId, reportType, options)
// PDF automatically saved and opened
```

## Testing

1. Start the backend server
2. Navigate to Reports page (web or mobile)
3. Select any report type
4. Click "Export PDF" button
5. Verify PDF downloads with proper formatting

## File Structure

```
backend/
  src/reports/
    ├── reports.controller.ts     # PDF export endpoint
    └── reports.service.ts         # PDF generation logic

new-webapp/
  src/
    ├── api/reportsApi.ts          # PDF export API call
    └── pages/ReportsPage.tsx       # PDF export button

src/
  ├── api/reportsApi.ts            # Mobile PDF export API
  └── screens/reports/
      └── ReportsScreen.tsx        # Mobile PDF export UI
```

## Notes

- PDFs are generated on the backend for consistency across platforms
- File size is optimized by limiting records displayed
- Currency formatting uses Nigerian Naira (₦) symbol
- PDF layout is optimized for A4 paper size
- All exports use same date range selected in the report

## Next Steps (Optional Enhancements)

1. **Charts & Graphs**: Add visual charts to PDFs
2. **Custom Branding**: Add cooperative logo to PDF header
3. **Multi-page Support**: Handle large reports spanning multiple pages
4. **Pagination**: Add page numbers and footers
5. **Table Formatting**: Improved table layouts for detailed data
