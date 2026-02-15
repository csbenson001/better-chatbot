"use client";

import { useState, useEffect, useCallback } from "react";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  role: string;
  status: string;
  confidenceScore: number;
  tags: string[];
  enrichedAt: string | null;
  lastContactedAt: string | null;
  createdAt: string;
};

const ROLE_COLORS: Record<string, string> = {
  "decision-maker": "bg-purple-100 text-purple-800",
  "economic-buyer": "bg-purple-100 text-purple-700",
  "executive-sponsor": "bg-purple-100 text-purple-700",
  champion: "bg-blue-100 text-blue-800",
  influencer: "bg-green-100 text-green-800",
  "technical-evaluator": "bg-cyan-100 text-cyan-800",
  gatekeeper: "bg-orange-100 text-orange-800",
  "end-user": "bg-gray-100 text-gray-600",
  unknown: "bg-gray-100 text-gray-500",
};

const STATUS_COLORS: Record<string, string> = {
  identified: "bg-gray-100 text-gray-700",
  verified: "bg-blue-100 text-blue-700",
  enriched: "bg-green-100 text-green-700",
  engaged: "bg-indigo-100 text-indigo-700",
  "opted-out": "bg-red-100 text-red-700",
  bounced: "bg-yellow-100 text-yellow-700",
  stale: "bg-gray-100 text-gray-500",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (roleFilter) params.set("role", roleFilter);
    try {
      const res = await fetch(`/api/sales-hunter/contacts?${params}`);
      const json = await res.json();
      setContacts(json.data || []);
    } catch {
      /* empty */
    }
    setLoading(false);
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleExtractFromFilings = async () => {
    const res = await fetch("/api/sales-hunter/contacts/extract-from-filings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (json.data) {
      alert(
        `Created: ${json.data.contactsCreated}, Updated: ${json.data.contactsUpdated}`,
      );
      fetchContacts();
    }
  };

  const handleEnrich = async (contactId: string) => {
    await fetch(`/api/sales-hunter/contacts/${contactId}/enrich`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    fetchContacts();
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contact Intelligence</h1>
          <p className="text-gray-500">
            Multi-source contact management with enrichment
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExtractFromFilings}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            Extract from Filings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">All Roles</option>
          {Object.keys(ROLE_COLORS).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Contact Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No contacts found
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(c)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{c.company || "-"}</td>
                  <td className="px-4 py-3 text-sm">{c.title || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[c.role] || ROLE_COLORS.unknown}`}
                    >
                      {c.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getConfidenceColor(c.confidenceScore)}`}
                          style={{ width: `${c.confidenceScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {c.confidenceScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || ""}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnrich(c.id);
                      }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Enrich
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l p-6 overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              {selected.firstName} {selected.lastName}
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              x
            </button>
          </div>
          <div className="space-y-3 text-sm">
            {selected.email && (
              <div>
                <span className="text-gray-500">Email:</span> {selected.email}
              </div>
            )}
            {selected.phone && (
              <div>
                <span className="text-gray-500">Phone:</span> {selected.phone}
              </div>
            )}
            {selected.title && (
              <div>
                <span className="text-gray-500">Title:</span> {selected.title}
              </div>
            )}
            {selected.company && (
              <div>
                <span className="text-gray-500">Company:</span>{" "}
                {selected.company}
              </div>
            )}
            <div>
              <span className="text-gray-500">Role:</span>{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs ${ROLE_COLORS[selected.role]}`}
              >
                {selected.role}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Confidence:</span>{" "}
              {selected.confidenceScore}%
            </div>
            {selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleEnrich(selected.id)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
            >
              Enrich Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
