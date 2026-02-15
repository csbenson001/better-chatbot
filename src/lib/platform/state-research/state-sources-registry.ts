type StateSourceSeed = {
  state: string;
  name: string;
  sourceType: string;
  agencyName: string;
  url: string;
  searchUrl?: string;
  apiEndpoint?: string;
  dataFormat: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
};

export const STATE_REGULATORY_SOURCES: StateSourceSeed[] = [
  // ─── TEXAS ──────────────────────────────────────────────────────────────────
  {
    state: "TX",
    name: "Railroad Commission of Texas - Oil & Gas",
    sourceType: "oil-gas-commission",
    agencyName: "Railroad Commission of Texas",
    url: "https://www.rrc.state.tx.us/",
    searchUrl: "https://www.rrc.state.tx.us/oil-and-gas/",
    dataFormat: "html",
    capabilities: [
      "well-permits",
      "production-data",
      "operator-lookup",
      "enforcement-actions",
      "drilling-permits",
      "completion-reports",
    ],
    metadata: {
      description:
        "Primary oil and gas regulator in Texas. Handles well permits, production reporting, and operator compliance.",
      dataTypes: [
        "well permits",
        "production reports",
        "operator info",
        "violation records",
        "pipeline permits",
      ],
      apiAvailable: true,
      publicDataPortal:
        "https://www.rrc.state.tx.us/resource-center/research/data-sets-available-for-download/",
    },
  },
  {
    state: "TX",
    name: "RRC Enforcement Actions & Master Agreed Orders",
    sourceType: "enforcement-actions",
    agencyName: "Railroad Commission of Texas",
    url: "https://www.rrc.texas.gov/general-counsel/enforcement-actions-master-agreed-orders/",
    dataFormat: "html",
    capabilities: [
      "enforcement-orders",
      "penalties",
      "violations",
      "compliance-actions",
    ],
    metadata: {
      description:
        "Enforcement actions, penalties, and agreed orders against operators. Key source for finding companies with compliance issues that may need services.",
      signalTypes: ["violations", "penalties", "agreed-orders", "cease-desist"],
    },
  },
  {
    state: "TX",
    name: "TCEQ - Texas Commission on Environmental Quality",
    sourceType: "environmental-agency",
    agencyName: "TCEQ",
    url: "https://www.tceq.texas.gov/",
    searchUrl: "https://www.tceq.texas.gov/compliance/enforcement",
    dataFormat: "html",
    capabilities: [
      "air-permits",
      "enforcement",
      "emissions-inventory",
      "compliance-monitoring",
      "water-permits",
    ],
    metadata: {
      description:
        "Texas environmental regulator. Handles air quality permits, emissions, water quality, and waste management.",
      programs: ["Clean Air Act", "Clean Water Act", "RCRA", "Title V"],
    },
  },

  // ─── COLORADO ────────────────────────────────────────────────────────────────
  {
    state: "CO",
    name: "Colorado Energy & Carbon Management Commission",
    sourceType: "oil-gas-commission",
    agencyName: "ECMC",
    url: "https://ecmc.colorado.gov/data-maps-reports",
    dataFormat: "html",
    capabilities: [
      "well-data",
      "production-reports",
      "operator-info",
      "permits",
      "inspections",
      "violations",
    ],
    metadata: {
      description:
        "Colorado's oil and gas regulator. Provides well data, production reports, and compliance information.",
      publicDataPortal: "https://ecmc.colorado.gov/data-maps-reports",
    },
  },
  {
    state: "CO",
    name: "Colorado DNR - COGCC Public Access",
    sourceType: "permits-registry",
    agencyName: "Colorado Department of Natural Resources",
    url: "https://oitco.hylandcloud.com/DNRCOGPublicAccess/index.html",
    dataFormat: "html",
    capabilities: [
      "permit-documents",
      "well-files",
      "regulatory-documents",
      "hearing-orders",
    ],
    metadata: {
      description:
        "Public access to Colorado DNR/COGCC documents including permits, well files, and regulatory orders.",
    },
  },
  {
    state: "CO",
    name: "Colorado Secretary of State - Regulatory Register",
    sourceType: "general-regulatory",
    agencyName: "Colorado Secretary of State",
    url: "https://www.coloradosos.gov/CCR/RegisterContents.do",
    dataFormat: "html",
    capabilities: ["regulatory-changes", "new-rules", "proposed-regulations"],
    metadata: {
      description:
        "Colorado Code of Regulations register. Track new environmental and oil & gas regulations.",
    },
  },

  // ─── WYOMING ─────────────────────────────────────────────────────────────────
  {
    state: "WY",
    name: "Wyoming DEQ - Air Quality IMPACT & Open Air",
    sourceType: "air-quality",
    agencyName: "Wyoming Department of Environmental Quality",
    url: "https://deq.wyoming.gov/aqd/impact-and-open-air/",
    dataFormat: "html",
    capabilities: [
      "air-permits",
      "emissions-inventory",
      "monitoring-data",
      "compliance-reports",
    ],
    metadata: {
      description:
        "Wyoming air quality division. IMPACT system for emissions inventory and Open Air for ambient monitoring.",
      programs: ["IMPACT", "Open Air"],
    },
  },

  // ─── KANSAS ──────────────────────────────────────────────────────────────────
  {
    state: "KS",
    name: "Kansas Corporation Commission - Oil & Gas",
    sourceType: "oil-gas-commission",
    agencyName: "Kansas Corporation Commission",
    url: "https://www.kcc.ks.gov/oil-gas",
    dataFormat: "html",
    capabilities: [
      "well-permits",
      "production-data",
      "operator-lookup",
      "enforcement",
    ],
    metadata: {
      description: "Kansas oil and gas regulatory agency.",
    },
  },

  // ─── UTAH ────────────────────────────────────────────────────────────────────
  {
    state: "UT",
    name: "Utah Division of Oil, Gas and Mining",
    sourceType: "oil-gas-commission",
    agencyName: "Utah DOGM",
    url: "https://ogm.utah.gov/og-home",
    dataFormat: "html",
    capabilities: [
      "well-permits",
      "production-data",
      "operator-info",
      "enforcement",
    ],
    metadata: {
      description:
        "Utah oil and gas regulator. Well permits, production data, and operator compliance.",
    },
  },

  // ─── CALIFORNIA ──────────────────────────────────────────────────────────────
  {
    state: "CA",
    name: "California Geologic Energy Management Division - Permits",
    sourceType: "permits-registry",
    agencyName: "CalGEM",
    url: "https://www.conservation.ca.gov/calgem/Pages/permits.aspx",
    dataFormat: "html",
    capabilities: [
      "well-permits",
      "drilling-permits",
      "rework-permits",
      "plugging-permits",
    ],
    metadata: {
      description:
        "California oil and gas permitting. CalGEM manages all well-related permits.",
      strictRegulations: true,
    },
  },

  // ─── NEW MEXICO ──────────────────────────────────────────────────────────────
  {
    state: "NM",
    name: "New Mexico Oil Conservation Division - Compliance",
    sourceType: "compliance-monitoring",
    agencyName: "New Mexico OCD",
    url: "https://www.emnrd.nm.gov/ocd/compliance/",
    dataFormat: "html",
    capabilities: [
      "compliance-monitoring",
      "enforcement-actions",
      "inspection-reports",
      "violation-notices",
    ],
    metadata: {
      description:
        "New Mexico oil and gas compliance monitoring. Enforcement actions, inspections, and violations.",
      methaneRules: "NM has strict methane emission regulations",
    },
  },

  // ─── FEDERAL - EPA ───────────────────────────────────────────────────────────
  {
    state: "US",
    name: "EPA ECHO - Enforcement & Compliance History",
    sourceType: "environmental-agency",
    agencyName: "US EPA",
    url: "https://echo.epa.gov/",
    searchUrl: "https://echo.epa.gov/facilities/facility-search",
    apiEndpoint:
      "https://echodata.epa.gov/echo/echo_rest_services.get_facilities",
    dataFormat: "api",
    capabilities: [
      "facility-search",
      "compliance-history",
      "enforcement-actions",
      "inspections",
      "violations",
      "emissions-data",
    ],
    metadata: {
      description:
        "Federal EPA enforcement and compliance database. Covers all regulated facilities nationwide.",
      programs: [
        "Clean Air Act",
        "Clean Water Act",
        "RCRA",
        "SDWA",
        "TSCA",
        "EPCRA",
      ],
      apiDocs: "https://echo.epa.gov/tools/web-services",
    },
  },
  {
    state: "US",
    name: "EPA GHGRP - Greenhouse Gas Reporting Program",
    sourceType: "emissions-inventory",
    agencyName: "US EPA",
    url: "https://www.epa.gov/ghgreporting",
    searchUrl: "https://ghgdata.epa.gov/ghgp/main.do",
    dataFormat: "html",
    capabilities: [
      "ghg-emissions",
      "facility-reports",
      "methane-emissions",
      "co2-emissions",
    ],
    metadata: {
      description:
        "Greenhouse gas reporting data. Critical for methane monitoring and emissions tracking.",
      relevance:
        "Direct relevance to Alliance Technical Group's methane emissions testing services",
    },
  },
  {
    state: "US",
    name: "EPA OGI & LDAR - Methane Detection",
    sourceType: "emissions-inventory",
    agencyName: "US EPA",
    url: "https://www.epa.gov/controlling-air-pollution-oil-and-natural-gas-industry",
    dataFormat: "html",
    capabilities: [
      "methane-rules",
      "ogi-requirements",
      "ldar-requirements",
      "quad-oa-rules",
    ],
    metadata: {
      description:
        "EPA regulations for methane detection in oil & gas. OGI (Optical Gas Imaging) and LDAR (Leak Detection and Repair) requirements.",
      relevance:
        "Core regulatory driver for Alliance Technical Group's services",
      recentChanges:
        "EPA Quad Oa rules significantly expanded methane monitoring requirements",
    },
  },
];

export function getSourcesForState(state: string): StateSourceSeed[] {
  return STATE_REGULATORY_SOURCES.filter(
    (s) => s.state === state || s.state === "US",
  );
}

export function getAllStates(): string[] {
  const states = new Set(
    STATE_REGULATORY_SOURCES.map((s) => s.state).filter((s) => s !== "US"),
  );
  return [...states].sort();
}

export function getSourcesByType(sourceType: string): StateSourceSeed[] {
  return STATE_REGULATORY_SOURCES.filter((s) => s.sourceType === sourceType);
}
