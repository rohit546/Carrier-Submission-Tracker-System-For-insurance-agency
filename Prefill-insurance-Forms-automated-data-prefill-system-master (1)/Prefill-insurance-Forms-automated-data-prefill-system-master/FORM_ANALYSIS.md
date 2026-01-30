# Convenience Store Insurance Form - Comprehensive Analysis

## 📋 Overview
This is a comprehensive e-form application for insurance agents to collect and process convenience store insurance applications. The form integrates with multiple external services for data prefill, CRM management, and submission tracking.

---

## 🏗️ Architecture & Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Form Management**: React Hook Form
- **UI**: Tailwind CSS
- **Maps**: Google Maps API (Places Autocomplete, Drawing Manager, Geocoding)

### Backend Services
- **CRM Integration**: GoHighLevel (GHL) API
- **Property Data**: SmartyStreets API
- **Business Intelligence**: Neon PostgreSQL Database
- **Submission Tracking**: Coversheet (Separate Next.js App)
- **PDF Generation**: jsPDF

### Database
- **Neon PostgreSQL**: Business insights (tobacco licenses, GSOS business details)
- **Coversheet PostgreSQL**: Submission tracking (`insured_information`, `submissions` tables)

---

## 📝 Form Structure

### 1. Authentication Flow (`/auth`)
- **Purpose**: Agent profile selection
- **Agents Available**: Amber, Ana, Zara, Munira, Sana, Tanya, Tej, Raabel, Razia, Shahnaz, Other (Custom Name)
- **Storage**: Agent profile saved to `localStorage`
- **Flow**: Select agent → Continue → Redirect to main form

### 2. Main Form (`/`)

#### Form Sections (116+ fields total):

**A. Address & Property Lookup**
- Address input with Google Autocomplete
- "Fetch Data" button triggers multi-source data enrichment
- Side panel displays fetched data with drag-and-drop functionality

**B. Company Information**
- Corporation Name (required)
- Contact Name (required)
- Contact Number (required)
- Contact Email (required)
- Lead Source (required) - dropdown/input
- Proposed Effective Date
- Prior Carrier
- Target Premium

**C. Applicant Type**
- Individual
- Partnership
- Corporation
- Joint Venture
- LLC
- Other

**D. Ownership Type** (Radio buttons)
- Owner
- Tenant
- Lessor's Risk
- Triple Net Lease

**E. Security Systems**
- Burglar Alarm: Central Station (checkbox), Local (checkbox)
- Fire Alarm: Central Station (checkbox), Local (checkbox)

**F. Operations**
- Operation Description (textarea)

**G. Property Details**
- Year Built
- Total Square Footage
- Construction Type
- Acres
- Hours of Operation
- Number of MPDs (auto-calculates pumps: `noOfMPDs * 20000`)
- Years in Business
- Years at Location
- Year of Latest Update
- Leased Out Space
- Protection Class
- Additional Insured

**H. Financial Information**
- Assessed Value
- Market Value
- Primary Lender
- Mortgage Amount

**I. Location Information**
- County
- Municipality
- Metro Area

**J. Property Coverage**
- Building
- BPP (Business Personal Property)
- BI (Business Interruption)
- Canopy
- Pumps (auto-calculated from MPDs)
- MS (Signs & Lighting)

**K. General Liability Sales** (Monthly & Yearly)
- Inside Sales
- Liquor Sales
- Gasoline Sales (labeled as "gasoline gallons")
- Propane Filling/Exchange
- Carwash
- Cooking

**L. Business Details**
- FEIN (Federal Employer Identification Number)
- DBA (Doing Business As)
- Number of Employees
- Annual Payroll
- Officers Included/Excluded
- Ownership Percentage

---

## 🔄 Data Flow & Integrations

### 1. Address Lookup & Prefill (`/api/prefill`)

**Trigger**: User enters address and clicks "Fetch Data"

**Data Sources** (queried in parallel):
1. **SmartyStreets API**
   - Property attributes (year built, square footage, construction type)
   - Owner information (deed owner, corporation name)
   - Mortgage/lender details
   - Fire/safety features

2. **Google Maps API**
   - Places Autocomplete (address suggestions)
   - Place Details (business name, phone, hours)
   - Geocoding (coordinates)
   - Nearby Search (business type detection)

3. **Neon Database** (Custom Business Intelligence)
   - **Table**: `tobacco_licenses`
     - Query by normalized address (strict matching)
     - Returns: Business name, license ID, license type, address
   - **Table**: `gsos_business_details`
     - Query by business name from tobacco_licenses
     - Returns: NAICS codes, agent name, agent address, formation date
     - Calculates "Years at Location" from formation date

