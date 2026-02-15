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

type KnowledgeDocument = {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  categoryId: string | null;
  documentType: string;
  status: string;
  tags: string[];
  sourceUrl: string | null;
  metadata: Record<string, unknown>;
  processedAt: string | null;
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

const STATUS_COLORS: Record<string, string> = {
  indexed: "bg-green-100 text-green-800",
  processing: "bg-yellow-100 text-yellow-800",
  pending: "bg-gray-100 text-gray-800",
  failed: "bg-red-100 text-red-800",
};

const DOCUMENT_TYPES = [
  "pdf",
  "text",
  "markdown",
  "html",
  "csv",
  "json",
  "other",
] as const;

export default function AdminKnowledgePage() {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDocumentType, setFormDocumentType] = useState<string>("text");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // Stats
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    indexed: 0,
    processing: 0,
    pending: 0,
    failed: 0,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/knowledge/categories");
      const json = await res.json();
      setCategories(json.data ?? []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);

      const res = await fetch(
        `/api/platform/knowledge/documents?${params.toString()}`,
      );
      const json = await res.json();
      const docs: KnowledgeDocument[] = json.data ?? [];
      setDocuments(docs);
      setTotalDocs(json.total ?? docs.length);

      // Compute status counts
      const counts: Record<string, number> = {
        indexed: 0,
        processing: 0,
        pending: 0,
        failed: 0,
      };
      for (const doc of docs) {
        if (counts[doc.status] !== undefined) {
          counts[doc.status]++;
        }
      }
      setStatusCounts(counts);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch("/api/platform/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
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

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/platform/knowledge/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          categoryId: formCategoryId || undefined,
          documentType: formDocumentType,
        }),
      });
      if (res.ok) {
        setShowAddForm(false);
        setFormTitle("");
        setFormContent("");
        setFormCategoryId("");
        setFormDocumentType("text");
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to add document:", error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/platform/knowledge/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription || undefined,
        }),
      });
      if (res.ok) {
        setShowAddCategory(false);
        setCategoryName("");
        setCategoryDescription("");
        fetchCategories();
      }
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/platform/knowledge/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading knowledge base...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Knowledge Base Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage documents, categories, and vector search
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add Category
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Document
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Total Documents</div>
            <div className="text-2xl font-bold text-gray-900">{totalDocs}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Indexed</div>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.indexed}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Processing</div>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.processing}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-gray-600">
              {statusCounts.pending}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Failed</div>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.failed}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search knowledge base with semantic search..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.chunkId}
                  className="bg-white rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {result.documentTitle}
                    </h3>
                    <span className="text-sm text-blue-600 font-medium">
                      Score: {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Category Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Categories
              </h2>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedCategoryId === null
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Documents
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        selectedCategoryId === cat.id
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b">
                <h2 className="text-sm font-semibold text-gray-900">
                  Documents
                </h2>
              </div>
              {documents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No documents found. Click &quot;Add Document&quot; to get
                  started.
                </div>
              ) : (
                <div className="divide-y">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.title}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[doc.status] ?? "bg-gray-100 text-gray-800"}`}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="uppercase">{doc.documentType}</span>
                          <span>
                            Created{" "}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="ml-4 text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Document Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Document
              </h2>
            </div>
            <form onSubmit={handleAddDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Document title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste or type document content..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={formDocumentType}
                    onChange={(e) => setFormDocumentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? "Adding..." : "Add Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Category
              </h2>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
