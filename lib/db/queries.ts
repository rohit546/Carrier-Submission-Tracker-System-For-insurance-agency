import sql from './connection';
import { User, BusinessType, Carrier, Submission, CarrierQuote } from '../types';
import bcrypt from 'bcryptjs';

// Users
export async function getUsers(): Promise<User[]> {
  const rows = await sql`SELECT * FROM users ORDER BY name`;
  return rows.map(row => ({
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role as 'admin' | 'agent',
    name: row.name,
  }));
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role as 'admin' | 'agent',
    name: row.name,
  };
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const rows = await sql`
    INSERT INTO users (username, password, role, name)
    VALUES (${user.username}, ${hashedPassword}, ${user.role}, ${user.name})
    RETURNING *
  `;
  const row = rows[0];
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role as 'admin' | 'agent',
    name: row.name,
  };
}

// Business Types
export async function getBusinessTypes(): Promise<BusinessType[]> {
  const rows = await sql`SELECT * FROM business_types ORDER BY name`;
  return rows.map(row => ({
    id: row.id,
    name: row.name,
  }));
}

export async function createBusinessType(businessType: Omit<BusinessType, 'id'>): Promise<BusinessType> {
  const rows = await sql`
    INSERT INTO business_types (name)
    VALUES (${businessType.name})
    RETURNING *
  `;
  return {
    id: rows[0].id,
    name: rows[0].name,
  };
}

// Carriers
export async function getCarriers(): Promise<Carrier[]> {
  const rows = await sql`SELECT * FROM carriers ORDER BY name`;
  return rows.map(row => ({
    id: row.id,
    name: row.name,
  }));
}

export async function createCarrier(carrier: Omit<Carrier, 'id'>): Promise<Carrier> {
  const rows = await sql`
    INSERT INTO carriers (name)
    VALUES (${carrier.name})
    RETURNING *
  `;
  return {
    id: rows[0].id,
    name: rows[0].name,
  };
}

// Carrier Appetite
export interface CarrierAppetiteDetail {
  id: string;
  carrierId: string;
  businessTypeId: string;
  playbookData: any;
  geographicRestrictions: string[];
  exclusions: string[];
  status: string;
  coverageDetails: any;
  operationalCriteria: any;
  contactInfo: any;
  notes: string | null;
}

export async function getCarrierAppetite(): Promise<CarrierAppetiteDetail[]> {
  const rows = await sql`
    SELECT * FROM carrier_appetite
    ORDER BY carrier_id, business_type_id
  `;
  return rows.map(row => ({
    id: row.id,
    carrierId: row.carrier_id,
    businessTypeId: row.business_type_id,
    playbookData: row.playbook_data || {},
    geographicRestrictions: row.geographic_restrictions || [],
    exclusions: row.exclusions || [],
    status: row.status || 'active',
    coverageDetails: row.coverage_details || {},
    operationalCriteria: row.operational_criteria || {},
    contactInfo: row.contact_info || {},
    notes: row.notes,
  }));
}

export async function getCarrierAppetiteForBusinessType(businessTypeId: string): Promise<CarrierAppetiteDetail[]> {
  const rows = await sql`
    SELECT * FROM carrier_appetite
    WHERE business_type_id = ${businessTypeId}
    ORDER BY carrier_id
  `;
  return rows.map(row => ({
    id: row.id,
    carrierId: row.carrier_id,
    businessTypeId: row.business_type_id,
    playbookData: row.playbook_data || {},
    geographicRestrictions: row.geographic_restrictions || [],
    exclusions: row.exclusions || [],
    status: row.status || 'active',
    coverageDetails: row.coverage_details || {},
    operationalCriteria: row.operational_criteria || {},
    contactInfo: row.contact_info || {},
    notes: row.notes,
  }));
}

export async function setCarrierAppetite(
  carrierId: string,
  businessTypeId: string,
  data: {
    playbookData?: any;
    geographicRestrictions?: string[];
    exclusions?: string[];
    status?: string;
    coverageDetails?: any;
    operationalCriteria?: any;
    contactInfo?: any;
    notes?: string;
  }
): Promise<CarrierAppetiteDetail> {
  // Upsert: Insert or update
  const rows = await sql`
    INSERT INTO carrier_appetite (
      carrier_id, business_type_id, playbook_data,
      geographic_restrictions, exclusions, status,
      coverage_details, operational_criteria, contact_info, notes
    )
    VALUES (
      ${carrierId}, ${businessTypeId}, ${JSON.stringify(data.playbookData || {})}::jsonb,
      ${data.geographicRestrictions || []}, ${data.exclusions || []}, ${data.status || 'active'},
      ${JSON.stringify(data.coverageDetails || {})}::jsonb,
      ${JSON.stringify(data.operationalCriteria || {})}::jsonb,
      ${JSON.stringify(data.contactInfo || {})}::jsonb,
      ${data.notes || null}
    )
    ON CONFLICT (carrier_id, business_type_id)
    DO UPDATE SET
      playbook_data = ${JSON.stringify(data.playbookData || {})}::jsonb,
      geographic_restrictions = ${data.geographicRestrictions || []},
      exclusions = ${data.exclusions || []},
      status = ${data.status || 'active'},
      coverage_details = ${JSON.stringify(data.coverageDetails || {})}::jsonb,
      operational_criteria = ${JSON.stringify(data.operationalCriteria || {})}::jsonb,
      contact_info = ${JSON.stringify(data.contactInfo || {})}::jsonb,
      notes = ${data.notes || null},
      updated_at = NOW()
    RETURNING *
  `;
  const row = rows[0];
  return {
    id: row.id,
    carrierId: row.carrier_id,
    businessTypeId: row.business_type_id,
    playbookData: row.playbook_data || {},
    geographicRestrictions: row.geographic_restrictions || [],
    exclusions: row.exclusions || [],
    status: row.status || 'active',
    coverageDetails: row.coverage_details || {},
    operationalCriteria: row.operational_criteria || {},
    contactInfo: row.contact_info || {},
    notes: row.notes,
  };
}