**Response Structure**:
```typescript
{
  success: boolean
  data: { /* mapped form fields */ }
  neon: {
    license: { /* tobacco license data */ }
    business: { /* GSOS business details */ }
  }
  ownership: {
    status: 'owner' | 'tenant' | 'unknown'
    matchedName: string
    neonBusinessName: string
    propertyOwnerName: string
  }
  validation: {
    isValid: boolean
    warnings: string[]
  }
}
```

**Ownership Detection Logic**:
- Compares Neon business name with Smarty property owner name
- If names match → Status: "Owner"
- If names differ → Status: "Tenant"
- If no match found → Status: "Unknown"

**Side Panel Features**:
- Displays all fetched data in organized cards
- Drag-and-drop fields to form inputs
- Shows ownership insights with color-coded badges
- Validation warnings for data quality issues

### 2. Form Submission (`/api/ghl`)

**Trigger**: User clicks "Submit Application"

**Process**:
1. **Validates Required Fields**:
   - Corporation Name
   - Contact Name
   - Contact Email
   - Contact Number
   - Lead Source

2. **Creates/Updates GoHighLevel Contact**:
   - Extracts agent name from `localStorage`
   - Creates contact with company name, email, phone
   - Updates `assigned_mckinney_agent` custom field with agent name

3. **Creates/Updates Opportunity**:
   - Pipeline: `eognXr6blkaNJne4dTvs`
   - Stage: `1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c` (Unfilled)
   - Creates opportunity first (without lead source)
   - Updates `lead_source` custom field in separate PUT request
   - Stores complete form data as JSON note on contact

4. **Saves to Coversheet Database** (`/api/coversheet/submit`):
   - Inserts into `insured_information` table
   - Creates record in `submissions` table
   - Generates `public_access_token` (UUID) for no-auth access
   - Links submission to agent (looks up `agent_id` from `users` table)
   - Returns `submissionId` and `publicAccessToken`

**Response**:
- Success message with Contact ID
- Stores `submissionId` and `publicAccessToken` in component state
- Shows success screen with action buttons

### 3. Resume Forms Feature

**Trigger**: Click "Resume Forms" button in header

**Process**:
1. Fetches incomplete opportunities from GHL (`/api/ghl/resume`)
   - Filters by pipeline stage (Unfilled)
   - Extracts form data from JSON notes
   - Calculates completion percentage
   - Cache-busting on refresh button click

2. Displays list of incomplete forms:
   - Corporation Name
   - Contact Name
   - Date Saved
   - Completion Percentage (color-coded)

3. User selects form → Loads data back into form fields:
   - Maps JSON structure back to form inputs
   - Sets `resumedOpportunityId` and `resumedContactId`
   - On next submit, updates existing opportunity instead of creating new

### 4. PDF Generation

**Trigger**: Click "Download PDF" button after submission

**Process**:
- Uses `jsPDF` library
- Formats all form data into PDF document
- Matches PDF layout to form structure
- Downloads as `convenience-store-application.pdf`

### 5. Start Quote Integration

**Trigger**: Click "Start Quote" button after submission

**Process**:
- Redirects to Coversheet application:
  ```
  https://carrier-submission-tracker-system-for-insurance-production.up.railway.app/agent/submission/{submissionId}
  ```
- Uses `submissionId` from Coversheet database
- No authentication token needed (Coversheet handles access internally)

---

## 🎨 User Interface Features

### Header Bar
- **Agent Profile Display**: Shows logged-in agent name
- **Resume Forms Button**: Shows count of incomplete forms
- **Logout Button**: Clears localStorage and redirects to auth

### Main Form Area
- **Two-Column Layout**: Form on left, data panel on right (when data fetched)
- **Responsive Design**: Adapts to screen size
- **Drag-and-Drop**: Drag data from side panel to form fields
- **Auto-Fill Button**: One-click fill all fields from fetched data
- **Area Measurement Tool**: Google Maps satellite view with polygon drawing for area calculation

### Success Screen
- **Download PDF Button**: Generates and downloads PDF
- **Start Quote Button**: Redirects to Coversheet (only shown if submission successful)
- **Start New Button**: Resets form for new submission

### Resume Panel
- **Slide-out Panel**: Overlay from left side
- **Refresh Button**: Force-refresh with cache-busting
- **Form Selection**: Checkbox selection with "Continue" button
- **Completion Indicators**: Color-coded percentage badges

---

## 🔐 State Management

