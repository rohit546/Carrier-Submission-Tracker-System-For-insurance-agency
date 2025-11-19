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
    SELECT 
      s.id,
      s.business_name,
      s.business_type_id,
      s.agent_id,
      s.created_at,
      s.updated_at,
      s.status,
      s.insured_info_id,
      s.insured_info_snapshot,
      s.source,
      s.eform_submission_id,
      s.public_access_token,
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
    GROUP BY s.id, s.business_name, s.business_type_id, s.agent_id, s.created_at, s.updated_at, s.status, s.insured_info_id, s.insured_info_snapshot, s.source, s.eform_submission_id, s.public_access_token
    ORDER BY s.created_at DESC
  `;
  return rows.map(row => {
    // Parse insured info snapshot if it exists
    let insuredInfoSnapshot = null;
    if (row.insured_info_snapshot) {
      try {
        insuredInfoSnapshot = typeof row.insured_info_snapshot === 'string' 
          ? JSON.parse(row.insured_info_snapshot)
          : row.insured_info_snapshot;
      } catch (e) {
        console.error('Error parsing insured_info_snapshot:', e);
      }
    }
    
    return {
      id: row.id,
      businessName: row.business_name,
      businessTypeId: row.business_type_id,
      agentId: row.agent_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      status: row.status as 'draft' | 'quoted' | 'bound' | 'submitted',
      carriers: (row.carriers || []) as CarrierQuote[],
      insuredInfoId: row.insured_info_id,
      insuredInfoSnapshot: insuredInfoSnapshot,
      source: row.source as 'manual' | 'eform' | 'ghl' | undefined,
      eformSubmissionId: row.eform_submission_id,
      publicAccessToken: row.public_access_token,
    };
  });
}

export async function getSubmission(id: string, publicToken?: string): Promise<Submission | null> {
  let query;
  
  // If public token provided, verify it matches
  if (publicToken) {
    query = sql`
      SELECT 
        s.id,
        s.business_name,
        s.business_type_id,
        s.agent_id,
        s.created_at,
        s.updated_at,
        s.status,
        s.insured_info_id,
        s.insured_info_snapshot,
        s.source,
        s.eform_submission_id,
        s.public_access_token,
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
      WHERE s.id = ${id} AND s.public_access_token = ${publicToken}
      GROUP BY s.id, s.business_name, s.business_type_id, s.agent_id, s.created_at, s.updated_at, s.status, s.insured_info_id, s.insured_info_snapshot, s.source, s.eform_submission_id, s.public_access_token
    `;
  } else {
    query = sql`
      SELECT 
        s.id,
        s.business_name,
        s.business_type_id,
        s.agent_id,
        s.created_at,
        s.updated_at,
        s.status,
        s.insured_info_id,
        s.insured_info_snapshot,
        s.source,
        s.eform_submission_id,
        s.public_access_token,
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
      GROUP BY s.id, s.business_name, s.business_type_id, s.agent_id, s.created_at, s.updated_at, s.status, s.insured_info_id, s.insured_info_snapshot, s.source, s.eform_submission_id, s.public_access_token
    `;
  }
  
  const rows = await query;
  if (rows.length === 0) return null;
  const row = rows[0];
  
  // Parse insured info snapshot if it exists
  let insuredInfoSnapshot = null;
  if (row.insured_info_snapshot) {
    try {
      insuredInfoSnapshot = typeof row.insured_info_snapshot === 'string' 
        ? JSON.parse(row.insured_info_snapshot)
        : row.insured_info_snapshot;
    } catch (e) {
      console.error('Error parsing insured_info_snapshot:', e);
    }
  }
  
  return {
    id: row.id,
    businessName: row.business_name,
    businessTypeId: row.business_type_id,
    agentId: row.agent_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    status: row.status as 'draft' | 'quoted' | 'bound' | 'submitted',
    carriers: (row.carriers || []) as CarrierQuote[],
    insuredInfoId: row.insured_info_id,
    insuredInfoSnapshot: insuredInfoSnapshot,
    source: row.source as 'manual' | 'eform' | 'ghl' | undefined,
    eformSubmissionId: row.eform_submission_id,
    publicAccessToken: row.public_access_token,
  };
}

export async function getInsuredInformation(insuredInfoId: string) {
  const rows = await sql`
    SELECT * FROM insured_information WHERE id = ${insuredInfoId}
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    uniqueIdentifier: row.unique_identifier,
    ownershipType: row.ownership_type,
    corporationName: row.corporation_name,
    contactName: row.contact_name,
    contactNumber: row.contact_number,
    contactEmail: row.contact_email,
    leadSource: row.lead_source,
    proposedEffectiveDate: row.proposed_effective_date?.toISOString(),
    priorCarrier: row.prior_carrier,
    targetPremium: row.target_premium ? parseFloat(row.target_premium) : null,
    applicantIs: row.applicant_is,
    operationDescription: row.operation_description,
    dba: row.dba,
    address: row.address,
    hoursOfOperation: row.hours_of_operation,
    noOfMPOs: row.no_of_mpos,
    constructionType: row.construction_type,
    yearsExpInBusiness: row.years_exp_in_business,
    yearsAtLocation: row.years_at_location,
    yearBuilt: row.year_built,
    yearLatestUpdate: row.year_latest_update,
    totalSqFootage: row.total_sq_footage,
    leasedOutSpace: row.leased_out_space,
    protectionClass: row.protection_class,
    additionalInsured: row.additional_insured,
    alarmInfo: row.alarm_info,
    fireInfo: row.fire_info,
    propertyCoverage: row.property_coverage,
    generalLiability: row.general_liability,
    workersCompensation: row.workers_compensation,
    source: row.source,
    eformSubmissionId: row.eform_submission_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
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
  if (updates.businessName !== undefined && updates.status !== undefined && updates.businessTypeId !== undefined) {
    await sql`
      UPDATE submissions
      SET business_name = ${updates.businessName}, 
          status = ${updates.status}, 
          business_type_id = ${updates.businessTypeId || null},
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.businessName !== undefined && updates.status !== undefined) {
    await sql`
      UPDATE submissions
      SET business_name = ${updates.businessName}, status = ${updates.status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.businessName !== undefined && updates.businessTypeId !== undefined) {
    await sql`
      UPDATE submissions
      SET business_name = ${updates.businessName}, 
          business_type_id = ${updates.businessTypeId || null},
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.status !== undefined && updates.businessTypeId !== undefined) {
    await sql`
      UPDATE submissions
      SET status = ${updates.status}, 
          business_type_id = ${updates.businessTypeId || null},
          updated_at = NOW()
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
  } else if (updates.businessTypeId !== undefined) {
    await sql`
      UPDATE submissions
      SET business_type_id = ${updates.businessTypeId || null}, updated_at = NOW()
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
