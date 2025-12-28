# Bulk Offline Members Upload - Visual Guide

## User Journey

### Step 1: Access Feature
- **Location**: Cooperative Details Page → Admin Actions Section
- **Button**: "Offline Members" with Users icon and cyan theme
- **Access**: Admin/Moderator only

### Step 2: Modal Opens
**Header:**
- Gradient background (blue-600 to indigo-600)
- FileSpreadsheet icon
- Title: "Bulk Upload Offline Members"
- Subtitle: "Upload multiple members via CSV file"

**Content:**
1. **Instructions Box** (blue background)
   - Alert icon with step-by-step instructions
   - Clear numbered list

2. **Download Template Button**
   - Dashed border outline
   - Download icon
   - Text: "Download CSV Template"

3. **File Upload Area**
   - Large dashed border box
   - Upload icon (or CheckCircle when file uploaded)
   - Drag and drop zone
   - Click to browse

### Step 3: Template Download
**CSV File Contents:**
```csv
First Name*,Last Name*,Phone,Email,Address
John,Doe,08012345678,john.doe@example.com,"123 Main Street, Lagos"
Jane,Smith,08098765432,jane.smith@example.com,"456 Oak Avenue, Abuja"
Michael,Johnson,07011223344,,"Plot 789, Victoria Island"
```

### Step 4: File Upload
**After selecting file:**
- Upload area turns green
- Shows filename
- Shows member count
- CheckCircle icon displayed

### Step 5: Validation
**If errors exist:**
- Red error box appears
- Lists errors with row numbers
- Format: "Row 5: First Name - First name is required"
- Shows up to 10 errors, then "...and X more"

### Step 6: Preview
**Table Display:**
- Shows first 10 members
- Columns: #, First Name, Last Name, Phone, Email
- Gray background with scrollable content
- "...and X more members" if > 10

### Step 7: Upload
**Upload Button:**
- Blue primary button
- Upload icon + "Upload Members" text
- Changes to loading state with spinner when clicked
- Text changes to "Uploading..."
- Button disabled during upload

### Step 8: Success
**Success State:**
- Large green CheckCircle icon (center)
- Title: "Upload Successful!"
- Message: "X member(s) uploaded successfully"
- Auto-closes after 2 seconds
- Toast notification on main page

## Color Scheme

### Theme Colors
- **Primary Blue**: #3B82F6 (blue-600)
- **Indigo**: #4F46E5 (indigo-600)
- **Cyan**: #06B6D4 (cyan-600)
- **Green Success**: #10B981 (green-600)
- **Red Error**: #EF4444 (red-600)
- **Gray Neutral**: #6B7280 (gray-600)

### Component Colors
- **Header Gradient**: blue-600 → indigo-600
- **Instructions**: Blue-50 background, blue-800 text
- **Upload Area (empty)**: Gray-300 border
- **Upload Area (file)**: Green-500 border, green-50 background
- **Errors**: Red-50 background, red-700 text
- **Preview**: Gray-50 background, gray-200 borders
- **Success**: Green-100 background, green-600 icon

## Icon Usage

| Component | Icon | Color | Size |
|-----------|------|-------|------|
| Modal Header | FileSpreadsheet | White | 24px |
| Instructions | AlertCircle | Blue-900 | 20px |
| Download Button | Download | Gray-700 | 20px |
| Upload Area (empty) | Upload | Gray-400 | 48px |
| Upload Area (file) | CheckCircle2 | Green-600 | 48px |
| Error Section | AlertCircle | Red-900 | 20px |
| Success State | CheckCircle2 | Green-600 | 64px |
| Upload Button | Upload | White | 16px |
| Loading State | Loader2 (spinning) | White | 16px |
| Close Button | X | White | 20px |

## Responsive Design

### Desktop (>768px)
- Modal max-width: 896px (4xl)
- Full table preview visible
- Side-by-side layout where applicable

### Mobile (<768px)
- Modal width: calc(100% - 2rem)
- Stacked layout
- Scrollable table
- Touch-friendly buttons (min 44px height)

## Animations

1. **Modal Entry**: Fade in with backdrop blur
2. **File Upload**: Border color transition
3. **Icon Change**: Smooth transition from Upload to CheckCircle
4. **Button Hover**: Background and border color transitions
5. **Loading Spinner**: Continuous rotation
6. **Success State**: Scale-in animation for icon
7. **Modal Exit**: Fade out

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter to trigger buttons
- Escape to close modal
- File input accessible via keyboard

### Screen Reader Support
- Proper ARIA labels on buttons
- Descriptive text for icon-only elements
- Error announcements
- Success confirmations

### Visual Feedback
- High contrast colors (WCAG AA compliant)
- Clear focus indicators
- Loading states with text + icon
- Disabled states clearly indicated

## Error States

### File Type Error
- Alert: "Please upload a CSV file"
- Triggered when wrong file type selected

### Empty File
- Alert: "CSV file must contain at least a header row and one data row"
- Triggered when file has no data

### Validation Errors
- Red error box with scrollable list
- Confirmation dialog before upload: "There are X validation errors. Continue with valid members only?"

### Upload Failure
- Alert: "Failed to upload members. Please try again."
- Console error logged for debugging

## States

### Initial State
- No file selected
- Upload button disabled
- Empty preview areas

### File Selected State
- File name displayed
- Member count shown
- Preview table populated
- Upload button enabled (if valid members exist)

### Uploading State
- Upload button shows spinner
- Button disabled
- Text: "Uploading..."
- Cancel button disabled
- Close button disabled

### Success State
- Large success icon
- Success message
- All other content hidden
- Auto-close timer active

## Business Rules

### Validation Rules
1. First Name: Required, non-empty
2. Last Name: Required, non-empty
3. Phone: Optional, no format validation on frontend
4. Email: Optional, no format validation on frontend
5. Address: Optional, no length limits

### Upload Limits
- No frontend limit on row count
- Backend should implement limits (recommended: 100-500 rows)
- Large files may cause browser performance issues

### Duplicate Handling
- No frontend duplicate detection
- Backend should handle duplicates
- Recommended: Check against existing members by name+phone/email

## Integration Points

### Parent Component
- `CooperativeDetailsPage.tsx`
- Triggers via "Offline Members" button
- Receives success callback
- Shows toast notification
- Refreshes member list

### API Integration
- Currently simulated (2-second delay)
- Replace with actual API call to backend
- See BULK_UPLOAD_FEATURE.md for details

### State Management
- Local component state (no Redux)
- File state
- Parsed members array
- Validation errors array
- Upload status flags