### React State Variables
```typescript
- isSubmitted: boolean
- showSuccess: boolean
- submittedData: FormData | null
- isLoading: boolean
- fetchMessage: string | null
- smartyData: any
- showSidePanelData: boolean
- searchAddress: string
- agentProfile: string
- showAreaMeasurementTool: boolean
- measuredArea: number | null
- isSavingToGHL: boolean
- ghlMessage: string | null
- showResumePanel: boolean
- resumeForms: any[]
- isLoadingResumeForms: boolean
- selectedResumeForm: string | null
- resumedOpportunityId: string | null
- resumedContactId: string | null
- neonInsights: any
- ownershipInfo: any
- submissionId: string | null
- publicAccessToken: string | null
```

### LocalStorage
- `agentProfile`: Agent name
- `agentLoginTime`: Login timestamp

### React Hook Form
- Form state managed by `useForm<FormData>`
- Validation with `register()` and `errors`
- Field watching with `watch()`
- Programmatic updates with `setValue()`

---

## 🔌 API Endpoints

### `/api/prefill` (POST)
- **Purpose**: Fetch property data from multiple sources
- **Input**: `{ address: string }`
- **Output**: Enriched property data with Neon insights

### `/api/ghl` (POST)
- **Purpose**: Create/update contact and opportunity in GoHighLevel
- **Input**: Complete form data + `_agentName`, `_resumedOpportunityId`, `_resumedContactId`
- **Output**: `{ success: boolean, contactId: string, opportunityId: string }`

### `/api/ghl/resume` (GET)
- **Purpose**: Fetch incomplete forms from GoHighLevel
- **Query Params**: `?t={timestamp}` for cache-busting
- **Output**: `{ success: boolean, forms: Array<FormData> }`

### `/api/coversheet/submit` (POST)
- **Purpose**: Save form data to Coversheet database
- **Input**: Complete form data + `_agentName`
- **Output**: `{ success: boolean, submissionId: string, publicAccessToken: string }`

### `/api/coversheet/verify` (GET)
- **Purpose**: Verify data in Coversheet database
- **Output**: Verification results

---

## 🗄️ Database Schema

### Neon Database (Business Intelligence)

**Table: `tobacco_licenses`**
```sql
- id (SERIAL PRIMARY KEY)
- account_type
- account_commence_date
- license_id (BIGINT UNIQUE)
- list_format_name (TEXT) -- Business name
- list_format_address (TEXT) -- Address
- alt_nic, bond, tobacco, vapor, tbl_license_type
- created_at
```

**Table: `gsos_business_details`**
```sql
- id (SERIAL PRIMARY KEY)
- business_name (TEXT)
- control_number (VARCHAR(50) UNIQUE)
- business_type, business_status, business_purpose
- naics_code, naics_sub_code
- principal_office_address
- formation_date (DATE) -- Used to calculate years at location
- state_of_formation
- registered_agent_name (TEXT)
- registered_agent_physical_address (TEXT)
- registered_agent_county
- officers (JSONB)
- total_officers
- created_at
```

### Coversheet Database (Submission Tracking)

**Table: `insured_information`**
```sql
- id (UUID PRIMARY KEY)
- unique_identifier (VARCHAR(255) UNIQUE)
- ownership_type, corporation_name (NOT NULL)
- contact_name, contact_number, contact_email
- lead_source, proposed_effective_date, prior_carrier, target_premium
- applicant_is, operation_description, dba, address
- hours_of_operation, no_of_mpos, construction_type
- years_exp_in_business, years_at_location
- year_built, year_latest_update, total_sq_footage
- leased_out_space, protection_class, additional_insured
- alarm_info (JSONB), fire_info (JSONB)
- property_coverage (JSONB), general_liability (JSONB)
- workers_compensation (JSONB)
- source (DEFAULT 'eform')
- eform_submission_id (UUID)
- fein (VARCHAR(50))
- created_at, updated_at
```

**Table: `submissions`**
```sql
- id (UUID PRIMARY KEY)
- business_name (VARCHAR(255) NOT NULL)
- business_type_id (UUID, nullable)
- agent_id (UUID NOT NULL, REFERENCES users(id))
- status (VARCHAR(50) DEFAULT 'draft')
- insured_info_id (UUID REFERENCES insured_information(id))
- insured_info_snapshot (JSONB)
- source (VARCHAR(50) DEFAULT 'eform')
- eform_submission_id (UUID)
- public_access_token (UUID UNIQUE)
- created_at, updated_at
```

---

## 🔄 Key Workflows

### New Form Submission
1. Agent logs in → Selects profile
2. Enters address → Fetches data → Reviews side panel
3. Drags/drops or auto-fills form fields
4. Completes remaining fields manually
5. Clicks "Submit Application"
6. Data saved to GHL + Coversheet
7. Success screen → Download PDF or Start Quote

