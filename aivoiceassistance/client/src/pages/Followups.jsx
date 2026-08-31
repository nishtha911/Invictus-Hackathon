import React, { useState, useEffect } from 'react';
import { followUpApi, callApi } from '../services/api';
import { PriorityBadge } from '../components/common/StatusBadge';
import { Calendar, PhoneCall, RefreshCw, AlertCircle, Clock } from 'lucide-react';

export default function Followups() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [callingId, setCallingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await followUpApi.getFollowUps(params);
      setFollowUps(res.data.data);
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [statusFilter]);

  const handleCallFromFollowUp = async (followUp) => {
    const customerId = followUp.customerId?._id || followUp.customerId;
    setCallingId(followUp._id);
    setNotice(null);
    try {
      const res = await callApi.initiateCall({
        customerId,
        followUpId: followUp._id,
        customObjective: followUp.reason
      });
      setNotice(`AI Call initiated! ${res.data.message}`);
      setTimeout(() => fetchFollowUps(), 4000);
    } catch (err) {
      setNotice(`Call failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCallingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-up Schedule Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated node-cron scheduler processes due follow-ups every 60 seconds.
          </p>
        </div>
        <button
          onClick={fetchFollowUps}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {notice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm font-medium flex justify-between items-center">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-blue-600 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {['ALL', 'SCHEDULED', 'CALLING', 'COMPLETED', 'FAILED', 'REQUIRES_HUMAN'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Follow-up List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading follow-up queue...</span>
          </div>
        ) : followUps.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No follow-ups found for this status.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Reason / Objective</th>
                  <th className="px-6 py-4">Scheduled Date</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Attempts</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map((f) => {
                  const customerName = f.customerId?.name || 'Customer';
                  const customerPhone = f.customerId?.phone || '';
                  return (
                    <tr key={f._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{customerName}</span>
                        <p className="text-xs text-slate-500">{customerPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800 line-clamp-1">{f.reason}</p>
                        {f.notes && <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">{f.notes}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">{new Date(f.scheduledAt).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={f.priority} />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {f.attempts} / {f.maxAttempts}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            f.status === 'REQUIRES_HUMAN'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                              : f.status === 'CALLING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : f.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {f.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleCallFromFollowUp(f)}
                          disabled={callingId === f._id || f.status === 'CALLING'}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs shadow-sm transition disabled:opacity-50"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{callingId === f._id ? 'Initiating...' : 'Trigger Call Now'}</span>
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
    </div>
  );
}
