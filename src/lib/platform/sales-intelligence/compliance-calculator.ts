export interface ComplianceInput {
  facilityCount: number;
  regulatoryPrograms: string[];
  state?: string;
  industry?: string;
  employeeCount?: number;
  hasViolations?: boolean;
}

export interface ComplianceEstimate {
  estimatedAnnualCost: number;
  costBreakdown: Array<{
    category: string;
    annualCost: number;
    description: string;
    automatable: boolean;
    potentialSavings: number;
  }>;
  riskLevel: "low" | "medium" | "high" | "critical";
  savingsOpportunity: number;
  roiProjection: {
    year1Savings: number;
    year3Savings: number;
    implementationCost: number;
    paybackMonths: number;
    roi3Year: number;
  };
}

// Base costs per regulatory program (annual per facility)
const PROGRAM_COSTS: Record<
  string,
  { base: number; description: string; automatable: number }
> = {
  CAA: {
    base: 45000,
    description:
      "Clean Air Act compliance - emissions monitoring, reporting, permits",
    automatable: 0.45,
  },
  CWA: {
    base: 35000,
    description:
      "Clean Water Act - discharge monitoring, stormwater management",
    automatable: 0.4,
  },
  RCRA: {
    base: 30000,
    description:
      "Resource Conservation & Recovery Act - hazardous waste management",
    automatable: 0.35,
  },
  TSCA: {
    base: 20000,
    description: "Toxic Substances Control Act - chemical inventory reporting",
    automatable: 0.5,
  },
  EPCRA: {
    base: 15000,
    description: "Emergency Planning and Community Right-to-Know Act",
    automatable: 0.55,
  },
  TRI: {
    base: 25000,
    description: "Toxics Release Inventory reporting",
    automatable: 0.6,
  },
  MACT: {
    base: 55000,
    description: "Maximum Achievable Control Technology standards",
    automatable: 0.4,
  },
  NSPS: {
    base: 40000,
    description: "New Source Performance Standards compliance",
    automatable: 0.45,
  },
  "Title V": {
    base: 50000,
    description: "Title V operating permit compliance",
    automatable: 0.5,
  },
  SPCC: {
    base: 20000,
    description: "Spill Prevention, Control, and Countermeasure",
    automatable: 0.3,
  },
  NPDES: {
    base: 30000,
    description: "National Pollutant Discharge Elimination System",
    automatable: 0.4,
  },
  RMP: {
    base: 35000,
    description: "Risk Management Program for chemical facilities",
    automatable: 0.35,
  },
  GHG: {
    base: 25000,
    description: "Greenhouse Gas reporting and monitoring",
    automatable: 0.55,
  },
  LDAR: {
    base: 60000,
    description: "Leak Detection and Repair programs",
    automatable: 0.3,
  },
  OGI: {
    base: 40000,
    description: "Optical Gas Imaging surveys and monitoring",
    automatable: 0.25,
  },
};

// Overhead categories
const OVERHEAD_CATEGORIES = [
  {
    category: "Staff & Training",
    percentage: 0.15,
    description: "Compliance staff salaries, training, certifications",
    automatable: false,
  },
  {
    category: "Record Keeping",
    percentage: 0.1,
    description: "Document management, data entry, filing systems",
    automatable: true,
  },
  {
    category: "Consulting Fees",
    percentage: 0.12,
    description: "External consultants, legal review, third-party audits",
    automatable: false,
  },
  {
    category: "Software & Systems",
    percentage: 0.05,
    description: "Current compliance management tools",
    automatable: true,
  },
  {
    category: "Audit Preparation",
    percentage: 0.08,
    description: "Internal and external audit prep, mock inspections",
    automatable: true,
  },
];

export function calculateComplianceBurden(
  input: ComplianceInput,
): ComplianceEstimate {
  const costBreakdown: Array<{
    category: string;
    annualCost: number;
    description: string;
    automatable: boolean;
    potentialSavings: number;
  }> = [];

  // Calculate program-specific costs
  let programCosts = 0;
  for (const program of input.regulatoryPrograms) {
    const cost = PROGRAM_COSTS[program];
    if (cost) {
      const facilityAdjusted = cost.base * input.facilityCount;
      const savings = Math.round(facilityAdjusted * cost.automatable);
      costBreakdown.push({
        category: `${program} Compliance`,
        annualCost: facilityAdjusted,
        description: cost.description,
        automatable: cost.automatable > 0.3,
        potentialSavings: savings,
      });
      programCosts += facilityAdjusted;
    }
  }

  // Calculate overhead costs
  for (const overhead of OVERHEAD_CATEGORIES) {
    const annualCost = Math.round(programCosts * overhead.percentage);
    costBreakdown.push({
      category: overhead.category,
      annualCost,
      description: overhead.description,
      automatable: overhead.automatable,
      potentialSavings: overhead.automatable ? Math.round(annualCost * 0.6) : 0,
    });
  }

  // Violation surcharge
  if (input.hasViolations) {
    const violationCost = Math.round(programCosts * 0.08);
    costBreakdown.push({
      category: "Violation Remediation",
      annualCost: violationCost,
      description:
        "Additional costs from violation response, corrective actions, and enhanced monitoring",
      automatable: true,
      potentialSavings: Math.round(violationCost * 0.7),
    });
  }

  const estimatedAnnualCost = costBreakdown.reduce(
    (sum, c) => sum + c.annualCost,
    0,
  );
  const savingsOpportunity = costBreakdown.reduce(
    (sum, c) => sum + c.potentialSavings,
    0,
  );

  // Calculate risk level
  const riskLevel = calculateRiskLevel(input);

  // ROI projection
  const implementationCost = Math.round(estimatedAnnualCost * 0.15); // 15% of annual cost
  const year1Savings = Math.round(savingsOpportunity * 0.6); // 60% savings in year 1 (ramp up)
  const year3Savings = savingsOpportunity * 3 - savingsOpportunity * 0.4; // Full savings years 2-3
  const paybackMonths = Math.round(
    implementationCost / (savingsOpportunity / 12),
  );
  const roi3Year = Math.round(
    ((year3Savings - implementationCost) / implementationCost) * 100,
  );

  return {
    estimatedAnnualCost,
    costBreakdown,
    riskLevel,
    savingsOpportunity,
    roiProjection: {
      year1Savings,
      year3Savings,
      implementationCost,
      paybackMonths: Math.min(paybackMonths, 36),
      roi3Year,
    },
  };
}

function calculateRiskLevel(
  input: ComplianceInput,
): "low" | "medium" | "high" | "critical" {
  let riskScore = 0;

  riskScore += Math.min(input.facilityCount * 5, 30);
  riskScore += Math.min(input.regulatoryPrograms.length * 8, 40);
  if (input.hasViolations) riskScore += 25;
  if (
    input.regulatoryPrograms.includes("MACT") ||
    input.regulatoryPrograms.includes("RMP")
  )
    riskScore += 10;

  if (riskScore >= 80) return "critical";
  if (riskScore >= 55) return "high";
  if (riskScore >= 30) return "medium";
  return "low";
}
