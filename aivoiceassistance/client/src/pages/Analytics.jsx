import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { CustomerStatusBadge } from '../components/common/StatusBadge';
import { BarChart3, PieChart, TrendingUp, DollarSign, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-600 font-medium">Loading Conversion Analytics...</span>
      </div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-up & Conversion Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Performance metrics, lead funnel progression, and loan application volume metrics.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Conversion Rate</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{summary.conversionRate}%</h2>
          <p className="text-xs text-emerald-600 mt-1 font-medium">From total potential leads</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total AI Calls</p>
          <h2 className="text-3xl font-extrabold text-blue-600 mt-1">{summary.callsInitiated}</h2>
          <p className="text-xs text-slate-500 mt-1">Outbound AI follow-ups</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Successful Answers</p>
          <h2 className="text-3xl font-extrabold text-emerald-600 mt-1">{summary.answeredCalls}</h2>
          <p className="text-xs text-slate-500 mt-1">Customer conversations</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Documents Collected</p>
          <h2 className="text-3xl font-extrabold text-purple-600 mt-1">{summary.documentsSubmitted}</h2>
          <p className="text-xs text-slate-500 mt-1">Submitted via AI follow-up</p>
        </div>
      </div>

      {/* Grid: Loan Type Breakdown & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Type Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <PieChart className="w-5 h-5 text-blue-600" /> Loan Application Volume by Product
          </h2>
          <div className="space-y-3">
            {data?.loanTypeBreakdown?.map((item) => (
              <div key={item._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-slate-900">{item._id}</p>
                  <p className="text-xs text-slate-500">Total Capital: ₹{item.totalAmount?.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs">
                    {item.count} Applications
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Funnel Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <BarChart3 className="w-5 h-5 text-emerald-600" /> CRM Lead Status Funnel
          </h2>
          <div className="space-y-3">
            {Object.entries(data?.statusBreakdown || {}).map(([status, count]) => {
              const percentage = summary.totalCustomers > 0 ? ((count / summary.totalCustomers) * 100).toFixed(0) : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <CustomerStatusBadge status={status} />
                    <span className="text-slate-700">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
