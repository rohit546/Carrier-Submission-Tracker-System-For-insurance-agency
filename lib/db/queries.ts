import sql from './connection';
import { User, BusinessType, Carrier, Submission, CarrierQuote, NonStandardSubmission, NonStandardQuote, NonStandardFollowup, NonStandardCarrier } from '../types';
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
      s.quoted_by,
      s.insured_info_id,
      s.insured_info_snapshot,
      s.source,
      s.eform_submission_id,
      s.public_access_token,
      s.rpa_tasks,
      COALESCE(
        json_agg(
          json_build_object(
            'carrierId', cq.carrier_id,
            'quoted', cq.quoted,
            'lob', cq.lob,
            'amount', cq.amount,
            'remarks', cq.remarks,
            'selected', cq.selected
          )
        ) FILTER (WHERE cq.id IS NOT NULL),
        '[]'::json
      ) as carriers
    FROM submissions s
    LEFT JOIN carrier_quotes cq ON s.id = cq.submission_id
    GROUP BY s.id, s.business_name, s.business_type_id, s.agent_id, s.created_at, s.updated_at, s.status, s.quoted_by, s.insured_info_id, s.insured_info_snapshot, s.source, s.eform_submission_id, s.public_access_token, s.rpa_tasks
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
    
    // Parse rpa_tasks if it exists
    let rpaTasks = null;
    if (row.rpa_tasks) {
      try {
        rpaTasks = typeof row.rpa_tasks === 'string' 
          ? JSON.parse(row.rpa_tasks)
          : row.rpa_tasks;
      } catch (e) {
        console.error('Error parsing rpa_tasks:', e);
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
      quotedBy: row.quoted_by || undefined,
      carriers: (row.carriers || []) as CarrierQuote[],
      insuredInfoId: row.insured_info_id,
      insuredInfoSnapshot: insuredInfoSnapshot,
      source: row.source as 'manual' | 'eform' | 'ghl' | undefined,
      eformSubmissionId: row.eform_submission_id,
      publicAccessToken: row.public_access_token,
      rpa_tasks: rpaTasks,
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
        s.quoted_by,
        s.insured_info_id,
        s.insured_info_snapshot,
        s.source,
        s.eform_submission_id,
        s.public_access_token,
        s.rpa_tasks,
        COALESCE(
          json_agg(
            json_build_object(
              'carrierId', cq.carrier_id,
              'quoted', cq.quoted,
              'lob', cq.lob,
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
      GROUP BY s.id, s.business_name, s.business_type_id, s.agent_id, s.created_at, s.updated_at, s.status, s.quoted_by, s.insured_info_id, s.insured_info_snapshot, s.source, s.eform_submission_id, s.public_access_token, s.rpa_tasks
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
        s.quoted_by,
        s.insured_info_id,
        s.insured_info_snapshot,
        s.source,
        s.eform_submission_id,
        s.public_access_token,
        s.rpa_tasks,
        COALESCE(
          json_agg(
            json_build_object(
              'carrierId', cq.carrier_id,
              'quoted', cq.quoted,
              'lob', cq.lob,
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
      GROUP BY s.id, s.business_name, s.business_type_id, s.agent_id, s.created_at, s.updated_at, s.status, s.quoted_by, s.insured_info_id, s.insured_info_snapshot, s.source, s.eform_submission_id, s.public_access_token, s.rpa_tasks
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
  
  // Parse rpa_tasks if it exists
  let rpaTasks = null;
  if (row.rpa_tasks) {
    try {
      rpaTasks = typeof row.rpa_tasks === 'string' 
        ? JSON.parse(row.rpa_tasks)
        : row.rpa_tasks;
    } catch (e) {
      console.error('Error parsing rpa_tasks:', e);
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
    quotedBy: row.quoted_by || undefined,
    carriers: (row.carriers || []) as CarrierQuote[],
    insuredInfoId: row.insured_info_id,
    insuredInfoSnapshot: insuredInfoSnapshot,
    source: row.source as 'manual' | 'eform' | 'ghl' | undefined,
    eformSubmissionId: row.eform_submission_id,
    publicAccessToken: row.public_access_token,
    rpa_tasks: rpaTasks,
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
    fein: row.fein || row.fein_id || row.federal_employer_id || null, // Try multiple possible column names
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

export async function updateInsuredInformation(
  insuredInfoId: string,
  updates: Partial<{
    ownershipType: string | null;
    corporationName: string;
    contactName: string | null;
    contactNumber: string | null;
    contactEmail: string | null;
    leadSource: string | null;
    proposedEffectiveDate: string | null;
    priorCarrier: string | null;
    targetPremium: number | null;
    applicantIs: string | null;
    operationDescription: string | null;
    dba: string | null;
    address: string | null;
    hoursOfOperation: string | null;
    noOfMPOs: number | null;
    constructionType: string | null;
    yearsExpInBusiness: number | null;
    yearsAtLocation: number | null;
    yearBuilt: number | null;
    yearLatestUpdate: number | null;
    totalSqFootage: number | null;
    leasedOutSpace: string | null;
    protectionClass: string | null;
    additionalInsured: string | null;
    fein: string | null;
    alarmInfo: any;
    fireInfo: any;
    propertyCoverage: any;
    generalLiability: any;
    workersCompensation: any;
  }>
) {
  // Validate required field
  if (updates.corporationName !== undefined && !updates.corporationName?.trim()) {
    throw new Error('Corporation name is required');
  }

  // Get current values first
  const current = await getInsuredInformation(insuredInfoId);
  if (!current) {
    throw new Error('Insured information not found');
  }

  // Build UPDATE query - only update fields that are provided
  await sql`
    UPDATE insured_information
    SET
      ownership_type = ${updates.ownershipType !== undefined ? updates.ownershipType : current.ownershipType},
      corporation_name = ${updates.corporationName !== undefined ? updates.corporationName : current.corporationName},
      contact_name = ${updates.contactName !== undefined ? updates.contactName : current.contactName},
      contact_number = ${updates.contactNumber !== undefined ? updates.contactNumber : current.contactNumber},
      contact_email = ${updates.contactEmail !== undefined ? updates.contactEmail : current.contactEmail},
      lead_source = ${updates.leadSource !== undefined ? updates.leadSource : current.leadSource},
      proposed_effective_date = ${updates.proposedEffectiveDate !== undefined ? (updates.proposedEffectiveDate ? new Date(updates.proposedEffectiveDate) : null) : (current.proposedEffectiveDate ? new Date(current.proposedEffectiveDate) : null)},
      prior_carrier = ${updates.priorCarrier !== undefined ? updates.priorCarrier : current.priorCarrier},
      target_premium = ${updates.targetPremium !== undefined ? updates.targetPremium : current.targetPremium},
      applicant_is = ${updates.applicantIs !== undefined ? updates.applicantIs : current.applicantIs},
      operation_description = ${updates.operationDescription !== undefined ? updates.operationDescription : current.operationDescription},
      dba = ${updates.dba !== undefined ? updates.dba : current.dba},
      address = ${updates.address !== undefined ? updates.address : current.address},
      hours_of_operation = ${updates.hoursOfOperation !== undefined ? updates.hoursOfOperation : current.hoursOfOperation},
      no_of_mpos = ${updates.noOfMPOs !== undefined ? updates.noOfMPOs : current.noOfMPOs},
      construction_type = ${updates.constructionType !== undefined ? updates.constructionType : current.constructionType},
      years_exp_in_business = ${updates.yearsExpInBusiness !== undefined ? updates.yearsExpInBusiness : current.yearsExpInBusiness},
      years_at_location = ${updates.yearsAtLocation !== undefined ? updates.yearsAtLocation : current.yearsAtLocation},
      year_built = ${updates.yearBuilt !== undefined ? updates.yearBuilt : current.yearBuilt},
      year_latest_update = ${updates.yearLatestUpdate !== undefined ? updates.yearLatestUpdate : current.yearLatestUpdate},
      total_sq_footage = ${updates.totalSqFootage !== undefined ? updates.totalSqFootage : current.totalSqFootage},
      leased_out_space = ${updates.leasedOutSpace !== undefined ? updates.leasedOutSpace : current.leasedOutSpace},
      protection_class = ${updates.protectionClass !== undefined ? updates.protectionClass : current.protectionClass},
      additional_insured = ${updates.additionalInsured !== undefined ? updates.additionalInsured : current.additionalInsured},
      fein = ${updates.fein !== undefined ? updates.fein : current.fein},
      alarm_info = ${updates.alarmInfo !== undefined ? JSON.stringify(updates.alarmInfo) : JSON.stringify(current.alarmInfo || {})}::jsonb,
      fire_info = ${updates.fireInfo !== undefined ? JSON.stringify(updates.fireInfo) : JSON.stringify(current.fireInfo || {})}::jsonb,
      property_coverage = ${updates.propertyCoverage !== undefined ? JSON.stringify(updates.propertyCoverage) : JSON.stringify(current.propertyCoverage || {})}::jsonb,
      general_liability = ${updates.generalLiability !== undefined ? JSON.stringify(updates.generalLiability) : JSON.stringify(current.generalLiability || {})}::jsonb,
      workers_compensation = ${updates.workersCompensation !== undefined ? JSON.stringify(updates.workersCompensation) : JSON.stringify(current.workersCompensation || {})}::jsonb,
      updated_at = NOW()
    WHERE id = ${insuredInfoId}
  `;

  // Also update the snapshot in submissions table
  const updatedInfo = await getInsuredInformation(insuredInfoId);
  if (updatedInfo) {
    // Format for snapshot (convert to camelCase)
    const snapshot = {
      id: updatedInfo.id,
      uniqueIdentifier: updatedInfo.uniqueIdentifier,
      ownershipType: updatedInfo.ownershipType,
      corporationName: updatedInfo.corporationName,
      contactName: updatedInfo.contactName,
      contactNumber: updatedInfo.contactNumber,
      contactEmail: updatedInfo.contactEmail,
      leadSource: updatedInfo.leadSource,
      proposedEffectiveDate: updatedInfo.proposedEffectiveDate,
      priorCarrier: updatedInfo.priorCarrier,
      targetPremium: updatedInfo.targetPremium,
      applicantIs: updatedInfo.applicantIs,
      operationDescription: updatedInfo.operationDescription,
      dba: updatedInfo.dba,
      address: updatedInfo.address,
      hoursOfOperation: updatedInfo.hoursOfOperation,
      noOfMPOs: updatedInfo.noOfMPOs,
      constructionType: updatedInfo.constructionType,
      yearsExpInBusiness: updatedInfo.yearsExpInBusiness,
      yearsAtLocation: updatedInfo.yearsAtLocation,
      yearBuilt: updatedInfo.yearBuilt,
      yearLatestUpdate: updatedInfo.yearLatestUpdate,
      totalSqFootage: updatedInfo.totalSqFootage,
      leasedOutSpace: updatedInfo.leasedOutSpace,
      protectionClass: updatedInfo.protectionClass,
      additionalInsured: updatedInfo.additionalInsured,
      fein: updatedInfo.fein,
      alarmInfo: updatedInfo.alarmInfo,
      fireInfo: updatedInfo.fireInfo,
      propertyCoverage: updatedInfo.propertyCoverage,
      generalLiability: updatedInfo.generalLiability,
      workersCompensation: updatedInfo.workersCompensation,
      source: updatedInfo.source,
      eformSubmissionId: updatedInfo.eformSubmissionId,
      createdAt: updatedInfo.createdAt,
      updatedAt: updatedInfo.updatedAt,
    };

    await sql`
      UPDATE submissions
      SET insured_info_snapshot = ${JSON.stringify(snapshot)}::jsonb
      WHERE insured_info_id = ${insuredInfoId}
    `;
  }

  return updatedInfo;
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
        INSERT INTO carrier_quotes (submission_id, carrier_id, quoted, lob, amount, remarks, selected)
        VALUES (${id}, ${quote.carrierId}, ${quote.quoted}, ${quote.lob || null}, ${quote.amount}, ${quote.remarks || ''}, ${quote.selected})
        ON CONFLICT (submission_id, carrier_id)
        DO UPDATE SET
          quoted = ${quote.quoted},
          lob = ${quote.lob || null},
          amount = ${quote.amount},
          remarks = ${quote.remarks || ''},
          selected = ${quote.selected}
      `;
    }
  }

  // Build UPDATE query - handle status and quotedBy together (common case from save)
  if (updates.status !== undefined && updates.quotedBy !== undefined) {
    await sql`
      UPDATE submissions
      SET status = ${updates.status}, 
          quoted_by = ${updates.quotedBy || null},
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.businessName !== undefined && updates.status !== undefined && updates.businessTypeId !== undefined && updates.quotedBy !== undefined) {
    await sql`
      UPDATE submissions
      SET business_name = ${updates.businessName}, 
          status = ${updates.status}, 
          business_type_id = ${updates.businessTypeId || null},
          quoted_by = ${updates.quotedBy || null},
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.businessName !== undefined && updates.status !== undefined && updates.quotedBy !== undefined) {
    await sql`
      UPDATE submissions
      SET business_name = ${updates.businessName}, 
          status = ${updates.status}, 
          quoted_by = ${updates.quotedBy || null},
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.businessName !== undefined && updates.status !== undefined && updates.businessTypeId !== undefined) {
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
      SET business_name = ${updates.businessName}, 
          status = ${updates.status}, 
          updated_at = NOW()
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
      SET business_name = ${updates.businessName}, 
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.status !== undefined) {
    await sql`
      UPDATE submissions
      SET status = ${updates.status}, 
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.businessTypeId !== undefined) {
    await sql`
      UPDATE submissions
      SET business_type_id = ${updates.businessTypeId || null}, 
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (updates.quotedBy !== undefined) {
    await sql`
      UPDATE submissions
      SET quoted_by = ${updates.quotedBy || null}, 
          updated_at = NOW()
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

// Non-Standard Submissions
export async function createNonStandardSubmission(data: {
  submission_id: string;
  from_email: string;
  to_emails: string[];
  cc_emails?: string[];
  subject: string;
  body: string;
  carriers?: NonStandardCarrier[];
}): Promise<NonStandardSubmission> {
  const rows = await sql`
    INSERT INTO non_standard_submissions (
      submission_id, from_email, to_emails, cc_emails, subject, body, sent_at, carriers
    )
    VALUES (
      ${data.submission_id},
      ${data.from_email},
      ${data.to_emails},
      ${data.cc_emails || []},
      ${data.subject},
      ${data.body},
      NOW(),
      ${JSON.stringify(data.carriers || [])}::jsonb
    )
    RETURNING *
  `;
  const row = rows[0];
  return {
    id: row.id,
    submission_id: row.submission_id,
    from_email: row.from_email,
    to_emails: row.to_emails,
    cc_emails: row.cc_emails || [],
    subject: row.subject,
    body: row.body,
    sent_at: row.sent_at.toISOString(),
    status: row.status,
    carriers: row.carriers || [],
    quotes: row.quotes || [],
    followups: row.followups || [],
    last_activity_at: row.last_activity_at?.toISOString(),
    last_activity_type: row.last_activity_type,
    notes: row.notes,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function getNonStandardSubmissions(submissionId: string): Promise<NonStandardSubmission[]> {
  const rows = await sql`
    SELECT * FROM non_standard_submissions
    WHERE submission_id = ${submissionId}
    ORDER BY sent_at DESC
  `;
  return rows.map(row => ({
    id: row.id,
    submission_id: row.submission_id,
    from_email: row.from_email,
    to_emails: row.to_emails,
    cc_emails: row.cc_emails || [],
    subject: row.subject,
    body: row.body,
    sent_at: row.sent_at.toISOString(),
    status: row.status,
    carriers: row.carriers || [],
    quotes: row.quotes || [],
    followups: row.followups || [],
    last_activity_at: row.last_activity_at?.toISOString(),
    last_activity_type: row.last_activity_type,
    notes: row.notes,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }));
}

export async function getNonStandardSubmission(id: string): Promise<NonStandardSubmission | null> {
  const rows = await sql`
    SELECT * FROM non_standard_submissions
    WHERE id = ${id}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    submission_id: row.submission_id,
    from_email: row.from_email,
    to_emails: row.to_emails,
    cc_emails: row.cc_emails || [],
    subject: row.subject,
    body: row.body,
    sent_at: row.sent_at.toISOString(),
    status: row.status,
    carriers: row.carriers || [],
    quotes: row.quotes || [],
    followups: row.followups || [],
    last_activity_at: row.last_activity_at?.toISOString(),
    last_activity_type: row.last_activity_type,
    notes: row.notes,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function updateNonStandardSubmission(
  id: string,
  updates: {
    status?: NonStandardSubmission['status'];
    carriers?: NonStandardCarrier[];
    quotes?: NonStandardQuote[];
    followups?: NonStandardFollowup[];
    notes?: string;
    last_activity_at?: string;
    last_activity_type?: string;
  }
): Promise<NonStandardSubmission> {
  if (updates.status !== undefined) {
    await sql`
      UPDATE non_standard_submissions
      SET status = ${updates.status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
  if (updates.carriers !== undefined) {
    await sql`
      UPDATE non_standard_submissions
      SET carriers = ${JSON.stringify(updates.carriers)}::jsonb, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
  if (updates.quotes !== undefined) {
    await sql`
      UPDATE non_standard_submissions
      SET quotes = ${JSON.stringify(updates.quotes)}::jsonb, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
  if (updates.followups !== undefined) {
    await sql`
      UPDATE non_standard_submissions
      SET followups = ${JSON.stringify(updates.followups)}::jsonb, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
  if (updates.notes !== undefined) {
    await sql`
      UPDATE non_standard_submissions
      SET notes = ${updates.notes}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
  if (updates.last_activity_at !== undefined) {
    await sql`
      UPDATE non_standard_submissions
      SET last_activity_at = ${updates.last_activity_at ? new Date(updates.last_activity_at) : null}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
  if (updates.last_activity_type !== undefined) {
    await sql`
      UPDATE non_standard_submissions
      SET last_activity_type = ${updates.last_activity_type}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
  
  return getNonStandardSubmission(id) as Promise<NonStandardSubmission>;
}
