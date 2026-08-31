import React, { useState, useEffect } from 'react';
import { callApi } from '../services/api';
import { CallStatusBadge, SentimentBadge } from '../components/common/StatusBadge';
import TranscriptModal from '../components/calls/TranscriptModal';
import { PhoneCall, RefreshCw, FileText, AlertTriangle } from 'lucide-react';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await callApi.getCalls();
      setCalls(res.data.data);
    } catch (err) {
      console.error('Failed to fetch call logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Voice Call History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete call logs, provider call IDs, AI transcript summaries, customer intent & sentiment analysis.
          </p>
        </div>
        <button
          onClick={fetchCalls}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading call logs...</span>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No voice call records found yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Intent / Sentiment</th>
                  <th className="px-6 py-4">Summary</th>
                  <th className="px-6 py-4">Call Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calls.map((c) => {
                  const customerName = c.customerId?.name || 'Customer';
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{customerName}</span>
                        <p className="text-xs text-slate-500">{c.phoneNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <CallStatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-blue-800 block">
                            {c.customerIntent || 'UNKNOWN'}
                          </span>
                          <SentimentBadge sentiment={c.sentiment} />
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-xs text-slate-700 line-clamp-2">{c.summary || 'Call completed'}</p>
                        {c.requiresHuman && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 mt-1 bg-rose-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Human Escalation
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleString()}
                        {c.duration > 0 && <span className="block text-slate-400 mt-0.5">{c.duration}s</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCall(c)}
                          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Transcript</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedCall && (
        <TranscriptModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}
