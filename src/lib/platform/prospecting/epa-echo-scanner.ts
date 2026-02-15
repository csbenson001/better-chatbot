import { prospectingRepository } from "lib/db/repository";
import { scoreProspect } from "./prospect-scorer";

const EPA_ECHO_BASE_URL = "https://echo.epa.gov/api";

// ============================================================================
// TYPES
// ============================================================================

export type EchoFacility = {
  facilityId: string;
  facilityName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  latitude: number;
  longitude: number;
  programs: string[];
  complianceStatus: string;
  lastInspectionDate: string | null;
  violationCount: number;
  penaltyAmount: number;
};

export type EchoScanOptions = {
  tenantId: string;
  sourceId: string;
  state?: string;
  zip?: string;
  program?: string[]; // CAA, CWA, RCRA, SDWA, etc.
  complianceStatus?: "violation" | "compliance" | "all";
  radius?: number;
  limit?: number;
};

export type EchoScanResult = {
  facilitiesFound: number;
  prospectsCreated: number;
  prospectsUpdated: number;
  errors: string[];
};

// ============================================================================
// API URL BUILDER
// ============================================================================

export function buildEchoApiUrl(options: EchoScanOptions): string {
  const params = new URLSearchParams();

  if (options.state) {
    params.set("p_st", options.state.toUpperCase());
  }
  if (options.zip) {
    params.set("p_zip", options.zip);
  }
  if (options.program && options.program.length > 0) {
    params.set("p_med", options.program.join(","));
  }
  if (options.complianceStatus === "violation") {
    params.set("p_qnc_status", "Violation");
  } else if (options.complianceStatus === "compliance") {
    params.set("p_qnc_status", "No Violation");
  }
  if (options.radius) {
    params.set("p_radius", String(options.radius));
  }

  const limit = options.limit ?? 100;
  params.set("p_rows", String(limit));
  params.set("output", "JSON");

  return `${EPA_ECHO_BASE_URL}/echo_rest_services.get_facilities?${params.toString()}`;
}

// ============================================================================
// FACILITY PARSER
// ============================================================================

function parseEchoFacility(raw: Record<string, unknown>): EchoFacility {
  const programs: string[] = [];
  if (raw.CAAFlag === "Y") programs.push("CAA");
  if (raw.CWAFlag === "Y") programs.push("CWA");
  if (raw.RCRAFlag === "Y") programs.push("RCRA");
  if (raw.SDWAFlag === "Y") programs.push("SDWA");
  if (raw.TRIFlag === "Y") programs.push("TRI");
  if (raw.NPDESFlag === "Y") programs.push("NPDES");

  return {
    facilityId: String(raw.RegistryID ?? raw.FacilityID ?? ""),
    facilityName: String(raw.FacilityName ?? ""),
    streetAddress: String(raw.StreetAddress ?? raw.Street ?? ""),
    city: String(raw.CityName ?? raw.City ?? ""),
    state: String(raw.StateName ?? raw.StateCode ?? raw.State ?? ""),
    zip: String(raw.ZipCode ?? raw.Zip ?? ""),
    county: String(raw.CountyName ?? raw.County ?? ""),
    latitude: Number(raw.Latitude ?? raw.Lat ?? 0),
    longitude: Number(raw.Longitude ?? raw.Lon ?? 0),
    programs,
    complianceStatus: String(
      raw.QNCStatus ?? raw.ComplianceStatus ?? "Unknown",
    ),
    lastInspectionDate: raw.LastInspectionDate
      ? String(raw.LastInspectionDate)
      : null,
    violationCount: Number(raw.ViolationCount ?? raw.Violations ?? 0),
    penaltyAmount: Number(raw.PenaltyAmount ?? raw.Penalties ?? 0),
  };
}

// ============================================================================
// MAIN SCANNER
// ============================================================================

