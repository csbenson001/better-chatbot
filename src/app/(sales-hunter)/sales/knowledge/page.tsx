"use client";

import { useState, useEffect, useCallback } from "react";

type KnowledgeCategory = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type SearchResult = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
};

type DocumentPreview = {
  id: string;
  title: string;
  content: string;
  documentType: string;
  status: string;
  createdAt: string;
};

export default function SalesKnowledgePage() {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<DocumentPreview[]>([]);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/knowledge/categories");
      const json = await res.json();
      setCategories(json.data ?? []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const fetchRecentDocuments = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/platform/knowledge/documents?limit=10&status=indexed",
      );
      const json = await res.json();
      setRecentDocuments(json.data ?? []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchRecentDocuments();
  }, [fetchCategories, fetchRecentDocuments]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch("/api/platform/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          categoryIds:
            selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
          limit: 20,
        }),
      });
      const json = await res.json();
      setSearchResults(json.data ?? []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const toggleChunkExpanded = (chunkId: string) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) {
        next.delete(chunkId);
      } else {
        next.add(chunkId);
      }
      return next;
    });
  };

  const toggleDocExpanded = (docId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-700 bg-green-50";
    if (score >= 0.8) return "text-blue-700 bg-blue-50";
    if (score >= 0.7) return "text-yellow-700 bg-yellow-50";
    return "text-gray-700 bg-gray-50";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Knowledge Base
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Search our knowledge base to find relevant information for your
            sales conversations
          </p>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Ask a question or search for topics..."
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Category Filter Sidebar */}
          <div className="w-60 flex-shrink-0">
            <div className="bg-white rounded-lg border p-4 sticky top-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Filter by Category
              </h2>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400">No categories yet</p>
              ) : (
                <ul className="space-y-1">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => toggleCategoryFilter(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                          selectedCategoryIds.includes(cat.id)
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            selectedCategoryIds.includes(cat.id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedCategoryIds.includes(cat.id) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedCategoryIds.length > 0 && (
                <button
                  onClick={() => setSelectedCategoryIds([])}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Results */}
            {hasSearched && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {searchResults.length > 0
                    ? `${searchResults.length} results found`
                    : "No results found"}
                </h2>
                {searchResults.length === 0 && (
                  <div className="bg-white rounded-lg border p-8 text-center">
                    <p className="text-gray-500">
                      No matching content found. Try a different search query or
                      adjust your category filters.
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {searchResults.map((result) => {
                    const isExpanded = expandedChunks.has(result.chunkId);
                    return (
                      <div
                        key={result.chunkId}
                        className="bg-white rounded-lg border p-5 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {result.documentTitle}
                            </h3>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getScoreColor(result.score)}`}
                          >
                            {(result.score * 100).toFixed(1)}% match
                          </span>
                        </div>
                        <p
                          className={`text-sm text-gray-600 leading-relaxed ${
                            isExpanded ? "" : "line-clamp-3"
                          }`}
                        >
                          {result.content}
                        </p>
                        {result.content.length > 200 && (
                          <button
                            onClick={() => toggleChunkExpanded(result.chunkId)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Documents / Browse View */}
            {!hasSearched && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recently Indexed Documents
                </h2>
                {recentDocuments.length === 0 ? (
                  <div className="bg-white rounded-lg border p-8 text-center">
                    <p className="text-gray-500">
                      No documents available yet. Check back later or contact
                      your admin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDocuments.map((doc) => {
                      const isExpanded = expandedDocs.has(doc.id);
                      return (
                        <div
                          key={doc.id}
                          className="bg-white rounded-lg border p-5 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {doc.title}
                            </h3>
                            <span className="text-xs text-gray-400 uppercase ml-3 flex-shrink-0">
                              {doc.documentType}
                            </span>
                          </div>
                          <p
                            className={`text-sm text-gray-600 leading-relaxed ${
                              isExpanded ? "" : "line-clamp-3"
                            }`}
                          >
                            {doc.content}
                          </p>
                          {doc.content.length > 200 && (
                            <button
                              onClick={() => toggleDocExpanded(doc.id)}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {isExpanded ? "Show less" : "Read more"}
                            </button>
                          )}
                          <div className="mt-3 text-xs text-gray-400">
                            Added on{" "}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
