import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi, callApi } from '../services/api';
import { CustomerStatusBadge, CallStatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { Users, PhoneCall, Calendar, AlertTriangle, CheckCircle2, TrendingUp, Phone, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState(null);
  const [callNotice, setCallNotice] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickCall = async (customerId, customerName) => {
    setCallingId(customerId);
    setCallNotice(null);
    try {
      const res = await callApi.initiateCall({ customerId });
      setCallNotice(`AI Voice Call initiated for ${customerName}! ${res.data.message}`);
      setTimeout(() => fetchDashboard(), 4000);
    } catch (err) {
      setCallNotice(`Call initiation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCallingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-600 font-medium">Loading Dashboard Metrics...</span>
      </div>
    );
  }

  const summary = data?.summary || {};

  const kpis = [
    { title: 'Total Potential Customers', value: summary.totalCustomers, icon: Users, color: 'bg-blue-500' },
    { title: 'Follow-ups Due Today', value: summary.dueTodayFollowUps, icon: Calendar, color: 'bg-amber-500' },
    { title: 'Calls Initiated', value: summary.callsInitiated, icon: PhoneCall, color: 'bg-indigo-500' },
    { title: 'Answered Calls', value: summary.answeredCalls, icon: CheckCircle2, color: 'bg-emerald-500' },
    { title: 'Human Escalations', value: summary.humanEscalations, icon: AlertTriangle, color: 'bg-rose-500' },
    { title: 'Conversion Rate', value: `${summary.conversionRate}%`, icon: TrendingUp, color: 'bg-teal-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">AI Follow-up & Voice Calling CRM</h1>
          <p className="text-blue-200 text-sm mt-1">
            Automated customer outreach, instant AI calling, status updates, and post-call analytics.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {callNotice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm font-medium flex justify-between items-center">
          <span>{callNotice}</span>
          <button onClick={() => setCallNotice(null)} className="text-blue-600 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl ${kpi.color} text-white flex items-center justify-center shadow-md`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Content: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-blue-600" />
              Recent AI Outbound Calls
            </h2>
            <Link to="/calls" className="text-sm font-semibold text-blue-600 hover:underline">
              View All Calls →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentCalls?.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No recent calls recorded yet.</p>
            ) : (
              data?.recentCalls?.map((call) => (
                <div key={call._id} className="py-3.5 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm">{call.customerId?.name || 'Customer'}</p>
                      <CustomerStatusBadge status={call.customerId?.customerStatus} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phone: {call.phoneNumber} • {new Date(call.createdAt).toLocaleString()}
                    </p>
                    {call.summary && (
                      <p className="text-xs text-slate-600 italic mt-1 line-clamp-1">"{call.summary}"</p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <CallStatusBadge status={call.status} />
                    {call.duration > 0 && (
                      <span className="text-xs text-slate-500">{call.duration}s</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Distribution Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Lead Status Summary</h2>
          <div className="space-y-3">
            {Object.entries(data?.statusBreakdown || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center text-sm">
                <CustomerStatusBadge status={status} />
                <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">{count}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <Link
              to="/customers"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Manage Potential Customers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
