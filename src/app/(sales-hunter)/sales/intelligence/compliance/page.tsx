"use client";

import React, { useState } from "react";

interface CostBreakdown {
  program: string;
  annualCost: number;
  category: string;
}

interface ComplianceResult {
  totalAnnualCost: number;
  costBreakdown: CostBreakdown[];
  riskLevel: "low" | "medium" | "high" | "critical";
  savingsOpportunity: number;
  roiProjection: {
    year1: number;
    year3: number;
    year5: number;
  };
  recommendations: string[];
}

const PROGRAMS = [
  { id: "CAA", label: "Clean Air Act (CAA)" },
  { id: "CWA", label: "Clean Water Act (CWA)" },
  { id: "RCRA", label: "RCRA" },
  { id: "TSCA", label: "TSCA" },
  { id: "EPCRA", label: "EPCRA" },
  { id: "TRI", label: "TRI Reporting" },
  { id: "MACT", label: "MACT Standards" },
  { id: "NSPS", label: "NSPS" },
  { id: "TitleV", label: "Title V Permits" },
  { id: "SPCC", label: "SPCC" },
  { id: "NPDES", label: "NPDES" },
  { id: "RMP", label: "Risk Management Plan (RMP)" },
  { id: "GHG", label: "GHG Reporting" },
  { id: "LDAR", label: "LDAR" },
  { id: "OGI", label: "OGI" },
];

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

export default function CompliancePage() {
  const [facilityCount, setFacilityCount] = useState(1);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [state, setState] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState(50);
  const [hasViolations, setHasViolations] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  function toggleProgram(programId: string) {
    setSelectedPrograms((prev) =>
      prev.includes(programId)
        ? prev.filter((p) => p !== programId)
        : [...prev, programId],
    );
  }

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setCalculating(true);
    try {
      const res = await fetch(
        "/api/sales-hunter/intelligence/compliance/calculate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            facilityCount,
            programs: selectedPrograms,
            state,
            industry,
            employeeCount,
            hasViolations,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Failed to calculate compliance burden:", error);
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          Compliance Burden Calculator
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Estimate regulatory compliance costs and identify savings
          opportunities
        </p>
      </div>

      {/* Calculator Form */}
      <form
        onSubmit={handleCalculate}
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Facility Count *
            </label>
            <input
              type="number"
              min={1}
              required
              value={facilityCount}
              onChange={(e) => setFacilityCount(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">State *</label>
            <input
              type="text"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. TX, CA, OH"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Industry *
            </label>
            <input
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Chemical Manufacturing"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Employee Count
            </label>
            <input
              type="number"
              min={1}
              value={employeeCount}
              onChange={(e) => setEmployeeCount(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <button
              type="button"
              onClick={() => setHasViolations(!hasViolations)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hasViolations ? "bg-red-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hasViolations ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <label className="text-sm text-zinc-400">
              Has prior violations
            </label>
          </div>
        </div>

        {/* Regulatory Programs */}
        <div className="mt-6">
          <label className="block text-sm text-zinc-400 mb-3">
            Regulatory Programs ({selectedPrograms.length} selected)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {PROGRAMS.map((prog) => (
              <label
                key={prog.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                  selectedPrograms.includes(prog.id)
                    ? "border-blue-600 bg-blue-600/10 text-blue-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPrograms.includes(prog.id)}
                  onChange={() => toggleProgram(prog.id)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    selectedPrograms.includes(prog.id)
                      ? "bg-blue-600 border-blue-600"
                      : "border-zinc-600 bg-zinc-700"
                  }`}
                >
                  {selectedPrograms.includes(prog.id) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-xs">{prog.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={calculating || selectedPrograms.length === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-6 py-2 text-sm font-medium transition-colors"
          >
            {calculating ? "Calculating..." : "Calculate Compliance Burden"}
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <p className="text-sm text-zinc-400">Total Annual Cost</p>
              <p className="text-3xl font-bold text-zinc-100 mt-2">
                {formatCurrency(result.totalAnnualCost)}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <p className="text-sm text-zinc-400">Risk Level</p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize mt-2 ${RISK_COLORS[result.riskLevel] ?? ""}`}
              >
                {result.riskLevel}
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <p className="text-sm text-zinc-400">Savings Opportunity</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {formatCurrency(result.savingsOpportunity)}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <p className="text-sm text-zinc-400">ROI Projection</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-zinc-300">
                  1yr:{" "}
                  <span className="font-semibold text-zinc-100">
                    {formatCurrency(result.roiProjection.year1)}
                  </span>
                </p>
                <p className="text-sm text-zinc-300">
                  3yr:{" "}
                  <span className="font-semibold text-zinc-100">
                    {formatCurrency(result.roiProjection.year3)}
                  </span>
                </p>
                <p className="text-sm text-zinc-300">
                  5yr:{" "}
                  <span className="font-semibold text-zinc-100">
                    {formatCurrency(result.roiProjection.year5)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Cost Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 text-left font-medium">Program</th>
                    <th className="pb-3 text-left font-medium">Category</th>
                    <th className="pb-3 text-right font-medium">Annual Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {result.costBreakdown.map((item, i) => (
                    <tr key={i} className="text-zinc-300">
                      <td className="py-3 font-medium text-zinc-100">
                        {item.program}
                      </td>
                      <td className="py-3 text-zinc-400 capitalize">
                        {item.category}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(item.annualCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-700">
                    <td
                      colSpan={2}
                      className="py-3 font-semibold text-zinc-100"
                    >
                      Total
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-100">
                      {formatCurrency(result.totalAnnualCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Recommendations
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">
                      &#8226;
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
