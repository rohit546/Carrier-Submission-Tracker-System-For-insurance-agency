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
  carrierId: string;
  businessTypeId: string;
}

export interface Submission {
  id: string;
  businessName: string;
  businessTypeId: string;
  agentId: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'quoted' | 'bound' | 'submitted';
  carriers: CarrierQuote[];
}

export interface CarrierQuote {
  carrierId: string;
  quoted: boolean;
  amount: number | null;
  remarks: string;
  selected: boolean;
}
