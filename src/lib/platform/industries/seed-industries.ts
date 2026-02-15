import type { Industry } from "app-types/industry";

type IndustrySeed = Omit<Industry, "id" | "createdAt" | "updatedAt">;

export const SEED_INDUSTRIES: IndustrySeed[] = [
  {
    name: "Chemicals & Chemical Distribution",
    slug: "chemicals",
    parentId: null,
    description:
      "Manufacturing, distribution, and sale of commodity and specialty chemicals. Includes chemical distributors like Nexeo Plastics, Univar Solutions, Innophos, and specialty chemical manufacturers.",
    naicsCodes: [
      "3251",
      "3252",
      "3253",
      "3254",
      "3255",
      "3256",
      "3259",
      "4246",
    ],
    sicCodes: [
      "2800",
      "2810",
      "2820",
      "2830",
      "2840",
      "2860",
      "2890",
      "5160",
      "5169",
    ],
    keywords: [
      "chemical distribution",
      "specialty chemicals",
      "commodity chemicals",
      "polymers",
      "plastics",
      "resins",
      "solvents",
      "additives",
      "coatings",
      "adhesives",
      "surfactants",
      "catalysts",
      "pharmaceutical intermediates",
      "agrochemicals",
      "petrochemicals",
      "industrial chemicals",
      "chemical supply chain",
      "Nexeo Plastics",
      "Univar Solutions",
      "Innophos",
      "Brenntag",
      "IMCD",
    ],
    valueChainTemplate: [
      {
        stage: "raw-materials",
        name: "Raw Material Sourcing",
        description:
          "Procurement of feedstocks, base chemicals, and raw materials from producers",
        typicalPlayers: ["BASF", "Dow", "SABIC", "ExxonMobil Chemical"],
      },
      {
        stage: "manufacturing",
        name: "Chemical Manufacturing",
        description:
          "Production of specialty and commodity chemicals through various processes",
        typicalPlayers: ["Eastman", "Celanese", "Huntsman", "Evonik"],
      },
      {
        stage: "processing",
        name: "Blending & Formulation",
        description:
          "Custom blending, formulation, and repackaging of chemical products",
        typicalPlayers: ["Univar Solutions", "Nexeo Plastics", "Brenntag"],
      },
      {
        stage: "distribution",
        name: "Chemical Distribution",
        description:
          "Warehousing, logistics, and distribution to end customers",
        typicalPlayers: ["Univar Solutions", "Brenntag", "IMCD", "Azelis"],
      },
      {
        stage: "end-user",
        name: "End-User Applications",
        description:
          "Final consumption in manufacturing, construction, agriculture, automotive",
        typicalPlayers: [
          "Automotive OEMs",
          "Construction companies",
          "Food manufacturers",
        ],
      },
      {
        stage: "regulatory",
        name: "Regulatory Compliance",
        description:
          "REACH, TSCA, GHS compliance, SDS management, environmental reporting",
        typicalPlayers: ["EPA", "ECHA", "OSHA"],
      },
    ],
    regulatoryBodies: ["EPA", "OSHA", "DOT", "ECHA (EU)", "TSCA", "REACH"],
    dataSources: [
      {
        name: "EPA ECHO",
        url: "https://echo.epa.gov",
        type: "regulatory",
        description: "Enforcement and compliance history",
      },
      {
        name: "EPA TRI",
        url: "https://www.epa.gov/toxics-release-inventory-tri-program",
        type: "regulatory",
        description: "Toxic release inventory",
      },
      {
        name: "ICIS",
        url: "https://www.icis.com",
        type: "market-data",
        description: "Chemical market intelligence and pricing",
      },
      {
        name: "American Chemistry Council",
        url: "https://www.americanchemistry.com",
        type: "trade-association",
        description: "Industry advocacy and data",
      },
    ],
    metadata: {
      globalMarketSize: "$5.7 trillion (2024)",
      growthRate: "3-5% CAGR",
      keyTrends: [
        "sustainability",
        "digital transformation",
        "supply chain resilience",
        "specialty over commodity",
      ],
    },
  },
  {
    name: "Oil & Gas",
    slug: "oil-gas",
    parentId: null,
    description:
      "Exploration, production, refining, and distribution of oil and natural gas products. Includes upstream, midstream, and downstream operations.",
    naicsCodes: ["2111", "2112", "3241", "4861", "4862", "4869"],
    sicCodes: ["1311", "1381", "1382", "2911", "4612", "4613", "4619", "5171"],
    keywords: [
      "upstream",
      "midstream",
      "downstream",
      "exploration",
      "production",
      "refining",
      "petrochemicals",
      "natural gas",
      "LNG",
      "pipelines",
      "oilfield services",
      "drilling",
      "well services",
      "completions",
      "reservoir engineering",
      "E&P",
      "NOC",
      "IOC",
    ],
    valueChainTemplate: [
      {
        stage: "raw-materials",
        name: "Exploration & Production",
        description:
          "Finding and extracting oil and natural gas from reservoirs",
        typicalPlayers: [
          "ExxonMobil",
          "Chevron",
          "ConocoPhillips",
          "Pioneer Natural Resources",
        ],
      },
      {
        stage: "processing",
        name: "Refining & Processing",
        description:
          "Converting crude oil and natural gas into usable products",
        typicalPlayers: ["Valero", "Phillips 66", "Marathon Petroleum"],
      },
      {
        stage: "distribution",
        name: "Transportation & Storage",
        description: "Pipeline, rail, truck, and marine transport of products",
        typicalPlayers: [
          "Enterprise Products",
          "Kinder Morgan",
          "Plains All American",
        ],
      },
      {
        stage: "wholesale",
        name: "Marketing & Trading",
        description: "Wholesale marketing and trading of refined products",
        typicalPlayers: ["Vitol", "Trafigura", "Glencore"],
      },
      {
        stage: "retail",
        name: "Retail Distribution",
        description:
          "End-consumer distribution through gas stations and distributors",
        typicalPlayers: ["Shell", "BP", "ExxonMobil"],
      },
      {
        stage: "support-services",
        name: "Oilfield Services",
        description: "Drilling, completion, production services, and equipment",
        typicalPlayers: ["Schlumberger", "Halliburton", "Baker Hughes"],
      },
    ],
    regulatoryBodies: [
      "EPA",
      "BLM",
      "FERC",
      "Railroad Commission of Texas",
      "PHMSA",
      "BSEE",
    ],
    dataSources: [
      {
        name: "EIA",
        url: "https://www.eia.gov",
        type: "market-data",
        description: "US Energy Information Administration",
      },
      {
        name: "Railroad Commission of Texas",
        url: "https://www.rrc.texas.gov",
        type: "regulatory",
        description: "Texas oil and gas regulator",
      },
      {
        name: "BSEE",
        url: "https://www.bsee.gov",
        type: "regulatory",
        description: "Bureau of Safety and Environmental Enforcement",
      },
    ],
    metadata: {
      globalMarketSize: "$4.2 trillion (2024)",
      keyTrends: [
        "energy transition",
        "carbon capture",
        "methane reduction",
        "digital oilfield",
      ],
    },
  },
  {
    name: "Environmental & Regulatory Services",
    slug: "environmental-regulatory",
    parentId: null,
    description:
      "Environmental consulting, regulatory compliance, emissions monitoring, and EPA reporting services. Companies like Alliance Technical Group (alliancetg.com) that help industrial facilities comply with environmental regulations.",
    naicsCodes: ["5416", "5417", "5621", "5622", "5629"],
    sicCodes: ["8711", "8712", "8742", "8999", "4959"],
    keywords: [
      "environmental consulting",
      "EPA compliance",
      "emissions monitoring",
      "CEMS",
      "stack testing",
      "air quality",
      "environmental permitting",
      "MACT",
      "NSPS",
      "Title V",
      "Clean Air Act",
      "Clean Water Act",
      "hazardous waste",
      "remediation",
      "environmental assessment",
      "Alliance Technical Group",
      "alliancetg.com",
      "continuous emissions monitoring",
      "source testing",
      "environmental regulatory compliance",
    ],
    valueChainTemplate: [
      {
        stage: "regulatory",
        name: "Regulatory Analysis",
        description:
          "Identifying applicable regulations, permits, and compliance requirements",
        typicalPlayers: [
          "Alliance Technical Group",
          "Trinity Consultants",
          "ERM",
        ],
      },
      {
        stage: "support-services",
        name: "Monitoring & Testing",
        description:
          "Stack testing, CEMS, ambient monitoring, and emissions quantification",
        typicalPlayers: [
          "Alliance Technical Group",
          "Montrose Environmental",
          "GHD",
        ],
      },
      {
        stage: "processing",
        name: "Data Analysis & Reporting",
        description:
          "Environmental data management, analysis, and regulatory report preparation",
        typicalPlayers: ["Encamp", "Intelex", "Cority"],
      },
      {
        stage: "distribution",
        name: "Compliance Filing",
        description:
          "Submission of reports to EPA, state agencies, and local authorities",
        typicalPlayers: ["EPA CEDRI", "State environmental agencies"],
      },
      {
        stage: "end-user",
        name: "Facility Operations",
        description: "Industrial facilities requiring environmental compliance",
        typicalPlayers: [
          "Refineries",
          "Chemical plants",
          "Power plants",
          "Manufacturing",
        ],
      },
    ],
    regulatoryBodies: [
      "EPA",
      "State Environmental Agencies",
      "TCEQ (Texas)",
      "LDEQ (Louisiana)",
      "ODEQ (Oklahoma)",
    ],
    dataSources: [
      {
        name: "EPA ECHO",
        url: "https://echo.epa.gov",
        type: "regulatory",
        description: "Enforcement and compliance history for facilities",
      },
      {
        name: "EPA ECHO Facility Search",
        url: "https://echo.epa.gov/facilities/facility-search",
        type: "leads",
        description:
          "Search for regulated facilities by location, program, and compliance status",
      },
      {
        name: "EPA TRI",
        url: "https://www.epa.gov/toxics-release-inventory-tri-program",
        type: "regulatory",
        description: "Toxic release inventory data",
      },
      {
        name: "EPA AirData",
        url: "https://www.epa.gov/outdoor-air-quality-data",
        type: "market-data",
        description: "Air quality monitoring data",
      },
      {
        name: "EPA CEDRI",
        url: "https://www.epa.gov/electronic-reporting-air-emissions/cedri",
        type: "regulatory",
        description: "Compliance and Emissions Data Reporting Interface",
      },
    ],
    metadata: {
      usMarketSize: "$45 billion (2024)",
      keyTrends: [
        "PFAS regulations",
        "methane monitoring",
        "environmental justice",
        "digital compliance",
      ],
      allianceTGFocus: [
        "emissions monitoring",
        "stack testing",
        "CEMS",
        "regulatory compliance",
        "EPA MACT/NSPS",
      ],
    },
  },
  {
    name: "Plastics & Polymers Distribution",
    slug: "plastics-polymers",
    parentId: null,
    description:
      "Distribution and sale of plastic resins, polymers, and engineered materials. Sub-segment of chemicals with companies like Nexeo Plastics focused specifically on polymer distribution.",
    naicsCodes: ["4246", "3261", "3252"],
    sicCodes: ["5162", "2821", "3089"],
    keywords: [
      "plastic resins",
      "polymers",
      "engineering plastics",
      "commodity plastics",
      "polyethylene",
      "polypropylene",
      "polystyrene",
      "nylon",
      "PET",
      "ABS",
      "polycarbonate",
      "PEEK",
      "HDPE",
      "LDPE",
      "injection molding",
      "extrusion",
      "blow molding",
      "compounding",
      "masterbatch",
      "Nexeo Plastics",
      "PolyOne",
      "Avient",
      "M Holland",
    ],
    valueChainTemplate: [
      {
        stage: "raw-materials",
        name: "Resin Production",
        description:
          "Manufacturing of base polymer resins from petrochemical feedstocks",
        typicalPlayers: [
          "Dow",
          "LyondellBasell",
          "SABIC",
          "ExxonMobil Chemical",
        ],
      },
      {
        stage: "processing",
        name: "Compounding & Modification",
        description:
          "Blending, coloring, and modifying resins for specific applications",
        typicalPlayers: ["Avient", "RTP Company", "Techmer PM"],
      },
      {
        stage: "distribution",
        name: "Resin Distribution",
        description:
          "Warehousing and distribution of resins to converters and molders",
        typicalPlayers: ["Nexeo Plastics", "M Holland", "Entec Polymers"],
      },
      {
        stage: "end-user",
        name: "Conversion & Molding",
        description:
          "Converting resins into finished products via injection molding, extrusion, etc.",
        typicalPlayers: ["Berry Global", "Amcor", "Sealed Air"],
      },
    ],
    regulatoryBodies: ["EPA", "FDA (food contact)", "EU Plastics Regulation"],
    dataSources: [
      {
        name: "Plastics Industry Association",
        url: "https://www.plasticsindustry.org",
        type: "trade-association",
        description: "Industry data and advocacy",
      },
      {
        name: "ICIS",
        url: "https://www.icis.com",
        type: "market-data",
        description: "Polymer pricing and market intelligence",
      },
    ],
    metadata: {
      globalMarketSize: "$600 billion (2024)",
      keyTrends: [
        "recycled content mandates",
        "bioplastics",
        "lightweighting",
        "circular economy",
      ],
    },
  },
];
