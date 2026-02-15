"use client";

import React, { useCallback, useEffect, useState } from "react";

interface Contact {
  id: string;
  name: string;
  title: string;
  role: string;
  influence: "high" | "medium" | "low";
  sentiment: "positive" | "neutral" | "negative";
}

interface Relationship {
  id: string;
  sourceContactId: string;
  targetContactId: string;
  type: string;
  strength: number;
}

interface RelationshipMap {
  id: string;
  companyName: string;
  companyId: string;
  contacts: Contact[];
  relationships: Relationship[];
  createdAt: string;
  updatedAt: string;
}

const INFLUENCE_COLORS: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-blue-500/20 text-blue-400",
};

const SENTIMENT_INDICATORS: Record<string, { label: string; color: string }> = {
  positive: { label: "+", color: "text-green-400" },
  neutral: { label: "~", color: "text-zinc-400" },
  negative: { label: "-", color: "text-red-400" },
};

export default function RelationshipsPage() {
  const [maps, setMaps] = useState<RelationshipMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [prospectId, setProspectId] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedMap, setExpandedMap] = useState<string | null>(null);

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales-hunter/intelligence/relationships");
      if (res.ok) {
        const data = await res.json();
        setMaps(data.maps ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch relationship maps:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!prospectId.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch(
        "/api/sales-hunter/intelligence/relationships/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prospectId }),
        },
      );
      if (res.ok) {
        setProspectId("");
        fetchMaps();
      }
    } catch (error) {
      console.error("Failed to analyze relationships:", error);
    } finally {
      setAnalyzing(false);
    }
  }

  function getContactName(map: RelationshipMap, contactId: string): string {
    return map.contacts.find((c) => c.id === contactId)?.name ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Relationship Mapping
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Map and analyze stakeholder relationships
          </p>
        </div>
      </div>

      {/* Analyze Form */}
      <form
        onSubmit={handleAnalyze}
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
      >
        <h3 className="text-sm font-semibold text-zinc-100 mb-3">
          Analyze Prospect Relationships
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={prospectId}
            onChange={(e) => setProspectId(e.target.value)}
            placeholder="Enter Prospect ID"
            required
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={analyzing}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </form>

      {/* Relationship Maps */}
      {loading ? (
        <div className="text-center text-zinc-400 py-8">Loading...</div>
      ) : maps.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">
          No relationship maps yet. Enter a Prospect ID above to analyze
          relationships.
        </div>
      ) : (
        <div className="space-y-4">
          {maps.map((map) => (
            <div
              key={map.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() =>
                  setExpandedMap(expandedMap === map.id ? null : map.id)
                }
              >
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {map.companyName}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {map.contacts.length} contact
                    {map.contacts.length !== 1 ? "s" : ""}
                    {" | "}
                    {map.relationships.length} relationship
                    {map.relationships.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">
                    Updated {new Date(map.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="text-zinc-400 text-sm">
                    {expandedMap === map.id ? "\u25B2" : "\u25BC"}
                  </span>
                </div>
              </div>

              {expandedMap === map.id && (
                <div className="border-t border-zinc-800 p-5">
                  {/* Contacts */}
                  <h4 className="text-xs font-medium text-zinc-400 mb-3">
                    Contacts
                  </h4>
                  <div className="space-y-2 mb-6">
                    {map.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between bg-zinc-800 rounded-md px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-lg font-bold ${SENTIMENT_INDICATORS[contact.sentiment]?.color ?? "text-zinc-400"}`}
                          >
                            {SENTIMENT_INDICATORS[contact.sentiment]?.label ??
                              "~"}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              {contact.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {contact.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500 capitalize">
                            {contact.role}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${INFLUENCE_COLORS[contact.influence] ?? ""}`}
                          >
                            {contact.influence}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Relationships */}
                  {map.relationships.length > 0 && (
                    <>
                      <h4 className="text-xs font-medium text-zinc-400 mb-3">
                        Relationships
                      </h4>
                      <div className="space-y-2">
                        {map.relationships.map((rel) => (
                          <div
                            key={rel.id}
                            className="flex items-center gap-3 bg-zinc-800 rounded-md px-4 py-2 text-sm"
                          >
                            <span className="text-zinc-100">
                              {getContactName(map, rel.sourceContactId)}
                            </span>
                            <span className="text-zinc-500">&mdash;</span>
                            <span className="text-xs text-zinc-400 capitalize">
                              {rel.type.replace(/_/g, " ")}
                            </span>
                            <span className="text-zinc-500">&mdash;</span>
                            <span className="text-zinc-100">
                              {getContactName(map, rel.targetContactId)}
                            </span>
                            <div className="ml-auto flex items-center gap-1">
                              <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{
                                    width: `${(rel.strength / 10) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-zinc-500">
                                {rel.strength}/10
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
