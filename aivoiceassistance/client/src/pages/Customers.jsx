import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerApi, callApi } from '../services/api';
import { CustomerStatusBadge } from '../components/common/StatusBadge';
import WebRtcCallModal from '../components/calls/WebRtcCallModal';
import { Search, Plus, PhoneCall, RefreshCw, Filter, FileText, Mic } from 'lucide-react';

const STATUS_OPTIONS = [
  'ALL', 'NEW', 'CONTACTED', 'INTERESTED', 'APPLICATION_STARTED',
  'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW',
  'APPROVED', 'REJECTED', 'CALLBACK_REQUESTED', 'NOT_INTERESTED', 'UNREACHABLE', 'CONVERTED'
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [callingId, setCallingId] = useState(null);
  const [callNotice, setCallNotice] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [webRtcCustomer, setWebRtcCustomer] = useState(null);

  // New Customer Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredLanguage: 'English',
    preferredCallTime: 'Morning (9 AM - 12 PM)',
    loan: {
      type: 'Personal Loan',
      amount: 500000,
      tenure: 36,
      purpose: 'General Purpose'
    },
    financialProfile: {
      monthlyIncome: 75000,
      employmentType: 'Salaried',
      existingEMI: 10000,
      creditScore: 750
    }
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await customerApi.getCustomers(params);
      setCustomers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleCallCustomer = async (customer) => {
    setCallingId(customer._id);
    setCallNotice(null);
    try {
      const res = await callApi.initiateCall({ customerId: customer._id });
      setCallNotice(`Calling ${customer.name}... ${res.data.message}`);
      setTimeout(() => fetchCustomers(), 4000);
    } catch (err) {
      setCallNotice(`Call failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCallingId(null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await customerApi.createCustomer(formData);
      setShowAddModal(false);
      fetchCustomers();
    } catch (err) {
      alert(`Error creating customer: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Potential Customer Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage leads, track loan plans, and initiate voice calls.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Potential Customer</span>
        </button>
      </div>

      {callNotice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm font-medium flex justify-between items-center">
          <span>{callNotice}</span>
          <button onClick={() => setCallNotice(null)} className="text-blue-600 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition"
          >
            Search
          </button>
        </form>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading customer list...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No potential customers match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Loan Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Pending Docs</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const pendingDocsCount = c.pendingDocuments?.filter(d => d.status === 'PENDING').length || 0;
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <Link to={`/customers/${c._id}`} className="font-bold text-slate-900 hover:text-blue-600 hover:underline">
                          {c.name}
                        </Link>
                        <p className="text-xs text-slate-500">{c.phone} • {c.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">{c.loan?.type}</span>
                        <p className="text-xs text-slate-500">₹{c.loan?.amount?.toLocaleString('en-IN')} ({c.loan?.tenure}m)</p>
                      </td>
                      <td className="px-6 py-4">
                        <CustomerStatusBadge status={c.customerStatus} />
                      </td>
                      <td className="px-6 py-4">
                        {pendingDocsCount > 0 ? (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            {pendingDocsCount} Pending
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            Complete
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {/* Free Browser WebRTC Call Button */}
                        <button
                          onClick={() => setWebRtcCustomer(c)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Talk in Browser (Free)</span>
                        </button>

                        <button
                          onClick={() => handleCallCustomer(c)}
                          disabled={callingId === c._id}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs shadow-sm transition disabled:opacity-50"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{callingId === c._id ? 'Calling...' : 'Phone Call'}</span>
                        </button>

                        <Link
                          to={`/customers/${c._id}`}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium text-xs transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WebRTC Live Browser Call Modal */}
      {webRtcCustomer && (
        <WebRtcCallModal
          customer={webRtcCustomer}
          onClose={() => setWebRtcCustomer(null)}
          onCallCompleted={fetchCustomers}
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Add New Potential Customer</h2>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Loan Type</label>
                  <select
                    value={formData.loan.type}
                    onChange={(e) => setFormData({ ...formData, loan: { ...formData.loan, type: e.target.value } })}
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Personal Loan</option>
                    <option>Home Loan</option>
                    <option>Education Loan</option>
                    <option>Business Loan</option>
                    <option>Vehicle Loan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Requested Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.loan.amount}
                    onChange={(e) => setFormData({ ...formData, loan: { ...formData.loan, amount: Number(e.target.value) } })}
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