### Resume Incomplete Form
1. Agent clicks "Resume Forms"
2. Selects incomplete form from list
3. Form data loads into fields
4. Agent completes missing fields
5. Clicks "Submit Application"
6. Updates existing GHL opportunity (doesn't create new)

### Data Prefill Workflow
1. User enters address in autocomplete
2. Clicks "Fetch Data"
3. System queries:
   - SmartyStreets (property data)
   - Google Maps (business data)
   - Neon DB (business intelligence)
4. Side panel displays all data
5. User can:
   - Drag individual fields to form
   - Click "Fill All Fields" for bulk fill
   - Review ownership insights
   - Check validation warnings

---

## 🎯 Key Features

### 1. Multi-Source Data Enrichment
- Combines SmartyStreets, Google Maps, and Neon DB
- Intelligent field mapping
- Ownership detection (Owner vs Tenant)

### 2. Smart Address Matching
- Normalizes addresses for flexible matching
- Strict matching to avoid wrong LLCs
- Multiple wildcard patterns for address lookup

### 3. Auto-Calculations
- Pumps coverage = `noOfMPDs * 20000`
- Years at location from formation date
- Canopy coverage from square footage

### 4. Resume Functionality
- Fetches incomplete forms from GHL
- Loads data back into form
- Updates existing opportunity (no duplicates)

### 5. Agent Management
- Agent name stored in localStorage
- Mapped to GHL custom field `assigned_mckinney_agent`
- All submissions linked to agent in Coversheet

### 6. Lead Source Tracking
- Required field in form
- Saved to GHL opportunity custom field `lead_source`
- Stored in Coversheet database

### 7. PDF Generation
- Complete form data exported to PDF
- Matches form layout
- Downloadable after submission

### 8. Coversheet Integration
- Saves to shared PostgreSQL database
- Generates public access token
- "Start Quote" button redirects to Coversheet app

---

## ⚙️ Environment Variables

```env
# GoHighLevel
GHL_API_KEY=pit-xxxxx
GHL_LOCATION_ID=xxxxx

# SmartyStreets
SMARTY_AUTH_ID=xxxxx
SMARTY_AUTH_TOKEN=xxxxx

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx

# Neon Database (Business Intelligence)
NEON_CONNECTION_STRING=postgresql://...

# Coversheet Database
COVERSHEET_STRING=postgresql://...
```

---

## 🐛 Known Issues & Solutions

### Issue: Resume Panel Caching
- **Problem**: Refresh button returned cached data
- **Solution**: Added cache-busting query params and `cache: 'no-store'` headers

### Issue: GHL Lead Source Error
- **Problem**: `leadSource` field rejected during opportunity creation
- **Solution**: Create opportunity first, then update `lead_source` custom field separately

### Issue: Agent ID Not Null Constraint
- **Problem**: `agent_id` required in `submissions` table
- **Solution**: Lookup agent ID from `users` table by username "agent"

### Issue: NaN Values in Database
- **Problem**: Empty numeric fields caused PostgreSQL errors
- **Solution**: Implemented `safeParseInt()` and `safeParseFloat()` to convert NaN to null

---

## 📊 Form Field Count Summary

- **Total Fields**: 116+ fields
- **Required Fields**: 5 (Corporation Name, Contact Name, Contact Email, Contact Number, Lead Source)
- **Auto-Calculated Fields**: 1 (Pumps from MPDs)
- **Nested Objects**: 2 (Burglar Alarm, Fire Alarm)
- **Arrays**: 2 (Safety Features, Risk Factors)
- **Date Fields**: 1 (Proposed Effective Date)
- **Numeric Fields**: 30+ (coverage amounts, sales figures, counts)
- **Text Fields**: 70+ (names, addresses, descriptions)

---

## 🚀 Deployment

- **Platform**: Railway
- **Build System**: Nixpacks
- **Node Version**: 18 or 22
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment**: Production (Asia-Southeast1 region)

---

## 📝 Notes

- Form is designed specifically for insurance agents (not public-facing)
- All data is saved to GoHighLevel CRM for lead management
- Coversheet integration enables quote generation workflow
- Neon database provides business intelligence for risk assessment
- Address matching uses strict logic to ensure accuracy
- Ownership detection helps determine insurance requirements

---

## 🔮 Future Enhancements (Potential)

1. Form validation improvements (client-side + server-side)
2. Multi-step form wizard for better UX
3. Real-time field validation
4. Save draft functionality (localStorage + server)
5. Form templates for different business types
6. Advanced search in resume panel
7. Bulk form operations
8. Analytics dashboard for form submissions
9. Email notifications on submission
10. Integration with additional data sources

---

*Last Updated: November 2025*

