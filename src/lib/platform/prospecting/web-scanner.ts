// ============================================================================
// TYPES
// ============================================================================

export type WebScanTarget = {
  url: string;
  name: string;
  type:
    | "business-registry"
    | "trade-directory"
    | "industry-association"
    | "government-database"
    | "news-source";
  selectors?: Record<string, string>; // CSS selectors for data extraction
  apiConfig?: {
    endpoint: string;
    method: "GET" | "POST";
    headers?: Record<string, string>;
    queryTemplate?: Record<string, string>;
  };
};

export type WebScanResult = {
  companyName: string;
  website?: string;
  industry?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  contactInfo?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  metadata: Record<string, unknown>;
  sourceUrl: string;
  confidence: number;
};

export type WebScanOptions = {
  limit?: number;
  keywords?: string[];
};

// ============================================================================
// MAIN SCANNER
// ============================================================================

export async function scanWebSource(
  target: WebScanTarget,
  options: WebScanOptions = {},
): Promise<WebScanResult[]> {
  if (target.apiConfig) {
    return scanApiSource(target, options);
  }

  return scanHtmlSource(target, options);
}

// ============================================================================
// API SOURCE SCANNER
// ============================================================================

async function scanApiSource(
  target: WebScanTarget,
  options: WebScanOptions,
): Promise<WebScanResult[]> {
  const config = target.apiConfig;
  if (!config) return [];

  const limit = options.limit ?? 50;

  // Build the request URL with query parameters
  let url = config.endpoint;
  if (config.queryTemplate) {
    const params = new URLSearchParams();
    for (const [key, template] of Object.entries(config.queryTemplate)) {
      let value = template;

      // Replace template placeholders
      if (options.keywords && options.keywords.length > 0) {
        value = value.replace("{keywords}", options.keywords.join(","));
        value = value.replace("{keyword}", options.keywords[0]);
      }
      value = value.replace("{limit}", String(limit));

      params.set(key, value);
    }
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}${params.toString()}`;
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...config.headers,
  };

  try {
    const response = await fetch(url, {
      method: config.method,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as unknown;
    const records = extractRecordsFromApiResponse(data);
    const results: WebScanResult[] = [];

    for (const record of records.slice(0, limit)) {
      const rawRecord =
        typeof record === "object" && record !== null
          ? (record as Record<string, unknown>)
          : {};
      const normalized = normalizeWebResult(rawRecord, target);
      if (normalized.companyName) {
        results.push(normalized);
      }
    }

    return results;
  } catch (err) {
    throw new Error(
      `Failed to scan API source "${target.name}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ============================================================================
// HTML SOURCE SCANNER (Framework/Placeholder)
// ============================================================================

async function scanHtmlSource(
  target: WebScanTarget,
  options: WebScanOptions,
): Promise<WebScanResult[]> {
  // NOTE: Full HTML scraping would require a library like cheerio or puppeteer.
  // This implementation fetches the HTML and performs basic text-based extraction
  // using the provided selectors as hints. For production use, integrate a proper
  // DOM parsing library.

  const limit = options.limit ?? 50;

  try {
    const response = await fetch(target.url, {
      headers: {
        Accept: "text/html",
        "User-Agent":
          "Mozilla/5.0 (compatible; SalesHunterBot/1.0; +https://saleshunter.io/bot)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const results = extractFromHtml(html, target, options);

    return results.slice(0, limit);
  } catch (err) {
    throw new Error(
      `Failed to scan HTML source "${target.name}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Basic HTML text extraction. This is intentionally simplistic -- for production
 * use, replace with cheerio or a similar DOM parser. The selectors in the target
 * config serve as documentation of the page structure for when a real parser is
 * integrated.
 */
function extractFromHtml(
  html: string,
  target: WebScanTarget,
  options: WebScanOptions,
): WebScanResult[] {
  const results: WebScanResult[] = [];

  // Basic regex-based extraction of structured data patterns
  // Look for common company listing patterns in HTML

  // Try JSON-LD structured data first (most reliable)
  const jsonLdResults = extractJsonLd(html, target);
  results.push(...jsonLdResults);

  // Try microdata / schema.org patterns
  const microdataResults = extractMicrodata(html, target);
  results.push(...microdataResults);

  // Filter by keywords if provided
  if (options.keywords && options.keywords.length > 0) {
    const keywordsLower = options.keywords.map((k) => k.toLowerCase());
    return results.filter((r) => {
      const text = [
        r.companyName,
        r.industry,
        r.location?.city,
        r.location?.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return keywordsLower.some((kw) => text.includes(kw));
    });
  }

  return results;
}

function extractJsonLd(html: string, target: WebScanTarget): WebScanResult[] {
  const results: WebScanResult[] = [];
  const jsonLdPattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]) as Record<string, unknown>;
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const obj = item as Record<string, unknown>;
        if (
          obj["@type"] === "Organization" ||
          obj["@type"] === "LocalBusiness" ||
          obj["@type"] === "Corporation"
        ) {
          const address = obj.address as Record<string, unknown> | undefined;
          results.push({
            companyName: String(obj.name ?? ""),
            website: obj.url ? String(obj.url) : undefined,
            industry: obj.industry ? String(obj.industry) : undefined,
            location: address
              ? {
                  city: address.addressLocality
                    ? String(address.addressLocality)
                    : undefined,
                  state: address.addressRegion
                    ? String(address.addressRegion)
                    : undefined,
                  country: address.addressCountry
                    ? String(address.addressCountry)
                    : undefined,
                }
              : undefined,
            contactInfo: extractContactFromJsonLd(obj),
            metadata: { structuredDataType: obj["@type"] },
            sourceUrl: target.url,
            confidence: 0.85,
          });
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return results;
}

function extractContactFromJsonLd(
  obj: Record<string, unknown>,
): WebScanResult["contactInfo"] | undefined {
  const contactPoint = obj.contactPoint as Record<string, unknown> | undefined;
  if (!contactPoint) return undefined;

  return {
    name: contactPoint.name ? String(contactPoint.name) : undefined,
    title: contactPoint.contactType
      ? String(contactPoint.contactType)
      : undefined,
    email: contactPoint.email ? String(contactPoint.email) : undefined,
    phone: contactPoint.telephone ? String(contactPoint.telephone) : undefined,
  };
}

function extractMicrodata(
  html: string,
  target: WebScanTarget,
): WebScanResult[] {
  const results: WebScanResult[] = [];

  // Look for itemscope itemtype="http://schema.org/Organization" patterns
  const orgPattern =
    /itemscope[^>]*itemtype=["']https?:\/\/schema\.org\/(Organization|LocalBusiness|Corporation)["']/gi;
  const orgMatches = html.match(orgPattern);

  if (!orgMatches) return results;

  // For each organization block, try to extract itemprop values
  // This is necessarily limited without a DOM parser
  const namePattern = /itemprop=["']name["'][^>]*>([^<]+)</gi;
  const allNames: string[] = [];

  let nameMatch;
  while ((nameMatch = namePattern.exec(html)) !== null) {
    const name = nameMatch[1].trim();
    if (name && name.length > 1 && name.length < 200) {
      allNames.push(name);
    }
  }

  // Deduplicate and create results
  const uniqueNames = [...new Set(allNames)];
  for (const name of uniqueNames) {
    results.push({
      companyName: name,
      metadata: { extractionMethod: "microdata" },
      sourceUrl: target.url,
      confidence: 0.6,
    });
  }

  return results;
}

// ============================================================================
// RESULT NORMALIZER
// ============================================================================

export function normalizeWebResult(
  raw: Record<string, unknown>,
  source: WebScanTarget,
): WebScanResult {
  // Try common field name patterns for company name
  const companyName = String(
    raw.companyName ??
      raw.company_name ??
      raw.name ??
      raw.organizationName ??
      raw.organization_name ??
      raw.businessName ??
      raw.business_name ??
      raw.Name ??
      raw.CompanyName ??
      "",
  ).trim();

  // Try common field name patterns for website
  const website =
    extractStringField(raw, [
      "website",
      "url",
      "webAddress",
      "web_address",
      "homepage",
      "Website",
      "URL",
    ]) || undefined;

  // Try common field name patterns for industry
  const industry =
    extractStringField(raw, [
      "industry",
      "sector",
      "category",
      "businessType",
      "business_type",
      "Industry",
      "Sector",
      "naicsDescription",
      "sicDescription",
    ]) || undefined;

  // Build location from various field patterns
  const location = extractLocation(raw);

  // Build contact info from various field patterns
  const contactInfo = extractContactInfo(raw);

  // Calculate confidence based on how much data we extracted
  let confidence = 0.3;
  if (companyName) confidence += 0.2;
  if (website) confidence += 0.15;
  if (industry) confidence += 0.1;
  if (location && (location.city || location.state)) confidence += 0.1;
  if (contactInfo && (contactInfo.email || contactInfo.name))
    confidence += 0.15;

  // Assemble remaining fields as metadata
  const knownFields = new Set([
    "companyName",
    "company_name",
    "name",
    "organizationName",
    "organization_name",
    "businessName",
    "business_name",
    "Name",
    "CompanyName",
    "website",
    "url",
    "webAddress",
    "web_address",
    "homepage",
    "Website",
    "URL",
    "industry",
    "sector",
    "category",
    "businessType",
    "business_type",
    "Industry",
    "Sector",
    "city",
    "state",
    "country",
    "zip",
    "address",
    "City",
    "State",
    "Country",
    "contactName",
    "contact_name",
    "email",
    "phone",
    "title",
  ]);

  const metadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!knownFields.has(key) && value != null) {
      metadata[key] = value;
    }
  }
  metadata.sourceType = source.type;
  metadata.sourceName = source.name;

  return {
    companyName,
    website,
    industry,
    location,
    contactInfo,
    metadata,
    sourceUrl: source.url,
    confidence: Math.min(1, confidence),
  };
}

// ============================================================================
// FIELD EXTRACTION HELPERS
// ============================================================================

function extractStringField(
  raw: Record<string, unknown>,
  fieldNames: string[],
): string | null {
  for (const field of fieldNames) {
    const value = raw[field];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function extractLocation(
  raw: Record<string, unknown>,
): WebScanResult["location"] | undefined {
  const city = extractStringField(raw, [
    "city",
    "City",
    "cityName",
    "city_name",
    "locality",
  ]);
  const state = extractStringField(raw, [
    "state",
    "State",
    "stateCode",
    "state_code",
    "region",
    "province",
    "StateCode",
  ]);
  const country = extractStringField(raw, [
    "country",
    "Country",
    "countryCode",
    "country_code",
    "nation",
    "CountryCode",
  ]);

  // Also check for nested location/address objects
  const locationObj = raw.location ?? raw.address ?? raw.Address;
  if (typeof locationObj === "object" && locationObj !== null) {
    const loc = locationObj as Record<string, unknown>;
    const nestedCity =
      city ?? extractStringField(loc, ["city", "City", "locality"]);
    const nestedState =
      state ?? extractStringField(loc, ["state", "State", "region"]);
    const nestedCountry =
      country ?? extractStringField(loc, ["country", "Country"]);

    if (nestedCity || nestedState || nestedCountry) {
      return {
        city: nestedCity ?? undefined,
        state: nestedState ?? undefined,
        country: nestedCountry ?? undefined,
      };
    }
  }

  if (city || state || country) {
    return {
      city: city ?? undefined,
      state: state ?? undefined,
      country: country ?? undefined,
    };
  }

  return undefined;
}

function extractContactInfo(
  raw: Record<string, unknown>,
): WebScanResult["contactInfo"] | undefined {
  const name = extractStringField(raw, [
    "contactName",
    "contact_name",
    "ContactName",
    "personName",
    "person_name",
    "ownerName",
    "owner_name",
  ]);
  const title = extractStringField(raw, [
    "contactTitle",
    "contact_title",
    "title",
    "jobTitle",
    "job_title",
    "position",
    "Title",
  ]);
  const email = extractStringField(raw, [
    "email",
    "Email",
    "contactEmail",
    "contact_email",
    "emailAddress",
    "email_address",
  ]);
  const phone = extractStringField(raw, [
    "phone",
    "Phone",
    "contactPhone",
    "contact_phone",
    "telephone",
    "phoneNumber",
    "phone_number",
  ]);

  // Also check for nested contact objects
  const contactObj = raw.contact ?? raw.Contact ?? raw.contactInfo;
  if (typeof contactObj === "object" && contactObj !== null) {
    const c = contactObj as Record<string, unknown>;
    const nestedName =
      name ?? extractStringField(c, ["name", "Name", "fullName"]);
    const nestedTitle =
      title ?? extractStringField(c, ["title", "Title", "jobTitle"]);
    const nestedEmail = email ?? extractStringField(c, ["email", "Email"]);
    const nestedPhone =
      phone ?? extractStringField(c, ["phone", "Phone", "telephone"]);

    if (nestedName || nestedTitle || nestedEmail || nestedPhone) {
      return {
        name: nestedName ?? undefined,
        title: nestedTitle ?? undefined,
        email: nestedEmail ?? undefined,
        phone: nestedPhone ?? undefined,
      };
    }
  }

  if (name || title || email || phone) {
    return {
      name: name ?? undefined,
      title: title ?? undefined,
      email: email ?? undefined,
      phone: phone ?? undefined,
    };
  }

  return undefined;
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

function extractRecordsFromApiResponse(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    // Common API response patterns for nested arrays
    const arrayKeys = [
      "results",
      "data",
      "records",
      "items",
      "businesses",
      "companies",
      "organizations",
      "entries",
      "hits",
      "Results",
      "Data",
      "Records",
      "Items",
    ];

    for (const key of arrayKeys) {
      if (Array.isArray(obj[key])) {
        return obj[key] as unknown[];
      }
    }

    // Check one level deeper (e.g., { response: { results: [...] } })
    const wrapperKeys = ["response", "Response", "body", "payload"];
    for (const wrapperKey of wrapperKeys) {
      if (typeof obj[wrapperKey] === "object" && obj[wrapperKey] !== null) {
        const nested = obj[wrapperKey] as Record<string, unknown>;
        for (const key of arrayKeys) {
          if (Array.isArray(nested[key])) {
            return nested[key] as unknown[];
          }
        }
      }
    }
  }

  return [];
}