export async function scanEpaEcho(
  options: EchoScanOptions,
): Promise<EchoScanResult> {
  const result: EchoScanResult = {
    facilitiesFound: 0,
    prospectsCreated: 0,
    prospectsUpdated: 0,
    errors: [],
  };

  const url = buildEchoApiUrl(options);

  let facilities: EchoFacility[];
  try {
    const response = await fetch(url);
    if (!response.ok) {
      result.errors.push(
        `EPA ECHO API returned ${response.status}: ${response.statusText}`,
      );
      return result;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const results = data.Results as Record<string, unknown> | undefined;
    const rawFacilities = (results?.Facilities ?? []) as Record<
      string,
      unknown
    >[];

    facilities = rawFacilities.map(parseEchoFacility);
  } catch (err) {
    result.errors.push(
      `Failed to fetch EPA ECHO data: ${err instanceof Error ? err.message : String(err)}`,
    );
    return result;
  }

  result.facilitiesFound = facilities.length;

  for (const facility of facilities) {
    try {
      await processFacility(facility, options, result);
    } catch (err) {
      result.errors.push(
        `Error processing facility ${facility.facilityId} (${facility.facilityName}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Update the source's lastScanAt timestamp
  try {
    await prospectingRepository.updateProspectSource(
      options.sourceId,
      options.tenantId,
      { lastScanAt: new Date() },
    );
  } catch {
    result.errors.push("Failed to update source scan timestamp");
  }

  return result;
}

// ============================================================================
// FACILITY PROCESSING
// ============================================================================

async function processFacility(
  facility: EchoFacility,
  options: EchoScanOptions,
  result: EchoScanResult,
): Promise<void> {
  // Check if a prospect already exists for this EPA facility
  const existingProspects =
    await prospectingRepository.selectProspectsByTenantId(options.tenantId, {
      tags: [`epa:${facility.facilityId}`],
      limit: 1,
    });

  // Score the prospect based on EPA data
  const scores = scoreProspect({
    industry: "Environmental Services",
    violationCount: facility.violationCount,
    penaltyAmount: facility.penaltyAmount,
    regulatoryPrograms: facility.programs,
    state: facility.state,
  });

  if (existingProspects.length > 0) {
    // Update existing prospect with refreshed data
    const existing = existingProspects[0];
    await prospectingRepository.updateProspect(existing.id, options.tenantId, {
      fitScore: scores.fitScore,
      intentScore: scores.intentScore,
      metadata: {
        ...existing.metadata,
        epaFacilityId: facility.facilityId,
        complianceStatus: facility.complianceStatus,
        violationCount: facility.violationCount,
        penaltyAmount: facility.penaltyAmount,
        programs: facility.programs,
        lastInspectionDate: facility.lastInspectionDate,
        scoreBreakdown: scores.breakdown,
        scoreSignals: scores.signals,
        lastEchoScan: new Date().toISOString(),
      },
    });
    result.prospectsUpdated++;

    // Create signals for significant violations
    await createViolationSignals(existing.id, facility, options.tenantId);
  } else {
    // Create new prospect
    const prospect = await prospectingRepository.insertProspect({
      tenantId: options.tenantId,
      companyName: facility.facilityName,
      industry: "Environmental Services",
      location: {
        address: facility.streetAddress,
        city: facility.city,
        state: facility.state,
        country: "US",
        zip: facility.zip,
      },
      fitScore: scores.fitScore,
      intentScore: scores.intentScore,
      sourceId: options.sourceId,
      sourceType: "epa-echo",
      tags: [
        `epa:${facility.facilityId}`,
        ...facility.programs.map((p) => `program:${p}`),
      ],
      metadata: {
        epaFacilityId: facility.facilityId,
        complianceStatus: facility.complianceStatus,
        violationCount: facility.violationCount,
        penaltyAmount: facility.penaltyAmount,
        programs: facility.programs,
        lastInspectionDate: facility.lastInspectionDate,
        scoreBreakdown: scores.breakdown,
        scoreSignals: scores.signals,
        lastEchoScan: new Date().toISOString(),
      },
    });
    result.prospectsCreated++;

    // Create signals for significant violations
    await createViolationSignals(prospect.id, facility, options.tenantId);

    // Create filing records for enforcement actions
    await createEnforcementFilings(prospect.id, facility, options);
  }
}

// ============================================================================
// SIGNAL & FILING CREATION
// ============================================================================

async function createViolationSignals(
  prospectId: string,
  facility: EchoFacility,
  tenantId: string,
): Promise<void> {
  if (facility.violationCount > 0) {
    await prospectingRepository.insertProspectSignal({
      tenantId,
      prospectId,
      signalType: "violation",
      title: `${facility.violationCount} EPA violation(s) detected`,
      description:
        `Facility "${facility.facilityName}" has ${facility.violationCount} violation(s)` +
        (facility.penaltyAmount > 0
          ? ` with $${facility.penaltyAmount.toLocaleString()} in penalties`
          : "") +
        `. Compliance status: ${facility.complianceStatus}. ` +
        `Programs: ${facility.programs.join(", ")}.`,
      sourceUrl: `https://echo.epa.gov/detailed-facility-report?fid=${facility.facilityId}`,
      sourceType: "epa-echo",
      strength: calculateViolationStrength(
        facility.violationCount,
        facility.penaltyAmount,
      ),
      metadata: {
        facilityId: facility.facilityId,
        violationCount: facility.violationCount,
        penaltyAmount: facility.penaltyAmount,
        complianceStatus: facility.complianceStatus,
        programs: facility.programs,
      },
    });
  }
}

function calculateViolationStrength(
  violationCount: number,
  penaltyAmount: number,
): number {
  let strength = 30;

  // Violation count contribution (up to +30)
  if (violationCount >= 10) strength += 30;
  else if (violationCount >= 5) strength += 20;
  else if (violationCount >= 2) strength += 10;
  else strength += 5;

  // Penalty amount contribution (up to +40)
  if (penaltyAmount >= 100_000) strength += 40;
  else if (penaltyAmount >= 50_000) strength += 30;
  else if (penaltyAmount >= 10_000) strength += 20;
  else if (penaltyAmount > 0) strength += 10;

  return Math.min(100, strength);
}

async function createEnforcementFilings(
  prospectId: string,
  facility: EchoFacility,
  options: EchoScanOptions,
): Promise<void> {
  // Only create a filing record if there are enforcement actions (penalties or violations)
  if (facility.penaltyAmount <= 0 && facility.violationCount <= 0) {
    return;
  }

  const existingFiling =
    await prospectingRepository.selectFilingRecordByExternalId(
      options.tenantId,
      options.sourceId,
      `echo-enforcement-${facility.facilityId}`,
    );

  if (existingFiling) {
    return; // Already recorded
  }

  await prospectingRepository.insertFilingRecord({
    tenantId: options.tenantId,
    sourceId: options.sourceId,
    prospectId,
    externalId: `echo-enforcement-${facility.facilityId}`,
    filingType: "epa-enforcement",
    title: `EPA Enforcement: ${facility.facilityName}`,
    description:
      `${facility.violationCount} violation(s)` +
      (facility.penaltyAmount > 0
        ? `, $${facility.penaltyAmount.toLocaleString()} in penalties`
        : "") +
      `. Programs: ${facility.programs.join(", ")}.`,
    filingDate: facility.lastInspectionDate ?? new Date().toISOString(),
    filingUrl: `https://echo.epa.gov/detailed-facility-report?fid=${facility.facilityId}`,
    facilityName: facility.facilityName,
    facilityId: facility.facilityId,
    state: facility.state.length === 2 ? facility.state : undefined,
    county: facility.county || undefined,
    regulatoryProgram: facility.programs.join(", "),
    companyName: facility.facilityName,
    rawData: {
      facilityId: facility.facilityId,
      complianceStatus: facility.complianceStatus,
      violationCount: facility.violationCount,
      penaltyAmount: facility.penaltyAmount,
      programs: facility.programs,
      latitude: facility.latitude,
      longitude: facility.longitude,
    },
    metadata: {
      scanSource: "epa-echo-scanner",
      scannedAt: new Date().toISOString(),
    },
  });
}
