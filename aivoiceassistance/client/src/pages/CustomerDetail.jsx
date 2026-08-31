import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerApi, followUpApi, callApi } from '../services/api';
import { CustomerStatusBadge } from '../components/common/StatusBadge';
import WebRtcCallModal from '../components/calls/WebRtcCallModal';
import { PhoneCall, Calendar, ArrowLeft, FileText, User, CreditCard, Clock, Mic } from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showWebRtc, setShowWebRtc] = useState(false);

  // Modal State for scheduling follow-up
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    reason: 'Follow up on pending document upload',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    priority: 'MEDIUM'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, fRes, callRes] = await Promise.all([
        customerApi.getCustomerById(id),
        followUpApi.getFollowUps({ customerId: id }),
        callApi.getCalls({ customerId: id })
      ]);
      setCustomer(cRes.data.data);
      setFollowUps(fRes.data.data);
      setCalls(callRes.data.data);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCall = async () => {
    setCalling(true);
    setNotice(null);
    try {
      const res = await callApi.initiateCall({ customerId: id });
      setNotice(`Call initiated successfully! ${res.data.message}`);
      setTimeout(() => fetchData(), 4000);
    } catch (err) {
      setNotice(`Call failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCalling(false);
    }
  };

  const handleToggleDocStatus = async (docName, currentStatus) => {
    const nextStatus = currentStatus === 'PENDING' ? 'SUBMITTED' : currentStatus === 'SUBMITTED' ? 'VERIFIED' : 'PENDING';
    const updatedDocs = customer.pendingDocuments.map(d =>
      d.name === docName ? { ...d, status: nextStatus } : d
    );
    try {
      await customerApi.updateCustomer(id, { pendingDocuments: updatedDocs });
      fetchData();
    } catch (err) {
      alert(`Failed to update document status: ${err.message}`);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await followUpApi.createFollowUp({
        customerId: id,
        reason: scheduleData.reason,
        scheduledAt: scheduleData.scheduledAt,
        priority: scheduleData.priority
      });
      setShowScheduleModal(false);
      fetchData();
    } catch (err) {
      alert(`Failed to schedule follow-up: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading customer profile...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-rose-500">Customer profile not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to="/customers" className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-blue-600">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
      </Link>

      {notice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm font-medium flex justify-between items-center">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-blue-600 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
            <CustomerStatusBadge status={customer.customerStatus} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Phone: <span className="font-semibold text-slate-700">{customer.phone}</span> • Email: <span className="font-semibold text-slate-700">{customer.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </button>

          {/* Talk in Browser (Free) */}
          <button
            onClick={() => setShowWebRtc(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
          >
            <Mic className="w-4 h-4" />
            <span>Talk in Browser (Free)</span>
          </button>

          <button
            onClick={handleCall}
            disabled={calling}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm disabled:opacity-50"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{calling ? 'Initiating...' : 'Phone Call'}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Loan Details & Financial Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan & Financial Info */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <CreditCard className="w-4 h-4 text-blue-600" /> Loan Details
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Type:</span>
                <span className="font-semibold text-slate-900">{customer.loan?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Amount:</span>
                <span className="font-bold text-slate-900">₹{customer.loan?.amount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tenure:</span>
                <span className="font-semibold text-slate-900">{customer.loan?.tenure} Months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purpose:</span>
                <span className="font-medium text-slate-800">{customer.loan?.purpose}</span>
              </div>
            </div>
          </div>

          {/* Financial Profile */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <User className="w-4 h-4 text-emerald-600" /> Financial Profile
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Income:</span>
                <span className="font-semibold text-slate-900">₹{customer.financialProfile?.monthlyIncome?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employment Type:</span>
                <span className="font-semibold text-slate-900">{customer.financialProfile?.employmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Credit Score:</span>
                <span className="font-bold text-emerald-600">{customer.financialProfile?.creditScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Documents & Call Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Documents Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <FileText className="w-4 h-4 text-amber-600" /> Document Verification Checklist
            </h2>
            <div className="space-y-2">
              {customer.pendingDocuments?.length === 0 ? (
                <p className="text-sm text-slate-500">No specific document requirements recorded.</p>
              ) : (
                customer.pendingDocuments?.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{doc.name}</p>
                      <p className="text-xs text-slate-500">
                        Status: <span className="font-medium text-slate-700">{doc.status}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleDocStatus(doc.name, doc.status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        doc.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : doc.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      Click to Cycle: {doc.status}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Follow-up History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <Clock className="w-4 h-4 text-purple-600" /> Follow-up Schedule & History
            </h2>
            <div className="space-y-3">
              {followUps.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">No follow-ups recorded yet.</p>
              ) : (
                followUps.map((f) => (
                  <div key={f._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{f.reason}</p>
                      <p className="text-xs text-slate-500">Scheduled: {new Date(f.scheduledAt).toLocaleString()}</p>
                      {f.notes && <p className="text-xs text-slate-600 mt-1 italic">{f.notes}</p>}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xs font-semibold text-slate-700">{f.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WebRTC Live Call Modal */}
      {showWebRtc && (
        <WebRtcCallModal
          customer={customer}
          onClose={() => setShowWebRtc(false)}
          onCallCompleted={fetchData}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Schedule Follow-up Call</h2>
            <form onSubmit={handleScheduleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason / Objective</label>
                <input
                  type="text"
                  required
                  value={scheduleData.reason}
                  onChange={(e) => setScheduleData({ ...scheduleData, reason: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleData.scheduledAt}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
                <select
                  value={scheduleData.priority}
                  onChange={(e) => setScheduleData({ ...scheduleData, priority: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