export async function deleteCarrierAppetite(carrierId: string, businessTypeId: string): Promise<void> {
  await sql`
    DELETE FROM carrier_appetite
    WHERE carrier_id = ${carrierId} AND business_type_id = ${businessTypeId}
  `;
}

// Submissions
export async function getSubmissions(): Promise<Submission[]> {
  const rows = await sql`
    SELECT s.*, 
           COALESCE(
             json_agg(
               json_build_object(
                 'carrierId', cq.carrier_id,
                 'quoted', cq.quoted,
                 'amount', cq.amount,
                 'remarks', cq.remarks,
                 'selected', cq.selected
               )
             ) FILTER (WHERE cq.id IS NOT NULL),
             '[]'::json
           ) as carriers
    FROM submissions s
    LEFT JOIN carrier_quotes cq ON s.id = cq.submission_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;
  return rows.map(row => ({
    id: row.id,
    businessName: row.business_name,
    businessTypeId: row.business_type_id,
    agentId: row.agent_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    status: row.status as 'draft' | 'quoted' | 'bound',
    carriers: (row.carriers || []) as CarrierQuote[],
  }));
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const rows = await sql`
    SELECT s.*, 
           COALESCE(
             json_agg(
               json_build_object(
                 'carrierId', cq.carrier_id,
                 'quoted', cq.quoted,
                 'amount', cq.amount,
                 'remarks', cq.remarks,
                 'selected', cq.selected
               )
             ) FILTER (WHERE cq.id IS NOT NULL),
             '[]'::json
           ) as carriers
    FROM submissions s
    LEFT JOIN carrier_quotes cq ON s.id = cq.submission_id
    WHERE s.id = ${id}
    GROUP BY s.id
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    businessName: row.business_name,
    businessTypeId: row.business_type_id,
    agentId: row.agent_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    status: row.status as 'draft' | 'quoted' | 'bound',
    carriers: (row.carriers || []) as CarrierQuote[],
  };
}

export async function createSubmission(submission: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Submission> {
  const rows = await sql`
    INSERT INTO submissions (business_name, business_type_id, agent_id, status)
    VALUES (${submission.businessName}, ${submission.businessTypeId}, ${submission.agentId}, ${submission.status})
    RETURNING *
  `;
  const row = rows[0];
  return {
    id: row.id,
    businessName: row.business_name,
    businessTypeId: row.business_type_id,
    agentId: row.agent_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    status: row.status as 'draft' | 'quoted' | 'bound',
    carriers: [],
  };
}

export async function updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission> {
  // Update carrier quotes if provided
  if (updates.carriers !== undefined) {
    await sql`DELETE FROM carrier_quotes WHERE submission_id = ${id}`;
    for (const quote of updates.carriers) {
      await sql`
        INSERT INTO carrier_quotes (submission_id, carrier_id, quoted, amount, remarks, selected)
        VALUES (${id}, ${quote.carrierId}, ${quote.quoted}, ${quote.amount}, ${quote.remarks || ''}, ${quote.selected})
        ON CONFLICT (submission_id, carrier_id)
        DO UPDATE SET
          quoted = ${quote.quoted},
          amount = ${quote.amount},
          remarks = ${quote.remarks || ''},
          selected = ${quote.selected}
      `;
    }
  }

  // Build UPDATE query conditionally
  if (updates.businessName !== undefined && updates.status !== undefined) {
    await sql`
      UPDATE submissions
      SET business_name = ${updates.businessName}, status = ${updates.status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.businessName !== undefined) {
    await sql`
      UPDATE submissions
      SET business_name = ${updates.businessName}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.status !== undefined) {
    await sql`
      UPDATE submissions
      SET status = ${updates.status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.carriers !== undefined) {
    // Only carriers were updated, still update timestamp
    await sql`
      UPDATE submissions
      SET updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  return getSubmission(id) as Promise<Submission>;
}
