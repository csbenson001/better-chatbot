"use client";

import React, { useCallback, useEffect, useState } from "react";

interface ComponentSignal {
  name: string;
  score: number;
  weight: number;
}

interface BuyingSignal {
  id: string;
  prospectId: string;
  prospectName: string;
  signalType: string;
  compositeScore: number;
  components: ComponentSignal[];
  recommendedAction: string;
  optimalTiming: string;
  detectedAt: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function scoreBorderColor(score: number): string {
  if (score >= 80) return "border-l-green-500";
  if (score >= 60) return "border-l-yellow-500";
  if (score >= 40) return "border-l-orange-500";
  return "border-l-red-500";
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<BuyingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [prospectId, setProspectId] = useState("");
  const [detecting, setDetecting] = useState(false);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales-hunter/intelligence/signals");
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.signals ?? []).sort(
          (a: BuyingSignal, b: BuyingSignal) =>
            b.compositeScore - a.compositeScore,
        );
        setSignals(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch signals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  async function handleDetect(e: React.FormEvent) {
    e.preventDefault();
    if (!prospectId.trim()) return;
    setDetecting(true);
    try {
      const res = await fetch("/api/sales-hunter/intelligence/signals/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      if (res.ok) {
        setProspectId("");
        fetchSignals();
      }
    } catch (error) {
      console.error("Failed to detect signals:", error);
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Buying Signals</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Detect and track buying intent signals
          </p>
        </div>
      </div>

      {/* Detect Signals Form */}
      <form
        onSubmit={handleDetect}
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
      >
        <h3 className="text-sm font-semibold text-zinc-100 mb-3">
          Detect Buying Signals
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
            disabled={detecting}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            {detecting ? "Detecting..." : "Detect Signals"}
          </button>
        </div>
      </form>

      {/* Signal Cards */}
      {loading ? (
        <div className="text-center text-zinc-400 py-8">Loading...</div>
      ) : signals.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">
          No buying signals detected yet. Enter a Prospect ID above to scan for
          signals.
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className={`bg-zinc-900 border border-zinc-800 rounded-lg p-5 border-l-4 ${scoreBorderColor(signal.compositeScore)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {signal.prospectName}
                    </h3>
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-700/50 text-zinc-300 capitalize">
                      {signal.signalType.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Composite Score Bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreBgColor(signal.compositeScore)}`}
                        style={{ width: `${signal.compositeScore}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold ${scoreColor(signal.compositeScore)}`}
                    >
                      {signal.compositeScore}
                    </span>
                  </div>

                  {/* Component Signals */}
                  {signal.components.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {signal.components.map((comp, i) => (
                        <div
                          key={i}
                          className="bg-zinc-800 rounded-md px-2 py-1"
                        >
                          <span className="text-xs text-zinc-400">
                            {comp.name}:{" "}
                          </span>
                          <span
                            className={`text-xs font-medium ${scoreColor(comp.score)}`}
                          >
                            {comp.score}
                          </span>
                          <span className="text-xs text-zinc-600 ml-1">
                            (w:{comp.weight})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommended Action & Timing */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-zinc-800/50 rounded-md px-3 py-2">
                      <p className="text-xs text-zinc-500">
                        Recommended Action
                      </p>
                      <p className="text-sm text-zinc-200 mt-0.5">
                        {signal.recommendedAction}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-md px-3 py-2">
                      <p className="text-xs text-zinc-500">Optimal Timing</p>
                      <p className="text-sm text-zinc-200 mt-0.5">
                        {signal.optimalTiming}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-600 mt-3">
                Detected {new Date(signal.detectedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
