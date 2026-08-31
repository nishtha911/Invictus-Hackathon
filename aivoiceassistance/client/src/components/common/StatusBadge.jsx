import React from 'react';

export function CustomerStatusBadge({ status }) {
  const styles = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-200',
    CONTACTED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    INTERESTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    APPLICATION_STARTED: 'bg-purple-100 text-purple-800 border-purple-200',
    DOCUMENTS_PENDING: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold',
    DOCUMENTS_SUBMITTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    UNDER_REVIEW: 'bg-sky-100 text-sky-800 border-sky-200',
    APPROVED: 'bg-green-100 text-green-800 border-green-200 font-semibold',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
    CALLBACK_REQUESTED: 'bg-orange-100 text-orange-800 border-orange-200 font-semibold animate-pulse',
    NOT_INTERESTED: 'bg-slate-100 text-slate-700 border-slate-200',
    UNREACHABLE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONVERTED: 'bg-teal-100 text-teal-800 border-teal-200 font-bold'
  };

  const style = styles[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  const label = (status || 'UNKNOWN').replace(/_/g, ' ');

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs border uppercase tracking-wider font-medium inline-block ${style}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800 font-semibold',
    URGENT: 'bg-red-100 text-red-800 font-bold animate-pulse'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide font-medium ${styles[priority] || styles.MEDIUM}`}>
      {priority}
    </span>
  );
}

export function CallStatusBadge({ status }) {
  const styles = {
    INITIATED: 'bg-blue-100 text-blue-800',
    RINGING: 'bg-purple-100 text-purple-800 animate-pulse',
    IN_PROGRESS: 'bg-amber-100 text-amber-800 animate-pulse font-semibold',
    COMPLETED: 'bg-emerald-100 text-emerald-800 font-medium',
    NO_ANSWER: 'bg-yellow-100 text-yellow-800',
    BUSY: 'bg-orange-100 text-orange-800',
    FAILED: 'bg-rose-100 text-rose-800',
    CANCELLED: 'bg-slate-100 text-slate-700',
    TRANSFERRED: 'bg-indigo-100 text-indigo-800'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs uppercase font-medium ${styles[status] || 'bg-slate-100 text-slate-800'}`}>
      {(status || 'UNKNOWN').replace(/_/g, ' ')}
    </span>
  );
}

export function SentimentBadge({ sentiment }) {
  const styles = {
    POSITIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NEUTRAL: 'bg-slate-50 text-slate-700 border-slate-200',
    NEGATIVE: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${styles[sentiment] || styles.NEUTRAL}`}>
      {sentiment}
    </span>
  );
}
