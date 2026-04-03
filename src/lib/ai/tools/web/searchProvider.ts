export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: Date;
  domain: string;
}

export interface SearchOptions {
  numResults?: number;
  freshness?: "day" | "week" | "month" | "year" | "any";
}

export interface SearchProvider {
  name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

// Extract domain from URL safely
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Mock provider for testing — returns deterministic results
export class MockSearchProvider implements SearchProvider {
  name = "mock";
  private results: SearchResult[];

  constructor(results: SearchResult[] = []) {
    this.results = results;
  }

  async search(
    _query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const limit = options.numResults ?? 5;
    return this.results.slice(0, limit);
  }
}
