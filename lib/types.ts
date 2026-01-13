export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'agent';
  name: string;
}

export interface BusinessType {
  id: string;
  name: string;
}

export interface Carrier {
  id: string;
  name: string;
}

export interface CarrierAppetite {
  id?: string;
  carrierId: string;
  businessTypeId: string;
  playbookData?: any;
  geographicRestrictions?: string[];
  exclusions?: string[];
  status?: string;
  coverageDetails?: any;
  operationalCriteria?: any;
  contactInfo?: any;
  notes?: string | null;
}

export interface InsuredInformation {
  id: string;
  uniqueIdentifier?: string;
  ownershipType?: string;
  corporationName: string;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  leadSource?: string;
  proposedEffectiveDate?: string;
  priorCarrier?: string;
  targetPremium?: number;
  applicantIs?: string;
  operationDescription?: string;
  dba?: string;
  address?: string;
  hoursOfOperation?: string;
  noOfMPOs?: number;
  constructionType?: string;
  yearsExpInBusiness?: number;
  yearsAtLocation?: number;
  yearBuilt?: number;
  yearLatestUpdate?: number;
  totalSqFootage?: number;
  leasedOutSpace?: string;
  protectionClass?: string;
  additionalInsured?: string;
  fein?: string; // Federal Employer Identification Number
  alarmInfo?: any;
  fireInfo?: any;
  propertyCoverage?: any;
  generalLiability?: any;
  workersCompensation?: any;
  source?: string;
  eformSubmissionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Submission {
  id: string;
  businessName: string;
  businessTypeId?: string | null; // Now nullable for eform submissions
  agentId: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'quoted' | 'bound' | 'submitted';
  carriers: CarrierQuote[];
  insuredInfoId?: string;
  insuredInfoSnapshot?: InsuredInformation | any;
  source?: 'manual' | 'eform' | 'ghl';
  eformSubmissionId?: string;
  publicAccessToken?: string;
  rpa_tasks?: {
    encova?: RpaTaskStatus;
    guard?: RpaTaskStatus;
    columbia?: RpaTaskStatus;
    novatae?: RpaTaskStatus;
  };
}

export interface RpaTaskStatus {
  task_id: string;
  status: 'queued' | 'accepted' | 'running' | 'completed' | 'failed';
  submitted_at: string;
  accepted_at?: string;
  running_at?: string;
  completed_at?: string;
  result?: {
    policy_code?: string;
    quote_url?: string;
    sheet_url?: string;
    sheetUrl?: string;
    message?: string;
    premiums?: {
      totalGLPremium?: number;
      totalPropertyPremium?: number;
      optionalTotalPremium?: number;
      totalPremium?: number;
    };
  };
  error?: string;
  error_details?: string;
}

export interface CarrierQuote {
  carrierId: string;
  quoted: boolean;
  lob?: string; // Line of Business
  amount: number | null;
  remarks: string;
  selected: boolean;
}
